# Despliegue

La aplicación tiene dos piezas que se despliegan por separado en el mismo servidor:

| Pieza | Qué es | Cómo se publica |
|---|---|---|
| Frontend | Build estático de Vite en `dist/` | Apache lo sirve como `/tools` (`tools.conf`) |
| API | Proceso Node (`src/api/server.js`) en el puerto 3001 | PM2 (`ecosystem.config.cjs`); Apache hace proxy de `/tools/api/` |

Ambas usan **Node 22** (`.nvmrc`). Con el Node del sistema (v14) fallan el build y la API.

## 1. Frontend

```bash
nvm use            # toma 22.11.0 de .nvmrc
npm ci
npm run build      # genera dist/
```

- `VITE_BASE_URL` y `VITE_API_URL` (ver `.env-example`) se incrustan en el build: si cambian, hay que volver a construir.
- `dist/` es exactamente lo que Apache sirve. Construir en el servidor publica el cambio de inmediato, por lo que conviene hacerlo solo desde la rama que se quiere publicar.

## 2. Apache

`tools.conf` define:

- `ProxyPass /tools/api/ → http://localhost:3001/tools/api/` (debe ir primero).
- `Alias /tools → dist/` con reescritura a `index.html` para las rutas del SPA, excepto `/tools/api/`.

Requiere `mod_proxy`, `mod_proxy_http`, `mod_headers` y `mod_rewrite`.

## 3. API con PM2 (recomendado)

```bash
npm install -g pm2
pm2 start ecosystem.config.cjs   # proceso "tools-api"
pm2 save                          # recordar tras reinicios
pm2 startup                       # genera el comando de auto-inicio
```

`ecosystem.config.cjs` fija el intérprete Node 22 de nvm, `NODE_ENV=production`, `PORT=3001` y los logs en `logs/`.

Comandos habituales:

```bash
pm2 status
pm2 logs tools-api
pm2 restart tools-api     # tras actualizar el código de la API
pm2 monit
```

> PM2 ejecuta el código desde este mismo directorio. Un `pm2 restart` (o un reinicio automático tras un fallo) carga la rama que esté activa en ese momento.

### Variables de la API

Node no lee `.env`; se definen en `ecosystem.config.cjs` (`env`) o en el entorno del proceso:

| Variable | Por defecto | Uso |
|---|---|---|
| `PORT` | `3001` | Puerto de escucha |
| `DB_PATH` | `<repo>/projects.sqlite` | Base SQLite. La ruta por defecto es absoluta, no depende del directorio de arranque |
| `CONFIGS_DIR` | `<repo>/data/configs` | JSON de configuraciones de despliegue continuo por proyecto |
| `CORS_ORIGIN` | vacío | Orígenes permitidos con cookies, separados por coma. En producción queda vacío: frontend y API comparten origen por el proxy de Apache. En desarrollo, `http://localhost:5173` |

## 4. Alternativa: systemd

`/etc/systemd/system/tools-api.service`:

```ini
[Unit]
Description=Tools API (Node.js)
After=network.target

[Service]
Type=simple
User=devel
WorkingDirectory=/var/www/html/private/apps/tools
ExecStart=/home/devel/.nvm/versions/node/v22.11.0/bin/node src/api/server.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=3001

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now tools-api
sudo journalctl -u tools-api -f
```

## 5. Verificación posterior

```bash
curl -s http://localhost:3001/tools/api/checklist | head -c 200   # API directa
curl -sk https://localhost/tools/api/projects | head -c 200       # a través de Apache
```

Luego abrir `https://<host>/tools/` y revisar Proyectos (requiere acceso), JMeter y PHPStan.

## Cuentas de acceso

La API exige sesión en todo salvo `/auth/login` y `/auth/logout`. La sesión es una cookie `httpOnly` (`tools_sesion`, `Path=/tools`, 12 horas, `Secure` detrás de HTTPS gracias a `X-Forwarded-Proto` y `trust proxy`), y las escrituras deben traer `X-Requested-With: tools`.

Al primer arranque con esta versión, `db.js` crea la cuenta `admin` con la contraseña temporal `1234` (la que usaba el acceso fijo anterior) y le asigna todos los proyectos existentes. El primer ingreso obliga a cambiarla: hacerlo apenas se despliegue. Las demás cuentas las crea un administrador desde **Gestionar cuentas** en el menú de la cuenta.

Si se pierde la contraseña de la única cuenta administradora, se puede restablecer desde el servidor con `sqlite3` generando un hash nuevo:

```bash
node -e "import('./src/api/lib/passwords.js').then(async m => console.log(await m.hashPassword('temporal-nueva')))"
sqlite3 projects.sqlite "UPDATE accounts SET password_hash = '<hash>', must_change_password = 1 WHERE username = 'admin'"
```

