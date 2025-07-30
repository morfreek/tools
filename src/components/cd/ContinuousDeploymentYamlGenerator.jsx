import React from 'react';

/**
 * Componente utilitario para generar contenido YAML de GitLab CI/CD
 * basado en el template cdv2.yml
 */
export const ContinuousDeploymentYamlGenerator = {
    /**
     * Genera el contenido YAML completo basado en la configuración
     * @param {Object} config - Configuración del despliegue
     * @returns {string} - Contenido YAML generado
     */
    generateYamlContent(config) {
        const { general, deploy } = config;

        // Validar configuración
        const base64SSHkey = (input) => {
            // Normaliza saltos de línea a \n
            let normalized = input.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
            // Asegura salto de línea final si el archivo original lo tiene
            if (!normalized.endsWith('\n')) normalized += '\n';
            // Codifica a bytes puros (UTF-8)
            const encoder = new TextEncoder();
            const bytes = encoder.encode(normalized);
            // Codifica a base64
            let binary = '';
            for (let i = 0; i < bytes.length; i++) {
                binary += String.fromCharCode(bytes[i]);
            }
            return btoa(binary);
        }

        // Generar variables del deployment
        let variables = `variables:
  # Configuración de despliegue
  COMPOSER_HOME: "/composer"
  PHP_VERSION: "${general.phpVersion}"`;

        // Agregar NODE_VERSION solo si está habilitado
        if (general.useNode && general.nodeVersion) {
            variables += `\n  NODE_VERSION: "${general.nodeVersion}"`;
        } else {
            variables += `\n  # NODE_VERSION: none`;
        }
        variables += `
  DEPLOY_SERVER: "${deploy.server}"
  DEPLOY_USER: "${deploy.user}"
  DEPLOY_PATH: "${deploy.path}"
  DEPLOY_SSH_KEY: "${base64SSHkey(deploy.ssh_key.trim())}"
  DEPLOY_ENV: "${general.environment}"
  DEPLOY_BRANCH: "${general.branch}"
  
  # Variables de entorno para .env`;

        // Agregar variables de entorno
        Object.entries(deploy.env).forEach(([key, value]) => {
            variables += `\n  ${key}: "${value}"`;
        });

        // Generar stages
        const stages = `

stages:
  - deploy`;

        // Generar función para actualizar variables de entorno
        const deployEnvVars = `

.deploy_env_vars: &deploy_env_vars |
  function update_env() {
    local key="\${1}"
    local value="\${2}"
    sed -i "s|^\${key}=.*|\${key}=\${value}|" .env
  }`;

        // Generar job de deploy
        let deployJob = `

deploy:
  stage: deploy
  image: php:\${PHP_VERSION}-fpm
  before_script:
    - apt-get update && apt-get install -y openssh-client bash rsync`;

        // Agregar configuración de Node.js si está habilitado
        if (general.useNode && general.nodeVersion) {
            deployJob += `
    - node --version && npm --version`;
        }

        deployJob += `
    - mkdir -p ~/.ssh
    - echo -e "$DEPLOY_SSH_KEY" | base64 -d > ~/.ssh/id_rsa
    - chmod 600 ~/.ssh/id_rsa
    - ssh-keyscan -H "$DEPLOY_SERVER" >> ~/.ssh/known_hosts
  script:
    - cp .env.example .env
    - *deploy_env_vars`;

        // Agregar actualizaciones de variables de entorno
        Object.keys(deploy.env).forEach(key => {
            deployJob += `\n    - update_env "${key}" "$${key}"`;
        });

        // Agregar comandos de Node.js si está habilitado
        if (general.useNode && general.nodeVersion) {
            deployJob += `
    - npm install --production`;
        }

        deployJob += `
    - rsync -avz --exclude 'storage/' ./ "$DEPLOY_USER@$DEPLOY_SERVER:$DEPLOY_PATH"
    - ssh "$DEPLOY_USER@$DEPLOY_SERVER" bash -c "'
        cd $DEPLOY_PATH &&
        chmod -R 755 . &&
        setfacl -R -m u:apache:rwx storage/ || true &&
        setfacl -R -m u:apache:rwx bootstrap/cache || true &&
        composer install --no-interaction --optimize-autoloader &&`;

        // Agregar comandos de Node.js en el servidor si está habilitado
        if (general.useNode && general.nodeVersion) {
            deployJob += `
        npm install --production &&
        npm run build &&`;
        }

        deployJob += `
        php artisan key:generate &&
        php artisan optimize &&
        php artisan migrate --force
      '"
  environment:
    name: $${Object.keys(deploy.env).find(key => key.includes('APP_ENV')) || 'production'}
    url: "$${Object.keys(deploy.env).find(key => key.includes('APP_URL')) || 'APP_URL'}"
  only:
    - ${general.branch}`;
console.log(deploy.env)
        return `${variables}${stages}${deployEnvVars}${deployJob}`;
    },

    /**
     * Valida la configuración antes de generar el YAML
     * @param {Object} config - Configuración a validar
     * @returns {Object} - Objeto con isValid y errores
     */
    validateConfiguration(config) {
        const errors = [];

        if (!config.general.phpVersion) errors.push('Versión PHP es requerida');
        if (!config.general.environment) errors.push('Ambiente es requerido');
        if (!config.general.branch) errors.push('Rama Git es requerida');
        if (!config.deploy.server) errors.push('Servidor es requerido');
        if (!config.deploy.user) errors.push('Usuario es requerido');
        if (!config.deploy.path) errors.push('Ruta de despliegue es requerida');
        if (!config.deploy.ssh_key) errors.push('SSH Key es requerida');

        if (config.general.useNode && !config.general.nodeVersion) {
            errors.push('Versión Node.js es requerida cuando está habilitado');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }
};

/**
 * Hook personalizado para usar el generador de YAML
 * @returns {Object} - Funciones del generador
 */
export const useYamlGenerator = () => {
    const generateYaml = React.useCallback((config) => {
        return ContinuousDeploymentYamlGenerator.generateYamlContent(config);
    }, []);

    const validateConfig = React.useCallback((config) => {
        return ContinuousDeploymentYamlGenerator.validateConfiguration(config);
    }, []);

    return {
        generateYaml,
        validateConfig
    };
};

// Exportar función legacy para compatibilidad
export const generateYamlContent = ContinuousDeploymentYamlGenerator.generateYamlContent;

export default ContinuousDeploymentYamlGenerator;
