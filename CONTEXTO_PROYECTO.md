# Contexto del proyecto

> Documento de referencia para futuras modificaciones. Elaborado el 27-07-2026 a partir del código presente en el repositorio.

## 1. Resumen ejecutivo

`tools-administracion-lt-uds` es una aplicación web interna para reunir herramientas de administración y soporte técnico. Está compuesta por:

- Frontend React 19 + Vite 6, servido bajo el subdirectorio `/tools/`.
- API Node.js + Express 5, publicada bajo `/tools/api` y normalmente expuesta por Apache hacia el puerto local `3001`.
- Persistencia principal en SQLite (`projects.sqlite`).
- Configuraciones de despliegue continuo almacenadas como archivos JSON en `data/configs/<projectId>.json`.
- Suite de pruebas Jest/Supertest para la API.

El núcleo funcional es la gestión de proyectos, usuarios, revisiones/checklists, notas, archivos y configuraciones de despliegue continuo. También existen herramientas autónomas para generar planes JMeter, procesar reportes PHPStan y generar solicitudes de servidores mediante plantillas DOCX.

## 2. Estructura relevante

```text
src/
  App.jsx                         Router, layout y providers globales
  api.js                          Cliente Axios del frontend
  pages/                          Pantallas principales
  components/                     Componentes reutilizables y formularios
  hooks/                          Hooks de lógica específica
  config/                         Valores por defecto de CD
  utils/                          Constantes y utilidades de presentación
  api/
    server.js                     Aplicación Express y montaje de routers
    db.js                         Inicialización/conexión SQLite
    middleware/                   Validaciones compartidas
    routes/                       Endpoints de la API
tests/                            Pruebas de endpoints
data/configs/                     JSON de configuraciones por proyecto
tools.conf                        Configuración Apache de proxy y SPA
ecosystem.config.cjs              Configuración PM2
```

Los alias de frontend definidos en `vite.config.js` son `@` → `src`, `@c` → `src/components`, `@a` → `src/assets`, `@hk` → `src/hooks` y `@u` → `src/utils`.

## 3. Ejecución y despliegue

Comandos declarados en `package.json`:

```bash
npm run dev       # Vite
npm run build     # Build frontend en dist/
npm run preview   # Previsualización del build
npm run api       # API Express en Node
npm run lint      # ESLint
npm test          # Jest
```

La configuración actual de producción espera:

- Node 22.11.0 en `ecosystem.config.cjs`.
- API en `0.0.0.0:3001`.
- Apache proxyando `/tools/api/` a `http://localhost:3001/tools/api/`.
- Apache sirviendo `dist/` como `/tools` y aplicando fallback SPA para rutas que no sean API.

Variables observadas:

```env
VITE_BASE_URL=tools
VITE_API_URL=https://<host>/tools/api
```

`src/App.jsx` usa `VITE_BASE_URL` como `basename` de React Router. El servidor Express, en cambio, monta las rutas literalmente con `/tools/api`. El puerto está fijado en `3001` dentro de `src/api/server.js`; el `PORT` del archivo PM2/systemd no se consume actualmente por el código.

## 4. Rutas del frontend

| Ruta | Pantalla | Protección |
|---|---|---|
| `/` | Inicio | Pública |
| `/projects` | Lista, alta/edición y finalización de proyectos | `RequireAuth` |
| `/projects/:id/detail` | Detalle del proyecto | `RequireAuth` |
| `/projects/:id/review` | Revisiones y exportación Excel | `RequireAuth` |
| `/projects/:id/notes` | Notas | `RequireAuth` |
| `/projects/:id/files` | Archivos | `RequireAuth` |
| `/projects/:id/continuous-deployment` | Configuración/generación de CD | `RequireAuth` |
| `/jmeter-test-creator` | Generador/importador JMX | Pública |
| `/phpstan` | Visor y exportación de reportes PHPStan | Pública |
| `/solicitud-maquina-virtual-upt` | Generador de solicitud de servidor | Pública |

El sidebar se colapsa automáticamente por debajo de 768 px y guarda su estado manual en `localStorage`. La autenticación actual es exclusivamente de frontend: `RequireAuth` compara las credenciales hardcodeadas `admin` / `1234` y guarda `authenticated=true` en `sessionStorage`. No existe middleware de autenticación en la API.

## 5. API implementada

Todas las rutas se montan desde `src/api/server.js` con el prefijo `/tools/api`.

| Recurso | Endpoints implementados | Persistencia |
|---|---|---|
| Usuarios | `GET/POST /users` | SQLite `users` |
| Proyectos | `GET/POST /projects`, `GET/PUT/DELETE /projects/:id`, `PATCH /projects/:id/terminate` | SQLite `projects`, `project_developers` |
| Revisiones | `GET/POST /projects/:id/reviews`, `DELETE /projects/:id/reviews` | SQLite `project_reviews`, `review_point_results` |
| Checklist | `GET /checklist` | SQLite `checklist_aspects`, `checklist_points` |
| Notas | `GET/POST /projects/:id/notes`, `PUT/DELETE /projects/:id/notes` | SQLite `project_notes` |
| Archivos | `GET/POST /projects/:id/files`, descarga, preview de imagen y delete | SQLite `project_files` como BLOB |
| CD | `GET/POST/DELETE /projects/:id/configs` | JSON en `data/configs` |

La ruta `test.routes.js` existe, pero no se monta actualmente en `server.js`.

Las operaciones mutables relacionadas con proyectos, notas, revisiones y archivos usan `validateActiveProject`, que bloquea modificaciones cuando `projects.termination_date` no es `NULL`. La consulta de proyectos activos excluye proyectos finalizados.

`GET /projects` acepta `status=active` (valor predeterminado) o `status=finished` para seleccionar proyectos activos o finalizados. Un valor diferente responde con `400`. En la interfaz, el cambio se realiza mediante un switch ubicado junto al buscador; el listado muestra además el total de registros resultantes de la búsqueda.

## 6. Modelo de datos

`src/api/db.js` crea las tablas al ejecutar `openDb()` si no existen. El archivo utilizado es `./projects.sqlite`, relativo al directorio de trabajo del proceso.

Entidades:

- `users(id, name)`.
- `projects(id, name, code, coordinator_id, termination_date)`.
- `project_developers(project_id, user_id)` como relación muchos-a-muchos.
- `checklist_aspects` y `checklist_points` para la plantilla de evaluación.
- `project_reviews(project_id, applied_at, note)`.
- `review_point_results(review_id, point_id, status, observation)`.
- `project_notes(project_id, detail, created_at, updated_at)`.
- `project_files(project_id, filename, file_data, mime_type, file_size)`.

La inicialización contiene migraciones ad hoc para `note` y `termination_date`, además de insertar un checklist inicial si está vacío. No hay un sistema formal de migraciones ni una estrategia explícita de cierre/reutilización de conexiones.

## 7. Flujos principales

### Gestión de proyectos

`Projects.jsx` obtiene proyectos y usuarios, permite crear/editar usuarios y proyectos, filtrar/ordenar/paginar la lista y marcar un proyecto como finalizado. El alta y edición de proyecto requieren `name`, `code`, `coordinator_id` y un arreglo `developer_ids`.

### Revisiones

La pantalla obtiene el checklist y las revisiones de un proyecto. Una revisión guarda fecha, observaciones generales y resultados por punto con estados `bien`, `regular`, `deficiente` o vacío. También genera un archivo Excel en el navegador.

### Notas y archivos

Las notas se almacenan como texto en SQLite. Los archivos se reciben con Multer en memoria, con límite de 10 MB por archivo, y se guardan como BLOB. Las descargas usan el nombre y MIME almacenados; las previews solo permiten imágenes.

### Despliegue continuo

`ContinuousDeploymentForm` mantiene una configuración compleja en memoria, la guarda por nombre en un JSON por proyecto y genera YAML/scripts de despliegue en el cliente. Los valores base están en `src/config/ContinuousDeploymentDefaults.jsx`.

### Herramientas independientes

- JMeter: edición de plan, solicitudes, threads, timers, listeners, CSV y assertions; importa/exporta JMX mediante utilidades propias.
- PHPStan: carga/parsea información y exporta con ExcelJS.
- Solicitud de servidores: usa Docxtemplater/PizZip para producir documentos a partir de plantillas.

## 8. Pruebas y estado de validación

Las pruebas cubren usuarios, proyectos, notas, revisiones, archivos, checklist y configuraciones. Usan mocks de `openDb`, mocks de `fs` y un servidor HTTP local.

En el entorno analizado (`node v14.21.3`, pese a que el proyecto requiere Node 22) se ejecutaron `npm test`, `npm run lint` y `npm run build`, con estos resultados:

- `npm test`: 7 suites / 43 tests fallan antes de ejercer correctamente los endpoints. El error principal es `Object.hasOwn is not a function` al inicializar Express; también aparece `ERR_VM_MODULE_NOT_MODULE` y una incompatibilidad de importación ESM de `@jest/globals`.
- `npm run lint`: falla al cargar Espree por el mismo `Object.hasOwn is not a function`.
- `npm run build`: falla al procesar sintaxis moderna (`||=`) con Node 14.

Por tanto, el resultado no representa necesariamente defectos funcionales de cada endpoint; primero debe repetirse la validación con Node 22. El `jest.config.js` contiene `runInBand`, que es una opción de CLI y produce una advertencia de configuración desconocida.

## 9. Riesgos y desalineaciones relevantes

Prioridad alta:

1. **Versión de Node**: `package.json`/despliegue esperan Node 22, pero el entorno que ejecuta los comandos puede usar Node 14. Verificar `node -v` antes de diagnosticar código.
2. **Autenticación insuficiente**: credenciales hardcodeadas y protección solo visual; cualquiera que consuma la API puede invocar endpoints mutables.
3. **Errores no centralizados**: varias rutas no tienen `try/catch` para todas las operaciones y devuelven detalles internos (`err`) en algunas respuestas.
4. **Integridad transaccional**: creación/edición de proyectos y creación de revisiones hacen varias escrituras sin transacción completa.
5. **Archivos y ciclo de vida**: al eliminar un proyecto no se eliminan explícitamente sus archivos BLOB ni el JSON de configuración.

Prioridad media:

6. **Contrato incompleto**: el frontend intenta `PUT /users/:id`, pero no hay endpoint PUT de usuarios implementado.
7. **Documentación desactualizada**: README menciona endpoints de métricas, reportes, estados, JMeter y PHPStan que no aparecen en los routers actuales; también usa `VITE_BASE_PATH`, mientras el código usa `VITE_BASE_URL`.
8. **Configuración duplicada**: `vite.config.js`, `.env`, `tools.conf`, README y `API_DEPLOYMENT.md` contienen partes del contrato de despliegue que pueden divergir.
9. **SQLite relativo al cwd**: cambiar el directorio de arranque puede crear/usar otra base de datos accidentalmente.
10. **Escalabilidad de BLOB**: archivos de hasta 10 MB se cargan completos en memoria y se almacenan dentro de SQLite.

Prioridad baja:

11. `index.html` conserva favicon de Vite y título `Vite + React`.
12. Hay logs de depuración en código de frontend y documentación de despliegue con ejemplos que no coinciden del todo con los archivos actuales (`ecosystem.config.js` vs `.cjs`).

## 10. Convenciones para futuras modificaciones

Antes de cambiar una funcionalidad:

1. Identificar si el cambio cruza frontend, API, SQLite, JSON de configuración y Apache; mantener el contrato alineado en todas las capas.
2. Confirmar la ruta efectiva completa, incluyendo `/tools/api`, `VITE_API_URL` y `basename`.
3. Revisar primero si el proyecto está activo cuando el cambio sea mutación de datos.
4. Para varias escrituras relacionadas, usar transacción y definir el comportamiento ante rollback.
5. Mantener respuestas JSON y códigos HTTP consistentes; no devolver errores internos al cliente.
6. Añadir o actualizar pruebas de endpoint, incluyendo validación, 404, proyecto finalizado y error de persistencia.
7. Ejecutar validaciones con Node 22: `npm run lint`, `npm test -- --runInBand` y `npm run build`.
8. No editar `projects.sqlite`, `dist/`, logs ni `.env` como parte de cambios de código salvo que el objetivo lo requiera explícitamente.

## 11. Secuencia recomendada de mejora

1. Normalizar la versión de Node y hacer reproducibles lint, build y tests.
2. Corregir el contrato de configuración (`VITE_BASE_URL`, `VITE_API_URL`, puerto y rutas) y actualizar README.
3. Implementar autenticación real en API y eliminar credenciales hardcodeadas.
4. Formalizar migraciones SQLite, claves foráneas, transacciones y cierre de recursos.
5. Centralizar manejo de errores/validación y extraer servicios de acceso a datos.
6. Definir explícitamente el ciclo de vida de archivos y configuraciones al finalizar/eliminar proyectos.
7. Separar y testear la lógica compleja de JMeter, CD, PHPStan y generación DOCX.

## 12. Archivos de referencia rápida

- Entrada frontend: `src/main.jsx`, `src/App.jsx`.
- Cliente HTTP: `src/api.js`.
- Entrada API: `src/api/server.js`.
- Persistencia: `src/api/db.js`.
- Validación de proyectos: `src/api/middleware/projects.middleware.js`.
- Contrato de despliegue web: `tools.conf`.
- Proceso API: `ecosystem.config.cjs`.
- Pruebas: `tests/*.test.js`.
