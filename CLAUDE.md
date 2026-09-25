# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Aplicación interna de la UDS (DSI) que reúne herramientas de administración: gestión de proyectos (usuarios, revisiones/checklist, notas, archivos, configuraciones de despliegue continuo) y herramientas autónomas (generador JMeter, visor PHPStan, solicitud de servidores DOCX). El `README.md` describe las herramientas, la tabla de endpoints y la deuda conocida por prioridad; `docs/despliegue.md`, el contrato con Apache y PM2.

## Estilo de interfaz: estilo-personal

Sistema visual: skill estilo-personal

Este es un proyecto personal (aunque esté en `/var/www/html/private/apps`) y **debe implementar la skill `estilo-personal`**. Usarla en todo trabajo de interfaz: pantallas, componentes, CSS, formularios, tablas, login, tema claro/oscuro y textos de la UI, aunque el pedido no la mencione. El stack aplicable de la skill es React + Bootstrap (react-bootstrap).

Ya aplicado. Reutilizar antes de crear:
- `src/styles/base.css` y `bootstrap-bridge.css` son copias de la skill (no editarlas a mano salvo para agregar tokens). Token propio: `--codigo-fondo`/`--codigo-texto`/`--codigo-linea` para previsualizar código.
- `src/index.css` contiene lo específico de tools: `.toast-aviso`, `.aviso-info`, `.superficie` (en lugar de `bg-light`), `.fondo-panel` (en lugar de `bg-white`), `.codigo`/`.codigo-preview`, `.velo`, `.pestanas-plan`, `.phpstan-tabla`, `.cifras`/`.cifra` y `.accesos`/`.acceso` del Inicio, y el teñido con tokens de variantes de Bootstrap que el puente no cubre (`outline-*`, `success`, `info`, `warning`, list-group, accordion).
- Tema: `useTheme` (`src/hooks/useTheme.jsx`), clave `tools:tema`; el script anti-destello está en `index.html`.
- Diálogos: `useDialog()` (`src/components/DialogProvider.jsx`), nunca `alert/confirm/prompt`. Avisos: `useToast()`.
- Revisiones: la **observación general es obligatoria** (la API responde 400 si no tiene texto visible) y el **checklist es opcional** (interruptor "Evaluar checklist" en el modal; se precarga con la última revisión que lo evaluó y la API guarda solo los puntos con estado u observación). Desde 2026 el equipo registra casi siempre solo la observación, así que la UI no debe asumir que hay checklist: `countStatuses(review).evaluados === 0` significa "sin checklist".
- Seguimiento (`src/pages/ProjectDetail.jsx`, ruta `/projects/:id/detail`): bitácora de observaciones generales, de la más reciente a la más antigua, con el resumen del checklist cuando existe y la frecuencia de revisión (`reviewCadence` en `@u/reviewTracking`, con pruebas en `tests/reviewTracking.test.js`).
- Inicio (`src/pages/Home.jsx`): con sesión, panel de trabajo con los proyectos activos del más urgente al más reciente (`reviewFreshness`/`sortByFreshness` y umbrales `FRESHNESS_DAYS` en `@u/reviewTracking`, sobre `last_review_at` de `GET /projects`); "Nueva revisión" lleva a `/projects/:id/review?nueva=1`, que abre el modal al cargar. Al costado, Recientes (`@u/recent`, `localStorage` `tools:recientes`, registrados por `ProjectHeader` y por `App` para las herramientas; sin sesión no se muestran proyectos) y Herramientas, cuyo catálogo es `HERRAMIENTAS` en `src/config/tools.js`.
- HTML de usuario (notas, observaciones generales): siempre con `sanitizeHtml` de `@u/html` (DOMPurify) antes de `dangerouslySetInnerHTML`; para leerlo o convertirlo, `parseHtml`/`htmlToText` (DOMParser), nunca asignando `innerHTML`. Las observaciones por punto son texto plano y se muestran como texto.
- Pies de modales: Cancelar/Cerrar con `CancelButton` (`src/components/ui/`, botón `outline-secondary` `size="sm"`, igual que "Exportar Excel" o "Ver detalle") a la izquierda; acción principal `Button size="sm"` (primary, o `danger` si destruye) a la derecha, con verbo + objeto ("Crear nota", "Guardar revisión"); acciones intermedias en `outline-secondary`. Sin íconos en esos botones. Acciones de fila con solo ícono: `variant="link"` + `accion accion-editar|eliminar` y `title`.
- Estructura: `Cabecera` (`src/components/layout/`), `<main className="contenido">` en `App.jsx`; las páginas de `/projects/:id/*` usan `ProjectPageLayout`, que pinta `ProjectHeader` (`src/components/project/`): un panel con migas (`.migas`, `Proyectos › <nombre ▾>`; el nombre es `ProjectSwitcher`, un desplegable con buscador que lleva a la misma sección de otro proyecto), título con código y equipo, editar proyecto y pestañas `.pestanas-proyecto` definidas en `PROJECT_SECTIONS` (Seguimiento, Revisiones, Notas, Archivos, Despliegue continuo). Una sección nueva se agrega ahí y en `ROUTES`. Las acciones de cada sección (nueva revisión, subir archivos, nueva nota) van en el encabezado de su propio panel (`Card.Header` con título + total a la izquierda y botones a la derecha, la primaria al final), no en la cabecera del proyecto. No hay breadcrumb de Bootstrap ni ficha aparte; notas y archivos son paneles de página, no paneles laterales.

## Node: usar la versión 22

El `node` por defecto del shell es v14, con el que fallan lint, build y tests (`Object.hasOwn is not a function`, `||=`). Antes de ejecutar cualquier comando:

```bash
export PATH=/home/devel/.nvm/versions/node/v22.11.0/bin:$PATH   # o: nvm use 22
```

PM2 (`ecosystem.config.cjs`) también apunta a ese intérprete.

## Comandos

```bash
npm run dev        # Frontend Vite (http://localhost:5173/tools/)
npm run api        # API Express en 0.0.0.0:${PORT:-3001}
npm run api:dev    # API con node --watch
npm run build      # Build a dist/ (servido por Apache como /tools)
npm run lint       # ESLint
npm run validate   # lint + test + build (CI)
npm test           # Jest + ESM (NODE_ENV=test y --experimental-vm-modules los pone el script)
npm test -- tests/notes.test.js          # una suite
npm test -- tests/notes.test.js -t "crear una nota"   # un test por nombre
```

Ejecutar Jest siempre vía `npm test -- ...`, no con `npx jest` directo: sin `NODE_OPTIONS=--experimental-vm-modules` las suites no parsean.

Estado con Node 22: 11 suites / 106 tests en verde, lint con 0 errores (quedan warnings de `exhaustive-deps`), build correcto. `npm run validate` corre los tres y es lo que ejecuta la CI (`.github/workflows/ci.yml`).

`npm run build` escribe en `dist/`, que es lo que Apache sirve en producción: construir en este servidor publica. Para verificar un build sin publicar, usar `npx vite build --outDir <dir-temporal> --emptyOutDir`. Del mismo modo, PM2 ejecuta la API desde este directorio: un reinicio carga la rama activa.

## Arquitectura

- **Frontend** (React 19 + React Router 7 + react-bootstrap): `src/main.jsx` → `src/App.jsx` (proveedores `SessionProvider > ToastProvider > DialogProvider > Router(basename = VITE_BASE_URL)`, `Cabecera` y rutas en `ROUTES`). Pantallas en `src/pages/`, componentes por dominio en `src/components/<dominio>/`. **Las llamadas HTTP van por `src/services/*.service.js`** (funciones delgadas sobre el axios de `src/api.js`, `baseURL = VITE_API_URL`); los componentes no construyen URLs. Alias de Vite: `@`→`src`, `@c`→components, `@hk`→hooks, `@u`→utils. `base` de Vite es `/tools/`. No hay carpeta `public/`: el favicon y la plantilla DOCX viven en `src/assets/` y Vite los emite con hash en `dist/assets/`, así que las URLs de archivos estáticos se obtienen con `import`, nunca armándolas con `VITE_BASE_URL`.
- **Listado de proyectos**: `useProjects` (`src/hooks/`) concentra carga, búsqueda sin tildes (`@u/text`), orden y paginación; `ProjectsTable` solo pinta. Los estados de revisión (`bien`/`regular`/`deficiente`) y su color están en `@u/Constants` (`STATUS`, `getStatus`).
- **Cuentas y autenticación**: tabla `accounts` (quienes inician sesión; distinta de `users`, que es el catálogo común de coordinadores y desarrolladores) con rol `admin`/`usuario`, `active` y `must_change_password`; contraseñas con `scrypt` (`lib/passwords.js`). Sesión en servidor (`sessions`, solo el hash del token) con cookie `httpOnly` `tools_sesion` (`lib/sessions.js`). En `server.js`: `auth.routes` (login/logout/me/password) va antes de `authenticate`, que exige sesión en todo lo demás, rechaza escrituras sin `X-Requested-With: tools` (CSRF; la agrega `src/api.js`) y, con contraseña temporal, solo deja pasar `/auth/*`. `accounts.routes` es solo para admin salvo `GET /accounts/options`. **Cada proyecto tiene un único dueño** (`projects.owner_account_id`): `GET /projects` filtra por la cuenta y `requireProjectAccess`, montado en `/projects/:id`, responde 404 si el proyecto no es de la cuenta (el admin tampoco ve proyectos ajenos). Compartir = transferir (`PATCH /projects/:id/owner`; el admin puede traspasar todos los de una cuenta con `POST /accounts/:id/transfer`). La primera cuenta es `admin`/`1234` temporal, dueña de los proyectos previos. En el frontend, `SessionContext` consulta `/auth/me` al abrir (`account`, `loading`, `authenticated`, `isAdmin`), un 401 dispara `SESSION_EXPIRED_EVENT`; `RequireAuth` muestra login, el cambio obligatorio de contraseña o, con `admin`, el aviso de permisos. La gestión está en `/cuentas` (`src/pages/Accounts.jsx`, `src/components/account/`), accesible desde el menú de la cuenta en `Cabecera`. Errores de API al usuario con `apiErrorMessage` (`@u/apiError`), que distingue rechazo de "no se pudo contactar".
- **API** (Express 5, ESM): `src/api/server.js` monta cada router de `src/api/routes/` bajo `API_PREFIX = '/tools/api'`, luego un 404 JSON y `errorHandler` (`middleware/error.middleware.js`), que responde `{ error }` genérico. Express 5 ya propaga los rechazos de handlers async al manejador, así que un handler solo necesita `try/catch` si quiere un mensaje específico. Solo hace `listen` si `NODE_ENV !== 'test'` (exporta `app`).
- **Persistencia**: `src/api/db.js` memoiza **una conexión compartida**. Esquema, `PRAGMA foreign_keys = ON`, migraciones idempotentes y seed corren una vez al abrirla; los cambios de esquema se agregan ahí. Tablas: `users`, `projects` (`coordinator_id`, `termination_date`), `project_developers` (N:M), `checklist_aspects` → `checklist_points`, `project_reviews` → `review_point_results` (`status` ∈ `bien`/`regular`/`deficiente`/''), `project_notes`, `project_files` (BLOB). La ruta sale de `DB_PATH` o de `<repo>/projects.sqlite` (`src/api/lib/paths.js`, independiente del cwd). Las escrituras múltiples usan `withTransaction(db, fn)` (`lib/withTransaction.js`), que serializa las transacciones sobre la conexión única. Las configuraciones de CD no van a SQLite, sino a JSON en `CONFIGS_DIR` (por defecto `data/configs/<projectId>.json`), vía `lib/configStore.js`. Los archivos se guardan como BLOB (Multer en memoria, 10 MB).
- **Proyectos finalizados**: un proyecto con `termination_date` no nulo es de solo lectura. Toda ruta mutable bajo `/projects/:id/...` debe pasar por `validateActiveProject`, que usa el `req.project` que cargó `requireProjectAccess` y responde 400. `GET /projects` acepta `status=active|finished` (400 en otro caso). `DELETE /projects/:id` borra en cascada revisiones, notas, archivos, desarrolladores y el JSON de configuraciones.
- **Lógica pesada en el cliente**: la generación de YAML/scripts de CD (`src/components/cd/`, defaults en `src/config/ContinuousDeploymentDefaults.jsx`), la plantilla DOCX de solicitud de servidores (`src/assets/templates/`, importada con `?url`), el import/export JMX (`jmxUtils.jsx`, `useJMeterGenerator.jsx`), la exportación Excel (`@u/exportReviewsExcel`, PHPStan) y DOCX (Docxtemplater/PizZip) ocurren en el navegador, sin endpoints. `ServersRequest.jsx`, `jmxUtils.jsx`, `RequestsTab.jsx` y `ContinuousDeploymentForm.jsx` son grandes y no tienen pruebas: conviene extraer y probar su lógica antes de dividirlos.
- **Despliegue**: Apache (`tools.conf`) sirve `dist/` en `/tools` con fallback SPA y hace proxy de `/tools/api/` a `localhost:3001`. Un cambio de rutas o prefijo debe mantenerse alineado entre `vite.config.js`, `.env`, `server.js` y `tools.conf`. Detalle en `docs/despliegue.md`.

## Pruebas

Las pruebas son de endpoints y no tocan SQLite real. `tests/setup.js` registra `jest.unstable_mockModule('../src/api/db.js', ...)` para que `openDb()` devuelva `mockDb` (`all/get/run/exec` como `jest.fn()`). Como es ESM, el mock debe registrarse antes de importar el servidor: por eso `setup.js` se importa primero y `tests/test-server.js` carga la app con `import()` dinámico. Cada suite levanta su servidor en `127.0.0.1` con un puerto asignado por el sistema operativo (`setupTestServer` en `beforeAll`, `teardownTestServer` en `afterAll`) y consulta con axios (`validateStatus: () => true`). `test-server.js` fija `DB_PATH=:memory:` y un `CONFIGS_DIR` temporal. `configs.test.js` además mockea `fs`.

`setup.js` también mockea `src/api/lib/sessions.js` (`mockSessions`): `findSessionAccount` devuelve `TEST_ACCOUNT` (admin, id 1) y el `httpClient` envía la cookie y `X-Requested-With`, así que cada request llega autenticada; para probar un 401, `mockSessions.findSessionAccount.mockResolvedValueOnce(null)`. `resetMocks()` (en `beforeEach`) usa `mockReset` y deja `mockDb.get` resolviendo `ACTIVE_PROJECT` (`{ id: 1, termination_date: null, owner_account_id: 1 }`), que es lo que consulta `requireProjectAccess` primero en toda ruta `/projects/:id/...` (también las de lectura: el dato propio del handler va en el segundo `db.get`). Para probar un proyecto finalizado, ajeno o inexistente: `mockDb.get.mockResolvedValueOnce({ ...ACTIVE_PROJECT, termination_date: '...' })`, `{ ...ACTIVE_PROJECT, owner_account_id: 99 }` o `undefined`. Las transacciones se verifican con `mockDb.exec.mock.calls` (`BEGIN`/`COMMIT`/`ROLLBACK`).

## Convenciones de git

- Commits **sin** línea `Co-Authored-By` ni otra atribución a Claude.
- Branches con formato `{objetivo}/{accion}`: `{objetivo}` es un tipo estándar de conventional commits (`feat`, `fix`, `refactor`, `docs`, `chore`, `test`, `build`, `ci`, `style`, `perf`) y `{accion}` es un verbo en infinitivo + objeto, en kebab-case y en español. Ejemplo: `refactor/reestructurar-proyecto`.
- Mensajes en conventional commits y en español (`feat: agregar filtro de proyectos finalizados`). Se parte de `dev`.

## Convenciones

- Código, mensajes de error de la API y nombres de tests en español (`it('debe ...')`); respuestas JSON con forma `{ error: '...' }` / `{ message: '...' }`, sin detalles internos.
- ESLint ignora variables e imports con mayúscula inicial (`varsIgnorePattern: '^[A-Z_]'`, necesario para JSX sin el plugin de React), así que **no detecta imports de componentes o íconos sin uso**: revisarlos a mano al editar.
- No modificar `projects.sqlite`, `dist/`, `logs/` ni `.env` salvo que la tarea lo pida.
- Validar con Node 22: `npm run validate` (o, sin tocar `dist/`, lint + test + `vite build --outDir` temporal). Sin navegador en el servidor, la revisión visual en claro y oscuro queda pendiente y hay que decirlo.
