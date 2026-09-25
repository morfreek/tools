# Herramientas UDS

Aplicación web interna de la Unidad de Desarrollo de Software (UDS · DSI) que reúne herramientas de administración y soporte técnico:

- **Proyectos**: equipo (coordinador y desarrolladores), revisiones técnicas (observación general obligatoria y checklist opcional) con bitácora de seguimiento y exportación a Excel, notas, archivos adjuntos y generación de pipelines de despliegue continuo (CD). Un proyecto finalizado queda en solo lectura. El Inicio muestra qué proyectos activos necesitan revisión y los accesos recientes.
- **Pruebas JMeter**: arma planes de carga (hilos, peticiones HTTP, CSV, temporizadores, listeners, assertions), importa rutas Laravel o un `.jmx` existente y descarga el resultado.
- **Visor PHPStan**: carga el reporte JSON de PHPStan, lo agrupa por archivo, lo filtra y lo exporta a Excel.
- **Solicitud de servidores**: completa la plantilla DOCX de solicitud de máquinas virtuales UPT.

JMeter, PHPStan y la solicitud de servidores funcionan completamente en el navegador. Solo Proyectos usa la API.

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | React 19, React Router 7, React Bootstrap 2 (Bootstrap 5.3), Vite 6 |
| API | Node.js 22, Express 5 (ESM) |
| Persistencia | SQLite (`projects.sqlite`) y JSON por proyecto en `data/configs/` |
| Pruebas | Jest 29 + axios contra la app real con la base simulada |
| Sistema visual | skill `estilo-personal` (tokens, tema claro/oscuro) |

## Requisitos

- **Node.js 22** (`.nvmrc` fija 22.11.0). El Node por defecto del servidor es v14 y con él fallan build, lint y tests: ejecutar `nvm use` antes de cualquier comando.
- SQLite3 (lo usa el paquete `sqlite3`; la base se crea sola al primer arranque).

## Instalación

```bash
git clone https://github.com/morfreek/tools.git
cd tools
nvm use
npm ci
cp .env-example .env    # ajustar VITE_BASE_URL y VITE_API_URL
```

### Variables de entorno

| Variable | Dónde se usa | Ejemplo | Notas |
|---|---|---|---|
| `VITE_BASE_URL` | Frontend: `basename` del router | `/tools` | Debe coincidir con `base` en `vite.config.js` |
| `VITE_API_URL` | Frontend: base del cliente axios | `https://localhost/tools/api` | Se incrusta en el build |
| `PORT` | API | `3001` | Por defecto 3001 |
| `DB_PATH` | API | `/ruta/projects.sqlite` | Por defecto `projects.sqlite` en la raíz del repo |
| `CONFIGS_DIR` | API | `/ruta/data/configs` | Por defecto `data/configs` en la raíz del repo |
| `CORS_ORIGIN` | API | `http://localhost:5173` | Solo en desarrollo: orígenes con CORS y cookies. En producción, vacío |

Las `VITE_*` se leen de `.env` al construir. Las de la API se definen en el entorno del proceso (PM2 o systemd), porque Node no lee `.env`.

## Uso en desarrollo

```bash
npm run api:dev   # API en http://localhost:3001/tools/api, se reinicia al guardar
npm run dev       # frontend en http://localhost:5173/tools/
```

Para desarrollo local, `VITE_API_URL=http://localhost:3001/tools/api` y la API con `CORS_ORIGIN=http://localhost:5173`, para que el navegador envíe la cookie de sesión.

## Scripts

| Script | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo de Vite |
| `npm run build` | Build de producción en `dist/` (**es lo que sirve Apache**) |
| `npm run preview` | Sirve el build localmente |
| `npm run api` / `npm run api:dev` | Inicia la API (con `--watch` en la variante dev) |
| `npm run lint` | ESLint |
| `npm test` | Suite de la API (Jest con ESM) |
| `npm run test:coverage` | Suite con cobertura en `coverage/` |
| `npm run validate` | `lint` + `test` + `build`, lo mismo que corre la CI |

Una suite o un test puntual:

```bash
npm test -- tests/projects.test.js
npm test -- tests/projects.test.js -t "revertir la transacción"
```

Usar siempre `npm test -- …` y no `npx jest`: el script agrega `--experimental-vm-modules`, sin el cual Jest no carga módulos ESM.

## Arquitectura

```text
src/
  main.jsx, App.jsx        Entrada, proveedores (sesión, toasts, diálogos), cabecera y rutas
  pages/                   Una pantalla por ruta
  components/              Componentes por dominio (cd, file, note, review, project, jmeterCreator…)
    layout/                Cabecera y ProjectPageLayout (estructura común de /projects/:id/*)
    project/               ProjectHeader (migas, selector de proyecto, pestañas), tabla y selector
  services/                Llamadas a la API, un módulo por recurso
  hooks/                   useProjects, useTheme, useJMeterGenerator
  config/                  Catálogo de herramientas y valores por defecto de CD
  utils/                   Estados, frecuencia y vigencia de revisiones, accesos recientes, HTML seguro, búsqueda sin tildes, exportación Excel
  assets/                  favicon.svg y templates/ (plantilla DOCX de solicitud de servidores)
  styles/                  base.css y bootstrap-bridge.css del sistema visual
  api/
    server.js              App Express: monta routers bajo /tools/api y el manejador de errores
    db.js                  Conexión SQLite única, esquema, migraciones y datos iniciales
    lib/                   Rutas de datos, transacciones y almacén de configuraciones CD
    middleware/            validateActiveProject y manejo central de errores
    routes/                Endpoints por recurso
tests/                     Pruebas de endpoints
docs/despliegue.md         Apache, PM2 y systemd
```

Flujo de una operación: `pages` → `components` → `services/*.service.js` → `src/api.js` (axios) → Apache `/tools/api` → `routes/*` → `db.js`.

Reglas que atraviesan capas:

- **Sesión y dueño**: `authenticate` exige sesión en toda la API salvo `/auth/login` y `/auth/logout`, y `requireProjectAccess` responde 404 en cualquier `/projects/:id/…` que no sea de la cuenta.
- **Proyectos finalizados**: toda ruta que modifica algo bajo `/projects/:id/…` pasa por `validateActiveProject`, que responde 404 si el proyecto no existe y 400 si tiene `termination_date`.
- **Escrituras múltiples** (crear o editar proyecto, crear o borrar revisión, subir archivos, borrar proyecto) van dentro de `withTransaction`, que además serializa las transacciones sobre la conexión compartida.
- **Errores**: la API responde siempre JSON `{ error }` y nunca expone detalles internos.
- **Esquema**: los cambios de tablas se agregan en `src/api/db.js`, como migración idempotente.

## API

Todas las rutas cuelgan de `/tools/api` y exigen sesión, salvo login y logout. Las de `/projects` solo alcanzan los proyectos de la cuenta. Las marcadas con ● rechazan cambios en proyectos finalizados y las marcadas con ◆ requieren rol administrador.

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/auth/login` | Inicia sesión `{ username, password }` y entrega la cookie (sin sesión) |
| POST | `/auth/logout` | Cierra la sesión actual (sin sesión) |
| GET | `/auth/me` | Cuenta de la sesión |
| PUT | `/auth/password` | Cambia la contraseña propia `{ current_password, new_password }` |
| GET | `/accounts/options` | Cuentas activas, para elegir destino de una transferencia |
| GET / POST | `/accounts` ◆ | Lista cuentas con su total de proyectos / crea `{ username, name, password, role }` |
| PUT | `/accounts/:id` ◆ | Edita `{ name, role, active }` |
| PUT | `/accounts/:id/password` ◆ | Asigna una contraseña temporal `{ password }` |
| POST | `/accounts/:id/transfer` ◆ | Traspasa todos sus proyectos `{ account_id }` |
| GET | `/users` | Lista usuarios |
| POST | `/users` | Crea usuario `{ name }` |
| PUT | `/users/:id` | Renombra usuario `{ name }` |
| GET | `/projects?status=active\|finished` | Lista proyectos con desarrolladores, fecha de la última revisión (`last_review_at`) y total de revisiones (`review_count`); por defecto activos |
| GET | `/projects/:id` | Detalle con desarrolladores |
| POST | `/projects` | Crea `{ name, code, coordinator_id, developer_ids[] }` |
| PUT | `/projects/:id` ● | Actualiza y reemplaza desarrolladores |
| PATCH | `/projects/:id/terminate` | Finaliza el proyecto (queda en solo lectura) |
| PATCH | `/projects/:id/owner` | Transfiere el proyecto a otra cuenta `{ account_id }` |
| DELETE | `/projects/:id` ● | Elimina el proyecto con revisiones, notas, archivos y configuraciones |
| GET | `/checklist` | Aspectos y puntos de la revisión técnica |
| GET | `/projects/:id/reviews` | Revisiones con sus resultados |
| POST | `/projects/:id/reviews` ● | Crea `{ applied_at, general_notes, results[]? }`; `general_notes` obligatoria, `results` opcional (solo se guardan puntos con estado u observación) |
| DELETE | `/projects/:id/reviews` ● | Elimina `{ reviewId }` y sus resultados |
| GET | `/projects/:id/notes` | Notas del proyecto |
| POST / PUT / DELETE | `/projects/:id/notes` ● | Crea `{ detail }`, edita `{ noteId, detail }` o elimina `{ noteId }` |
| GET | `/projects/:id/files` | Lista archivos (sin contenido) |
| POST | `/projects/:id/files` ● | Sube `files[]` (multipart, 10 MB por archivo) |
| GET | `/projects/:id/files/:fileId/download` | Descarga |
| GET | `/projects/:id/files/:fileId/preview` | Muestra la imagen (solo `image/*`) |
| DELETE | `/projects/:id/files/:fileId` ● | Elimina |
| GET / POST / DELETE | `/projects/:id/configs` | Configuraciones de CD guardadas por nombre (`{ name, config }`) |

## Acceso

Proyectos requiere una cuenta. La API valida la sesión en cada solicitud; las herramientas autónomas (JMeter, PHPStan, solicitud de servidores) siguen abiertas.

- **Cuentas**: las crea un administrador en **Gestionar cuentas** (menú de la cuenta, ruta `/cuentas`), con una contraseña temporal que se cambia en el primer ingreso. Un administrador también edita nombre y rol, desactiva cuentas (se cierran sus sesiones) y restablece contraseñas. No hay registro abierto.
- **Proyectos por cuenta**: cada proyecto tiene una única cuenta dueña, la que lo creó, y solo esa cuenta lo ve y lo gestiona; un proyecto ajeno responde 404. El rol administrador no da acceso a proyectos ajenos. Para compartir o entregar un proyecto, su dueño lo transfiere desde la cabecera del proyecto; un administrador puede traspasar de una vez todos los proyectos de una cuenta (por ejemplo, al desactivarla).
- **Equipo**: coordinadores y desarrolladores (`users`) son un catálogo común a todas las cuentas.
- **Primer arranque**: se crea la cuenta `admin` con contraseña temporal `1234`, dueña de todos los proyectos existentes. Cambiarla al desplegar.
- **Seguridad**: contraseñas con `scrypt`; sesión de 12 horas en una cookie `httpOnly` y la base guarda solo el hash del token; 5 intentos fallidos bloquean el ingreso por 10 minutos; las escrituras exigen la cabecera `X-Requested-With: tools` (CSRF).

## Pruebas y CI

- `tests/setup.js` simula `openDb()` con `mockDb` (`all/get/run/exec`), y cada suite levanta la app real en un puerto libre de `127.0.0.1`. Ninguna prueba toca `projects.sqlite` ni `data/configs`.
- `setup.js` también simula las sesiones (`mockSessions`): cada solicitud de prueba llega con la cuenta `TEST_ACCOUNT` (admin, id 1), y el proyecto por defecto (`ACTIVE_PROJECT`) es de esa cuenta.
- `db.get` responde por defecto un proyecto activo de la cuenta de prueba; para probar un proyecto finalizado, ajeno o inexistente, se sobrescribe con `mockDb.get.mockResolvedValueOnce(...)`.
- `.github/workflows/ci.yml` ejecuta `npm ci`, lint, test y build con Node 22 en cada push a `dev` o `main` y en cada pull request.
- El frontend no tiene pruebas automatizadas: los cambios de interfaz se revisan a mano en tema claro y oscuro.

## Sistema visual

La interfaz usa la skill `estilo-personal`:

- Los tokens de color (`--fondo`, `--panel`, `--acento`, `--ok`, `--ambar`, `--rojo`, …) están en `src/styles/base.css`. `bootstrap-bridge.css` tiñe Bootstrap con ellos.
- Hay tres temas (automático, claro y oscuro), que se rotan con el botón **Tema** y se recuerdan en `localStorage` (`tools:tema`).
- Las confirmaciones usan `useDialog()` y los avisos, `useToast()`. No se usan `alert`, `confirm` ni `prompt` del navegador.
- Todo color nuevo se define como token, con su valor claro y oscuro.

## Deuda conocida

En orden de prioridad, que es también la secuencia de mejora recomendada:

1. **Componentes grandes sin pruebas**: `ServersRequest.jsx`, `jmxUtils.jsx`, `RequestsTab.jsx` y `ContinuousDeploymentForm.jsx` (700 a 870 líneas cada uno) mezclan estado, lógica y UI. Extraer la lógica pura y probarla antes de dividirlos.
2. **Pruebas de frontend** (Vitest + Testing Library), empezando por los flujos de Proyectos.
3. **SQLite**: no hay migraciones formales. Además, una escritura suelta que llegue durante una transacción queda dentro de ella, porque la conexión es compartida (aceptable con el uso interno actual). Los archivos de hasta 10 MB se cargan completos en memoria y se guardan como BLOB.
4. **Bundle de más de 500 kB**: dividirlo por ruta con `React.lazy` (JMeter, PHPStan y solicitud de servidores).

## Despliegue

Resumen: `npm run build` publica `dist/` (Apache), y la API corre con `pm2 start ecosystem.config.cjs`. El detalle, las variables y la alternativa systemd están en [docs/despliegue.md](docs/despliegue.md).
