module.exports = {
  apps: [{
    name: 'tools-api',
    script: './src/api/server.js',
    interpreter: '/home/devel/.nvm/versions/node/v22.11.0/bin/node',
    exec_mode: 'fork',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: './logs/api-err.log',
    out_file: './logs/api-out.log',
    log_file: './logs/api-combined.log',
    time: true
  }]
};
