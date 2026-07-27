# PM2 - Gestor de Procesos (Recomendado)

## Instalación
```bash
npm install -g pm2
```

## Iniciar la API
```bash
# Usando el archivo de configuración
pm2 start ecosystem.config.js

# O directamente
pm2 start npm --name "tools-api" -- run api
```

## Comandos útiles
```bash
pm2 status              # Ver estado de procesos
pm2 logs tools-api      # Ver logs en tiempo real
pm2 restart tools-api   # Reiniciar
pm2 stop tools-api      # Detener
pm2 delete tools-api    # Eliminar del PM2
pm2 monit              # Monitor interactivo
```

## Configurar inicio automático con el sistema
```bash
pm2 startup            # Genera comando para auto-inicio
pm2 save               # Guarda la lista actual de procesos
```

---

# Systemd - Servicio del Sistema

## Crear archivo de servicio
Crear `/etc/systemd/system/tools-api.service`:

```ini
[Unit]
Description=Tools API Node.js Server
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/html/private/apps/tools
ExecStart=/usr/bin/node src/api/server.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=tools-api
Environment=NODE_ENV=production
Environment=PORT=3001

[Install]
WantedBy=multi-user.target
```

## Comandos systemd
```bash
sudo systemctl daemon-reload
sudo systemctl enable tools-api    # Habilitar en inicio
sudo systemctl start tools-api     # Iniciar
sudo systemctl status tools-api    # Ver estado
sudo systemctl restart tools-api   # Reiniciar
sudo systemctl stop tools-api      # Detener
sudo journalctl -u tools-api -f    # Ver logs
```

---

# Docker (Opcional)

Si quieres containerizar la aplicación, puedes crear un `Dockerfile`:

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
CMD ["node", "src/api/server.js"]
```

Y ejecutar:
```bash
docker build -t tools-api .
docker run -d -p 3001:3001 --name tools-api --restart unless-stopped tools-api
```

---

# Método Simple (Desarrollo/Testing)

## Con nohup
```bash
nohup npm run api > api.log 2>&1 &
```

## Con screen
```bash
screen -S tools-api
npm run api
# Ctrl+A, D para desconectar
# screen -r tools-api para reconectar
```

---

## Recomendación

Para **producción**: Usa **PM2** o **systemd**
- PM2: Más fácil, mejor para desarrollo/staging
- systemd: Más integrado con Linux, mejor para producción

Para **desarrollo**: PM2 o screen/tmux
