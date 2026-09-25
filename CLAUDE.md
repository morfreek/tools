# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Aplicación interna de la UDS (DSI) que reúne herramientas de administración: gestión de proyectos (usuarios, revisiones/checklist, notas, archivos, configuraciones de despliegue continuo) y herramientas autónomas (generador JMeter, visor PHPStan, solicitud de servidores DOCX). Para el detalle funcional, riesgos conocidos y el contrato de despliegue ver `CONTEXTO_PROYECTO.md`; el `README.md` está desactualizado (lista endpoints inexistentes y usa `VITE_BASE_PATH` en lugar de `VITE_BASE_URL`).

## Estilo de interfaz: estilo-personal

Sistema visual: skill estilo-personal

Este es un proyecto personal (aunque esté en `/var/www/html/private/apps`) y **debe implementar la skill `estilo-personal`**. Usarla en todo trabajo de interfaz: pantallas, componentes, CSS, formularios, tablas, login, tema claro/oscuro y textos de la UI, aunque el pedido no la mencione. El stack aplicable de la skill es React + Bootstrap (react-bootstrap).

Ya aplicado. Reutilizar antes de crear:
- `src/styles/base.css` y `bootstrap-bridge.css` son copias de la skill (no editarlas a mano salvo para agregar tokens). Token propio: `--codigo-fondo`/`--codigo-texto`/`--codigo-linea` para previsualizar código.
- `src/index.css` contiene lo específico de tools: `.toast-aviso`, `.aviso-info`, `.superficie` (en lugar de `bg-light`), `.fondo-panel` (en lugar de `bg-white`), `.codigo`/`.codigo-preview`, `.velo`, `.pestanas-plan`, `.phpstan-tabla`, `a.tarjeta` clicable, y el teñido con tokens de variantes de Bootstrap que el puente no cubre (`outline-*`, `success`, `info`, `warning`, list-group, accordion).
- Tema: `useTheme` (`src/hooks/useTheme.jsx`), clave `tools:tema`; el script anti-destello está en `index.html`.
- Diálogos: `useDialog()` (`src/components/DialogProvider.jsx`), nunca `alert/confirm/prompt`. Avisos: `useToast()`.
- Estructura: `Cabecera` (`src/components/layout/`), `<main className="contenido">` en `App.jsx`; las páginas de `/projects/:id/*` usan `ProjectPageLayout`.

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

Estado con Node 22: 7 suites / 62 tests en verde, lint con 0 errores (quedan warnings de `exhaustive-deps`), build correcto. `npm run validate` corre los tres y es lo que ejecuta la CI (`.github/workflows/ci.yml`).

`npm run build` escribe en `dist/`, que es lo que Apache sirve en producción: construir en este servidor publica. Para verificar un build sin publicar, usar `npx vite build --outDir <dir-temporal> --emptyOutDir`. Del mismo modo, PM2 ejecuta la API desde este directorio: un reinicio carga la rama activa.

## Arquitectura

- **Frontend** (React 19 + React Router 7 + react-bootstrap): `src/main.jsx` → `src/App.jsx` (proveedores `SessionProvider > ToastProvider > DialogProvider > Router(basename = VITE_BASE_URL)`, `Cabecera` y rutas en `ROUTES`). Pantallas en `src/pages/`, componentes por dominio en `src/components/<dominio>/`. **Las llamadas HTTP van por `src/services/*.service.js`** (funciones delgadas sobre el axios de `src/api.js`, `baseURL = VITE_API_URL`); los componentes no construyen URLs. Alias de Vite: `@`→`src`, `@c`→components, `@hk`→hooks, `@u`→utils. `base` de Vite es `/tools/`.
- **Listado de proyectos**: `useProjects` (`src/hooks/`) concentra carga, búsqueda sin tildes (`@u/text`), orden y paginación; `ProjectsTable` solo pinta. Los estados de revisión (`bien`/`regular`/`deficiente`) y su color están en `@u/Constants` (`STATUS`, `getStatus`).
- **Autenticación**: solo en frontend. `SessionContext` compara credenciales fijas y guarda un flag en `sessionStorage`; `RequireAuth` muestra el login. La API no tiene autenticación (deuda conocida, se decidió mantenerla por ahora).
- **API** (Express 5, ESM): `src/api/server.js` monta cada router de `src/api/routes/` bajo `API_PREFIX = '/tools/api'`, luego un 404 JSON y `errorHandler` (`middleware/error.middleware.js`), que responde `{ error }` genérico. Express 5 ya propaga los rechazos de handlers async al manejador, así que un handler solo necesita `try/catch` si quiere un mensaje específico. Solo hace `listen` si `NODE_ENV !== 'test'` (exporta `app`).
- **Persistencia**: `src/api/db.js` memoiza **una conexión compartida**. Esquema, `PRAGMA foreign_keys = ON`, migraciones idempotentes y seed corren una vez al abrirla; los cambios de esquema se agregan ahí. La ruta sale de `DB_PATH` o de `<repo>/projects.sqlite` (`src/api/lib/paths.js`, independiente del cwd). Las escrituras múltiples usan `withTransaction(db, fn)` (`lib/withTransaction.js`), que serializa las transacciones sobre la conexión única. Las configuraciones de CD no van a SQLite, sino a JSON en `CONFIGS_DIR` (por defecto `data/configs/<projectId>.json`), vía `lib/configStore.js`. Los archivos se guardan como BLOB (Multer en memoria, 10 MB).
- **Proyectos finalizados**: un proyecto con `termination_date` no nulo es de solo lectura. Toda ruta mutable bajo `/projects/:id/...` debe pasar por `validateActiveProject`, que responde 404/400. `GET /projects` acepta `status=active|finished` (400 en otro caso). `DELETE /projects/:id` borra en cascada revisiones, notas, archivos, desarrolladores y el JSON de configuraciones.
- **Lógica pesada en el cliente**: la generación de YAML/scripts de CD (`src/components/cd/`, defaults en `src/config/ContinuousDeploymentDefaults.jsx`), el import/export JMX (`jmxUtils.jsx`, `useJMeterGenerator.jsx`), la exportación Excel (`@u/exportReviewsExcel`, PHPStan) y DOCX (Docxtemplater/PizZip) ocurren en el navegador, sin endpoints. `ServersRequest.jsx`, `jmxUtils.jsx`, `RequestsTab.jsx` y `ContinuousDeploymentForm.jsx` son grandes y no tienen pruebas: conviene extraer y probar su lógica antes de dividirlos.
- **Despliegue**: Apache (`tools.conf`) sirve `dist/` en `/tools` con fallback SPA y hace proxy de `/tools/api/` a `localhost:3001`. Un cambio de rutas o prefijo debe mantenerse alineado entre `vite.config.js`, `.env`, `server.js` y `tools.conf`. Detalle en `docs/despliegue.md`.

## Pruebas

Las pruebas son de endpoints y no tocan SQLite real. `tests/setup.js` registra `jest.unstable_mockModule('../src/api/db.js', ...)` para que `openDb()` devuelva `mockDb` (`all/get/run/exec` como `jest.fn()`). Como es ESM, el mock debe registrarse antes de importar el servidor: por eso `setup.js` se importa primero y `tests/test-server.js` carga la app con `import()` dinámico. Cada suite levanta su servidor en `127.0.0.1` con un puerto asignado por el sistema operativo (`setupTestServer` en `beforeAll`, `teardownTestServer` en `afterAll`) y consulta con axios (`validateStatus: () => true`). `test-server.js` fija `DB_PATH=:memory:` y un `CONFIGS_DIR` temporal. `configs.test.js` además mockea `fs`.

`resetMocks()` (en `beforeEach`) usa `mockReset` y deja `mockDb.get` resolviendo `{ termination_date: null }` (proyecto activo), que es lo que consulta `validateActiveProject` primero. Para probar un proyecto finalizado o inexistente: `mockDb.get.mockResolvedValueOnce({ termination_date: '...' })` o `mockResolvedValueOnce(undefined)`. Las transacciones se verifican con `mockDb.exec.mock.calls` (`BEGIN`/`COMMIT`/`ROLLBACK`).

## Convenciones de git

- Commits **sin** línea `Co-Authored-By` ni otra atribución a Claude.
- Branches con formato `{objetivo}/{accion}`: `{objetivo}` es un tipo estándar de conventional commits (`feat`, `fix`, `refactor`, `docs`, `chore`, `test`, `build`, `ci`, `style`, `perf`) y `{accion}` es un verbo en infinitivo + objeto, en kebab-case y en español. Ejemplo: `refactor/reestructurar-proyecto`.
- Mensajes en conventional commits y en español (`feat: agregar filtro de proyectos finalizados`). Se parte de `dev`.

## Convenciones

- Código, mensajes de error de la API y nombres de tests en español (`it('debe ...')`); respuestas JSON con forma `{ error: '...' }` / `{ message: '...' }`, sin detalles internos.
- ESLint ignora variables e imports con mayúscula inicial (`varsIgnorePattern: '^[A-Z_]'`, necesario para JSX sin el plugin de React), así que **no detecta imports de componentes o íconos sin uso**: revisarlos a mano al editar.
- No modificar `projects.sqlite`, `dist/`, `logs/` ni `.env` salvo que la tarea lo pida.
- Validar con Node 22: `npm run validate` (o, sin tocar `dist/`, lint + test + `vite build --outDir` temporal). Sin navegador en el servidor, la revisión visual en claro y oscuro queda pendiente y hay que decirlo.
