# Contexto del proyecto

> Documento de referencia para futuras modificaciones. Elaborado el 27-07-2026 y actualizado el 25-09-2026 tras la reestructuración (rama `refactor/reestructurar-proyecto`).

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
  App.jsx                         Proveedores (sesión, toasts, diálogos), cabecera y rutas
  api.js                          Cliente Axios del frontend
  services/                       Llamadas a la API por recurso
  pages/                          Pantallas principales
  components/                     Componentes por dominio; layout/ tiene Cabecera y ProjectPageLayout
  hooks/                          useProjects, useTheme, useJMeterGenerator, useBreadcrumb
  config/                         Valores por defecto de CD
  utils/                          Estados de revisión, búsqueda sin tildes, exportación Excel, CodePreview
  styles/                         base.css y bootstrap-bridge.css (skill estilo-personal)
  api/
    server.js                     Aplicación Express, routers, 404 y manejador de errores
    db.js                         Conexión SQLite única, esquema, migraciones y seed
    lib/                          paths (DB_PATH, CONFIGS_DIR), withTransaction, configStore
    middleware/                   validateActiveProject y error.middleware
    routes/                       Endpoints de la API
tests/                            Pruebas de endpoints
data/configs/                     JSON de configuraciones por proyecto
docs/despliegue.md                Apache, PM2 y systemd
tools.conf                        Configuración Apache de proxy y SPA
ecosystem.config.cjs              Configuración PM2
.github/workflows/ci.yml          Lint, tests y build con Node 22
```

Los alias de frontend definidos en `vite.config.js` son `@` → `src`, `@c` → `src/components`, `@a` → `src/assets`, `@hk` → `src/hooks` y `@u` → `src/utils`.

## 3. Ejecución y despliegue

Comandos declarados en `package.json` (con Node 22, `nvm use`):

```bash
npm run dev        # Vite
npm run build      # Build frontend en dist/ (lo sirve Apache)
npm run api        # API Express
npm run api:dev    # API con node --watch
npm run lint       # ESLint
npm test           # Jest
npm run validate   # lint + test + build
```

La configuración de producción espera:

- Node 22.11.0 (`.nvmrc`, `engines` y el intérprete de `ecosystem.config.cjs`).
- API en `0.0.0.0:${PORT:-3001}`.
- Apache proxyando `/tools/api/` a `http://localhost:3001/tools/api/` y sirviendo `dist/` como `/tools` con fallback SPA.

Variables:

```env
VITE_BASE_URL=/tools                    # basename de React Router
VITE_API_URL=https://<host>/tools/api   # base del cliente axios
PORT=3001                               # API (entorno del proceso)
DB_PATH=<repo>/projects.sqlite          # API, opcional
CONFIGS_DIR=<repo>/data/configs         # API, opcional
```

El servidor Express monta las rutas bajo el prefijo `API_PREFIX = '/tools/api'`. Detalle en `docs/despliegue.md`.

## 4. Rutas del frontend

| Ruta | Pantalla | Protección |
|---|---|---|
| `/` | Inicio: tarjetas de las herramientas | Pública |
| `/projects` | Lista, alta de usuarios y proyectos, finalización | `RequireAuth` |
| `/projects/:id/detail` | Detalle del proyecto | `RequireAuth` |
| `/projects/:id/review` | Revisiones y exportación Excel | `RequireAuth` |
| `/projects/:id/notes` | Notas | `RequireAuth` |
| `/projects/:id/files` | Archivos | `RequireAuth` |
| `/projects/:id/continuous-deployment` | Configuración/generación de CD | `RequireAuth` |
| `/jmeter-test-creator` | Generador/importador JMX | Pública |
| `/phpstan` | Visor y exportación de reportes PHPStan | Pública |
| `/solicitud-maquina-virtual-upt` | Generador de solicitud de servidor | Pública |

La navegación es una cabecera sticky (`Cabecera.jsx`) con marca, secciones, botón Tema y Salir. La autenticación sigue siendo exclusivamente de frontend: `SessionContext` compara las credenciales fijas `admin` / `1234` y guarda `authenticated=true` en `sessionStorage`. La API no tiene middleware de autenticación.

## 5. API implementada

Todas las rutas se montan desde `src/api/server.js` con el prefijo `/tools/api`. Una ruta inexistente responde `404 { error: 'Ruta no encontrada' }` y cualquier error no controlado responde `500 { error: 'Error interno del servidor' }` sin detalles.

| Recurso | Endpoints implementados | Persistencia |
|---|---|---|
| Usuarios | `GET/POST /users`, `PUT /users/:id` | SQLite `users` |
| Proyectos | `GET/POST /projects`, `GET/PUT/DELETE /projects/:id`, `PATCH /projects/:id/terminate` | SQLite `projects`, `project_developers` |
| Revisiones | `GET/POST /projects/:id/reviews`, `DELETE /projects/:id/reviews` | SQLite `project_reviews`, `review_point_results` |
| Checklist | `GET /checklist` | SQLite `checklist_aspects`, `checklist_points` |
| Notas | `GET/POST /projects/:id/notes`, `PUT/DELETE /projects/:id/notes` | SQLite `project_notes` |
| Archivos | `GET/POST /projects/:id/files`, descarga, preview de imagen y delete | SQLite `project_files` como BLOB |
| CD | `GET/POST/DELETE /projects/:id/configs` | JSON en `CONFIGS_DIR` (`data/configs`) |

Las operaciones mutables relacionadas con proyectos, notas, revisiones y archivos usan `validateActiveProject`, que bloquea modificaciones cuando `projects.termination_date` no es `NULL`.

`GET /projects` acepta `status=active` (valor predeterminado) o `status=finished`. Un valor diferente responde con `400`. Los desarrolladores de todos los proyectos se obtienen en una sola consulta.

Las escrituras múltiples (POST/PUT/DELETE de proyectos, POST/DELETE de revisiones y subida de archivos) usan `withTransaction`. `DELETE /projects/:id` elimina en cascada revisiones y resultados, notas, archivos, desarrolladores y el JSON de configuraciones.

## 6. Modelo de datos

`src/api/db.js` abre una **conexión única** (memoizada) a `DB_PATH` o, por defecto, a `projects.sqlite` en la raíz del repo, sin depender del directorio de arranque. Al abrirla por primera vez crea las tablas si no existen, activa `PRAGMA foreign_keys`, aplica las migraciones y siembra el checklist.

Entidades:

- `users(id, name)`.
- `projects(id, name, code, coordinator_id, termination_date)`.
- `project_developers(project_id, user_id)` como relación muchos-a-muchos.
- `checklist_aspects` y `checklist_points` para la plantilla de evaluación.
- `project_reviews(project_id, applied_at, note)`.
- `review_point_results(review_id, point_id, status, observation)`.
- `project_notes(project_id, detail, created_at, updated_at)`.
- `project_files(project_id, filename, file_data, mime_type, file_size)`.

Migraciones ad hoc e idempotentes: columnas `note` y `termination_date`, y limpieza de `review_point_results` huérfanos (el borrado de revisiones anterior a la cascada los dejaba: 492 filas en la base de producción al 25-09-2026). No hay un sistema formal de migraciones.

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

Las pruebas cubren usuarios (incluido PUT), proyectos (incluidos finalización, transacciones y cascada), notas, revisiones (incluido el rollback), archivos (incluidos preview y Content-Disposition), checklist, configuraciones, el middleware de proyectos finalizados y el manejo central de errores. Usan mocks de `openDb` y `fs`, con `DB_PATH=:memory:` y `CONFIGS_DIR` temporal.

Estado al 25-09-2026 con Node 22.11.0:

- `npm test`: 7 suites y 62 tests en verde, estables en ejecuciones repetidas.
- `npm run lint`: 0 errores. Quedan advertencias de `react-hooks/exhaustive-deps` y `react-refresh` en componentes existentes.
- `npm run build`: correcto (con aviso de tamaño de chunk por ExcelJS, Docxtemplater y otras librerías).

El frontend no tiene pruebas automatizadas. La reestructuración se verificó con lint, build y un render SSR de cada ruta, pero no en un navegador: queda pendiente la revisión visual en tema claro y oscuro.

## 9. Riesgos y deuda vigente

Resuelto en la reestructuración:

- Versión de Node reproducible (`.nvmrc`, `engines`, CI), lint y tests en verde.
- Conexión SQLite única, ruta absoluta, transacciones en escrituras múltiples y cascada al eliminar proyectos.
- Errores centralizados sin exponer detalles internos, y `PUT /users/:id` implementado.
- README, despliegue y variables alineados con el código.

Pendiente, prioridad alta:

1. **Autenticación insuficiente**: las credenciales están fijas en el frontend y la protección es solo visual. Cualquiera que consuma la API puede invocar endpoints mutables. Se decidió mantenerla así por ahora.
2. **Componentes grandes sin pruebas**: `ServersRequest.jsx` (~850 líneas), `jmxUtils.jsx` (~870), `RequestsTab.jsx` (~830) y `ContinuousDeploymentForm.jsx` (~700) mezclan estado, lógica y UI. Conviene extraer su lógica pura y probarla antes de dividirlos.

Pendiente, prioridad media:

3. **Concurrencia en SQLite**: las transacciones se serializan en la conexión compartida, pero una escritura suelta que llegue durante una transacción queda dentro de ella. Es aceptable para el uso interno actual.
4. **Escalabilidad de BLOB**: archivos de hasta 10 MB se cargan completos en memoria y se guardan dentro de SQLite.
5. **Advertencias de hooks**: varios `useEffect` omiten dependencias (`fetchX`); no causan fallos hoy, pero dificultan refactorizar.

Prioridad baja:

6. El bundle supera 500 kB. Se podría dividir por ruta con `React.lazy` para JMeter, PHPStan y la solicitud de servidores.

## 10. Convenciones para futuras modificaciones

Antes de cambiar una funcionalidad:

1. Identificar si el cambio cruza frontend (`services/`), API, SQLite, JSON de configuración y Apache, y mantener el contrato alineado en todas las capas.
2. Confirmar la ruta efectiva completa, incluyendo `/tools/api`, `VITE_API_URL` y `basename`.
3. Para mutaciones bajo `/projects/:id`, usar `validateActiveProject`.
4. Para varias escrituras relacionadas, usar `withTransaction` (`src/api/lib/withTransaction.js`).
5. Responder JSON con códigos HTTP consistentes y dejar los errores inesperados al manejador central.
6. Añadir o actualizar pruebas de endpoint: validación, 404, proyecto finalizado y error de persistencia.
7. En la interfaz, usar tokens y clases de `estilo-personal`, `useDialog` para confirmar y `useToast` para informar.
8. Validar con Node 22: `npm run validate`.
9. No editar `projects.sqlite`, `dist/`, logs ni `.env` como parte de cambios de código, salvo que el objetivo lo requiera explícitamente.

## 11. Secuencia recomendada de mejora

1. Implementar autenticación real en la API y eliminar las credenciales del frontend.
2. Extraer y probar la lógica pura de JMeter (`jmxUtils`), CD (generador YAML) y la solicitud de servidores; luego dividir esos componentes.
3. Agregar pruebas de frontend (Vitest + Testing Library) para los flujos de Proyectos.
4. Formalizar migraciones SQLite y definir el ciclo de vida de los archivos BLOB.
5. Dividir el bundle por ruta.

## 12. Archivos de referencia rápida

- Entrada frontend: `src/main.jsx`, `src/App.jsx`.
- Cliente HTTP y servicios: `src/api.js`, `src/services/`.
- Entrada API: `src/api/server.js`.
- Persistencia: `src/api/db.js`, `src/api/lib/`.
- Validación de proyectos: `src/api/middleware/projects.middleware.js`.
- Sistema visual: `src/styles/`, `src/index.css`, `src/components/layout/Cabecera.jsx`.
- Despliegue: `docs/despliegue.md`, `tools.conf`, `ecosystem.config.cjs`.
- Pruebas: `tests/*.test.js`.
