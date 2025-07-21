import React from 'react';

export const generateYamlContent = (config) => {
  // Format environment variables for the YAML
  const envVariables = Object.entries(config.deploy.env)
    .map(([key, value]) => `  ${key}: "${value}"`)
    .join('\n');

  // Create base64 encoded SSH key
  const sshKeyBase64 = config.deploy.ssh_key ? 
    btoa(config.deploy.ssh_key.trim()) : '';

  return `variables:
  # Configuración de despliegue
  COMPOSER_HOME: "/composer"
  PHP_VERSION: "${config.general.phpVersion}"
  ${config.general.useNode ? `NODE_VERSION: "${config.general.nodeVersion}"` : '# NODE_VERSION: none'}
  DEPLOY_SERVER: "${config.deploy.server}"
  DEPLOY_USER: "${config.deploy.user}"
  DEPLOY_PATH: "${config.deploy.path}"
  DEPLOY_SSH_KEY: "${sshKeyBase64}"
  DEPLOY_ENV: "${config.general.environment}"
  DEPLOY_BRANCH: "${config.general.branch}"
  
  # Variables de entorno para .env
${envVariables}

stages:
  - deploy

.deploy_env_vars: &deploy_env_vars |
  function update_env() {
    local key="\${1}"
    local value="\${2}"
    sed -i "s|^\${key}=.*|\${key}=\${value}|" .env
  }

deploy:
  stage: deploy
  image: php:\${PHP_VERSION}-fpm
  before_script:
    - apt-get update && apt-get install -y git zip unzip libpng-dev ${config.general.useNode ? 'nodejs npm' : ''} openssh-client rsync bash
    - curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer
    - eval $(ssh-agent -s)
    - echo "$DEPLOY_SSH_KEY" | base64 -d | tr -d '\\r' | ssh-add -
    - mkdir -p ~/.ssh
    - ssh-keyscan -H "$DEPLOY_SERVER" >> ~/.ssh/known_hosts
  script:
    ${config.general.useNode ? '- npm install -g npm@latest' : '# Node.js not required'}
    - composer install --prefer-dist --no-ansi --no-interaction --no-progress
    - cp .env.example .env
    - *deploy_env_vars
    ${config.general.useNode ? '- npm install\n    - npm run build' : '# Skip npm build'}
${Object.entries(config.deploy.env)
  .map(([key]) => `    - update_env "${key}" "$${key}"`)
  .join('\n')}
    - rsync -avz --exclude '.git*' ./ "$DEPLOY_USER@$DEPLOY_SERVER:$DEPLOY_PATH"
    - ssh $DEPLOY_USER@$DEPLOY_SERVER "cd $DEPLOY_PATH && 
      composer install --no-dev --optimize-autoloader &&
      php artisan config:cache &&
      php artisan route:cache &&
      php artisan view:cache &&
      php artisan migrate --force${config.general.useNode ? ' && npm install && npm run build' : ''}"
  environment:
    name: $DEPLOY_ENV
    url: "${config.deploy.env.APP_URL || 'https://$DEPLOY_SERVER'}"
  only:
    - $DEPLOY_BRANCH
`;
};

export const YamlGenerator = {
  generateYamlContent,
};

export default YamlGenerator;
