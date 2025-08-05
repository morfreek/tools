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
        const isNodeEnabled = general.useNode && general.nodeVersion;

        // Validar configuración
        const base64SSHkey = (input) => {
            let normalized = input.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
            if (!normalized.endsWith('\n')) normalized += '\n';
            const encoder = new TextEncoder();
            const bytes = encoder.encode(normalized);
            let binary = '';
            for (let i = 0; i < bytes.length; i++) {
                binary += String.fromCharCode(bytes[i]);
            }
            return btoa(binary);
        }

        // Generar variables del deployment
        const variables = `variables:
  # Configuración de despliegue
  COMPOSER_HOME: "/composer"
  PHP_VERSION: "${general.phpVersion}"
  ${isNodeEnabled ? `NODE_VERSION: "${general.nodeVersion}"` : '# NODE_VERSION: none'}
  DEPLOY_SERVER: "${deploy.server}"
  DEPLOY_USER: "${deploy.user}"
  DEPLOY_PATH: "${deploy.path}"
  DEPLOY_SSH_KEY: "${base64SSHkey(deploy.ssh_key.trim())}"
  DEPLOY_ENV: "${general.environment}"
  DEPLOY_BRANCH: "${general.branch}"
  
  # Variables de entorno para .env${Object.entries(deploy.env).map(([key, value]) => `\n  ${key}: "${value}"`).join('')}`;

        // Generar stages
        const stages = `

stages:${isNodeEnabled ? '\n  - build_frontend' : ''}
  - deploy_backend`;

        // Generar función para actualizar variables de entorno
        const deployEnvVars = `

.deploy_env_vars: &deploy_env_vars |
  function update_env() {
    local key="\${1}"
    local value="\${2}"
    if grep -q "^\${key}=" .env; then
        sed -i "s|^\${key}=.*|\${key}=\${value}|" .env
    else
        echo "\${key}=\${value}" >> .env
    fi
  }`;

        // Generar job de build frontend
        const buildFrontendJob = isNodeEnabled ? `

# Job para el build del frontend
build_frontend:
  stage: build_frontend
  image: node:\${NODE_VERSION}
  script:
    - touch .env
    - *deploy_env_vars${Object.keys(deploy.env).map(key => `\n    - update_env "VITE_${key}" "$${key}"`).join('')}
    - npm install
    - npm run build
  artifacts:
    paths:
      - public/build/
    expire_in: 1 hour` : '';

        // Generar job de deploy backend
        const deployJob = `

# Job para el deploy del backend
deploy_backend:
  stage: deploy_backend
  image: php:\${PHP_VERSION}-fpm
  before_script:
    - apt-get update && apt-get install -y openssh-client bash rsync
    - mkdir -p ~/.ssh
    - echo -e "$DEPLOY_SSH_KEY" | base64 -d > ~/.ssh/id_rsa
    - chmod 600 ~/.ssh/id_rsa
    - ssh-keyscan -H "$DEPLOY_SERVER" >> ~/.ssh/known_hosts
  script:
    - cp .env.example .env
    - *deploy_env_vars${Object.keys(deploy.env).map(key => `\n    - update_env "${key}" "$${key}"`).join('')}
    - |
      # Verifica si storage/ existe en el servidor remoto
      if ssh "$DEPLOY_USER@$DEPLOY_SERVER" "[ -d '$DEPLOY_PATH/storage' ]"; then
        echo "La carpeta storage/ ya existe en el servidor. Excluyéndola del rsync."
        rsync -avz --exclude 'storage/' ./ "$DEPLOY_USER@$DEPLOY_SERVER:$DEPLOY_PATH"
      else
        echo "La carpeta storage/ NO existe en el servidor. Copiando todo el proyecto."
        rsync -avz ./ "$DEPLOY_USER@$DEPLOY_SERVER:$DEPLOY_PATH"
      fi
      ssh "$DEPLOY_USER@$DEPLOY_SERVER" bash -c "'
        cd $DEPLOY_PATH &&
        if [ -d storage ]; then
            chmod -R 775 storage
            setfacl -R -m u:apache:rwx storage/ || true
        fi &&
        if [ -d bootstrap/cache ]; then
            chmod -R 775 bootstrap/cache
            setfacl -R -m u:apache:rwx bootstrap/cache || true
        fi
        '"
    - ssh "$DEPLOY_USER@$DEPLOY_SERVER" bash -c "'
        cd $DEPLOY_PATH &&
        composer install --no-interaction --optimize-autoloader &&
        php artisan key:generate &&
        php artisan optimize &&
        php artisan migrate --force
      '"${isNodeEnabled ? '\n  dependencies:\n    - build_frontend' : ''}
  environment:
    name: $${Object.keys(deploy.env).find(key => key.includes('APP_ENV')) || 'production'}
    url: "$${Object.keys(deploy.env).find(key => key.includes('APP_URL')) || 'APP_URL'}"
  only:
    - ${general.branch}`;

        return `${variables}${stages}${deployEnvVars}${buildFrontendJob}${deployJob}`;
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
