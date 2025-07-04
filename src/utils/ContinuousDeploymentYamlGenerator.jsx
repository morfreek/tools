import React from 'react';

const generateVariables = (config, sshKeyBase64) => {
    const vars = [
        '# Configuración de despliegue',
        `COMPOSER_HOME: "${config.general.composerHome}"`,
        `PHP_VERSION: "${config.general.phpVersion}"`
    ];

    if (config.general.useNode) {
        vars.push(`NODE_VERSION: "${config.general.nodeVersion}"`);
    }

    vars.push(
        `DEPLOY_SERVER: "${config.deploy.server}"`,
        `DEPLOY_USER: "${config.deploy.user}"`,
        `DEPLOY_PATH: "${config.deploy.path}"`,
        `DEPLOY_SSH_KEY: "${sshKeyBase64}"`,
        '',
        '# Variables de entorno para .env'
    );

    Object.entries(config.deploy.env).forEach(([key, value]) => {
        vars.push(`${key}: "${value}"`);
    });

    return vars.join('\n  ');
};

const generateCacheConfig = (config) => `
cache:
  key: \${CI_COMMIT_REF_SLUG}
  paths:
    ${config.build.cache.paths.map(path => `- ${path}`).join('\n    ')}`;

const generateBuildScript = (config) => {
    const commands = [
        'composer install --prefer-dist --no-ansi --no-interaction --no-progress',
        'cp .env.example .env',
        { comment: '# Incluir función de actualización' },
        '*update_env_vars'
    ];

    if (config.general.useNode) {
        commands.unshift('npm install -g npm@latest');
        commands.push('npm install', 'npm run build');
    }

    return commands.map(cmd => {
        if (typeof cmd === 'object' && cmd.comment) {
            return `    ${cmd.comment}`;
        }
        return `    - ${cmd}`;
    }).join('\n');
};

const generateBeforeScript = (config) => {
    const basePackages = ['git', 'zip', 'unzip', 'libpng-dev'];
    if (config.general.useNode) {
        basePackages.push('nodejs', 'npm');
    }

    const commands = [
        `apt-get update && apt-get install -y ${basePackages.join(' ')}`,
        'curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer'
    ];

    return commands.map(cmd => `    - ${cmd}`).join('\n');
};

const generateEnvUpdates = (config) => {
    return Object.entries(config.deploy.env)
        .map(([key, value]) => `    - update_env "${key}" "$${key}"`)
        .join('\n');
};

export const generateYamlContent = (config) => {
    const sshKeyBase64 = config.deploy.ssh_key ?
        btoa(config.deploy.ssh_key.trim()) : '';

    return `
stages:
  - build
  - deploy

variables:
  ${generateVariables(config, sshKeyBase64)}
  
${generateCacheConfig(config)}

.update_env_vars: &update_env_vars |
  function update_env() {
    local key="\${1}"
    local value="\${2}"
    sed -i "s|^\${key}=.*|\${key}=\${value}|" .env
  }

build:
  stage: build
  image: php:\${PHP_VERSION}-fpm
  before_script:
${generateBeforeScript(config)}
  script:
${generateBuildScript(config)}
    # Actualizar variables de entorno
${generateEnvUpdates(config)}
  artifacts:
    paths:
      ${config.build.artifacts
        .filter(path => config.general.useNode || !path.includes('node_modules'))
        .map(path => `- ${path}`)
        .join('\n      ')}
  only:
    - $DEPLOY_BRANCH

deploy:
  stage: deploy
  image: alpine:latest
  dependencies:
    - build
  before_script:
    - apk add --no-cache openssh-client rsync bash
    - eval $(ssh-agent -s)
    - echo "$DEPLOY_SSH_KEY" | base64 -d | tr -d '\\r' | ssh-add -
    - mkdir -p ~/.ssh
    - ssh-keyscan -H "$DEPLOY_SERVER" >> ~/.ssh/known_hosts
  script:
    - rsync -avz --exclude '.git*' ${config.general.useNode ? '' : '--exclude "node_modules"'} ./ "$DEPLOY_USER@$DEPLOY_SERVER:$DEPLOY_PATH"
    - ssh $DEPLOY_USER@$DEPLOY_SERVER "cd $DEPLOY_PATH && 
      composer install --no-dev --optimize-autoloader &&
      php artisan config:cache &&
      php artisan route:cache &&
      php artisan view:cache &&
      php artisan migrate --force${config.general.useNode ? ' && npm install && npm run build' : ''}"
  environment:
    name: $DEPLOY_ENV
    url: "https://$DEPLOY_SERVER$APP_URL"
  only:
    - $DEPLOY_BRANCH
`;
};

export const YamlGenerator = {
    generateYamlContent,
};

export default YamlGenerator;
