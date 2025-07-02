import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Card, Form, Button, Row, Col, Accordion, Modal } from 'react-bootstrap';
import ProjectInfoCard from '@/components/ProjectInfoCard';
import Breadcrumb from '@/components/Breadcrumb';
import { useToast } from '@/components/ToastContext';
import { FaPlus, FaQuestionCircle, FaCopy } from 'react-icons/fa';

const SshInstructionsModal = ({ show, onHide }) => (
    <Modal show={show} onHide={onHide} size="lg">
        <Modal.Header closeButton>
            <Modal.Title>Instrucciones para generar SSH Key</Modal.Title>
        </Modal.Header>
        <Modal.Body>
            <h6>1. Generar la clave SSH en el servidor:</h6>
            <pre className="bg-light p-2 rounded">
                {`$ ssh-keygen -t rsa -b 4096 -C "deploy-key"
# Presionar Enter para aceptar ubicación por defecto
# No ingresar passphrase (dejar vacío)`}
            </pre>

            <h6 className="mt-3">2. Mostrar la clave privada:</h6>
            <pre className="bg-light p-2 rounded">
                {`$ cat ~/.ssh/id_rsa`}
            </pre>

            <h6 className="mt-3">3. Copiar la clave pública al archivo authorized_keys:</h6>
            <pre className="bg-light p-2 rounded">
                {`$ cat ~/.ssh/id_rsa.pub >> ~/.ssh/authorized_keys
$ chmod 600 ~/.ssh/authorized_keys`}
            </pre>

            <div className="alert alert-info mt-3">
                <strong>Nota:</strong> Copiar todo el contenido de la clave privada (incluidas las líneas BEGIN y END) 
                y pegarlo en el campo "SSH Key" del formulario.
            </div>
        </Modal.Body>
        <Modal.Footer>
            <Button variant="secondary" size="sm" onClick={onHide}>
                Cerrar
            </Button>
        </Modal.Footer>
    </Modal>
);

const CodePreview = ({ content }) => (
    <div className="bg-dark">
        <pre
            style={{
                margin: 0,
                backgroundColor: '#1e1e1e',
                color: '#d4d4d4',
                fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace",
                fontSize: '14px',
                lineHeight: '1.5',
                padding: '1rem',
                borderRadius: '4px',
                overflow: 'auto'
            }}
        >
            {content.split('\n').map((line, i) => (
                <div 
                    key={i} 
                    style={{
                        display: 'flex',
                        borderLeft: '1px solid #404040',
                        backgroundColor: line.trim().startsWith('#') ? '#1e1e1e' : 'transparent'
                    }}
                >
                    <span 
                        style={{
                            width: '40px',
                            paddingRight: '1rem',
                            color: '#858585',
                            textAlign: 'right',
                            userSelect: 'none',
                            borderRight: '1px solid #404040',
                            marginRight: '1rem'
                        }}
                    >
                        {i + 1}
                    </span>
                    <span style={{ flex: 1 }}>
                        {line.split(' ').map((word, j) => {
                            let color = '#d4d4d4';
                            if (word.startsWith('#')) {
                                color = '#6A9955';
                            } else if (['stage:', 'script:', 'artifacts:', 'variables:', 'before_script:', 'environment:'].includes(word)) {
                                color = '#569cd6';
                            } else if (word.startsWith('"') || word.startsWith("'")) {
                                color = '#ce9178';
                            } else if (word.startsWith('-')) {
                                color = '#c586c0';
                            } else if (word.includes(':')) {
                                color = '#9cdcfe';
                            }
                            return (
                                <span key={j} style={{ color }}>
                                    {word}{' '}
                                </span>
                            );
                        })}
                    </span>
                </div>
            ))}
        </pre>
    </div>
);

const ProjectContinuousDeployment = () => {
    const { id } = useParams();
    const { showToast } = useToast();
    const [config, setConfig] = useState({
        general: {
            phpVersion: '8.3.22',
            nodeVersion: '14.21.3',
            environment: 'integration',
            branch: 'integracion',
            useNode: true,
        },
        build: {
            installDeps: true,
            compileAssets: true,
            artifacts: [
                'dist/',
                'public/',
                'resources/',
                'package.json',
                'package-lock.json'
            ]
        },
        deploy: {
            server: 'ws-formacion.int.ucsc.cl',
            user: 'devel',
            path: '/var/www/html/private/apps/portal',
            ssh_key: `-----BEGIN OPENSSH PRIVATE KEY-----
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
9zrVl0yl0ZEAAAAKZGVwbG95LWtleQE=
-----END OPENSSH PRIVATE KEY-----`, // Nuevo campo para la SSH key
            env: {
                APP_ENV: 'integracion',
                APP_URL: '/formacion/portal'
            }
        }
    });

    const [showPreview, setShowPreview] = useState(false);
    const [yamlContent, setYamlContent] = useState('');
    const [newEnvKey, setNewEnvKey] = useState('');
    const [invalidFields, setInvalidFields] = useState([]);
    const [showSshInstructions, setShowSshInstructions] = useState(false);

    const handleConfigChange = (section, field, value) => {
        setConfig(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [field]: value
            }
        }));
    };

    const handleEnvChange = (key, value) => {
        setConfig(prev => ({
            ...prev,
            deploy: {
                ...prev.deploy,
                env: {
                    ...prev.deploy.env,
                    [key]: value
                }
            }
        }));
    };

    const handleAddEnvVariable = () => {
        if (!newEnvKey.trim()) {
            showToast('error', 'El nombre de la variable no puede estar vacío');
            return;
        }

        if (config.deploy.env.hasOwnProperty(newEnvKey)) {
            showToast('error', 'La variable ya existe');
            return;
        }

        setConfig(prev => ({
            ...prev,
            deploy: {
                ...prev.deploy,
                env: {
                    ...prev.deploy.env,
                    [newEnvKey]: ''
                }
            }
        }));
        setNewEnvKey('');
        showToast('success', `Variable ${newEnvKey} agregada correctamente`);
    };

    const handleRemoveEnvVariable = (keyToRemove) => {
        if (keyToRemove === 'APP_ENV' || keyToRemove === 'APP_URL') return;

        setConfig(prev => ({
            ...prev,
            deploy: {
                ...prev.deploy,
                env: Object.fromEntries(
                    Object.entries(prev.deploy.env)
                        .filter(([key]) => key !== keyToRemove)
                )
            }
        }));
    };

    const validateConfig = () => {
        const invalid = [];

        // Validar configuración general
        Object.entries(config.general).forEach(([key, value]) => {
            // Skip validation for nodeVersion if useNode is false
            if (key === 'nodeVersion' && !config.general.useNode) return;
            if (key === 'useNode') return; // Skip validation for useNode checkbox
            if (!value.trim()) {
                invalid.push(`general.${key}`);
            }
        });

        // Validar configuración del servidor
        Object.entries(config.deploy).forEach(([key, value]) => {
            if (key === 'env') return;
            if (!value.trim()) {
                invalid.push(`deploy.${key}`);
            }
        });

        // Validar variables de entorno
        Object.entries(config.deploy.env).forEach(([key, value]) => {
            if (!value.trim()) {
                invalid.push(`env.${key}`);
            }
        });

        setInvalidFields(invalid);

        if (invalid.length > 0) {
            showToast('error', 'Hay campos requeridos sin completar');
            return false;
        }

        return true;
    };

    const isFieldInvalid = (section, field) => {
        return invalidFields.includes(`${section}.${field}`);
    };

    const renderFormControl = (section, field, value, type = 'text', disabled = false) => (
        <Form.Control
            size="sm"
            type={type}
            value={value}
            onChange={e => {
                handleConfigChange(section, field, e.target.value);
                setInvalidFields(prev => prev.filter(f => f !== `${section}.${field}`));
            }}
            isInvalid={isFieldInvalid(section, field)}
            disabled={disabled}
        />
    );

    const renderEnvFormControl = (key, value) => (
        <Form.Control
            size="sm"
            type="text"
            value={value}
            onChange={e => {
                handleEnvChange(key, e.target.value);
                setInvalidFields(prev => prev.filter(f => f !== `env.${key}`));
            }}
            isInvalid={isFieldInvalid('env', key)}
        />
    );

    const renderFormLabel = (label) => (
        <Form.Label>
            {label} <span className="text-danger">*</span>
        </Form.Label>
    );

    const generateYamlContent = () => {
        const sshKeyBase64 = config.deploy.ssh_key ? 
            btoa(config.deploy.ssh_key.trim()) : '';

        // Función auxiliar para generar el script de actualización de variables de entorno
        const generateEnvUpdateScript = () => `
    # --- CONFIGURA .env ---
    - echo "Configurando .env desde CI/CD..."
    - |
      if [ ! -f .env ]; then
        cp .env.example .env
      fi
      
      # Función auxiliar para actualizar o añadir una variable en .env
      update_or_add_env_var() {
        local key="$1"
        local raw_value="$2"
        local escaped_value=$(echo "$raw_value" | sed 's/[&/\]/\\&/g')

        if grep -q "^\${key}=" .env; then
          sed -i "s@^\${key}=.*@\${key}=\${escaped_value}@" .env
        else
          echo "\${key}=\${raw_value}" >> .env
        fi
      }
      ${Object.entries(config.deploy.env).map(([key, value]) => `
      if [ -n "$${key}" ]; then
          update_or_add_env_var "${key}" "$${key}"
      fi`).join('\n')}
    # --- FIN CONFIGURACION .env ---`;
        return `
stages:
  - build
  - deploy

variables:
  # Versiones
  PHP_VERSION: "${config.general.phpVersion}"
  ${config.general.useNode ? `NODE_VERSION: "${config.general.nodeVersion}"` : ''}
  # Configuración de despliegue
  DEPLOY_SERVER: "${config.deploy.server}"
  DEPLOY_USER: "${config.deploy.user}"
  DEPLOY_PATH: "${config.deploy.path}"
  DEPLOY_SSH_KEY: "${sshKeyBase64}"
  # Variables de entorno
  ${Object.entries(config.deploy.env)
    .map(([key, value]) => `${key}: "${value}"`)
    .join('\n  ')}
  # Configuración de rama y ambiente
  DEPLOY_BRANCH: "${config.general.branch}"
  DEPLOY_ENV: "${config.general.environment}"

build_job:
  stage: build
  ${config.general.useNode ? 'image: node:$NODE_VERSION' : ''}
  script:
    ${config.general.useNode ? 
      '- npm install\n    - npm run build' : 
      '# No Node.js build steps required'}
  only:
    - $DEPLOY_BRANCH
  artifacts:
    paths:
      ${config.build.artifacts.map(a => `- ${a}`).join('\n      ')}
    expire_in: 1 day

deploy_${config.general.environment}:
  stage: deploy
  image: alpine:latest
  before_script:
    - apk update && apk add openssh-client bash rsync
    - mkdir -p ~/.ssh
    - echo "$DEPLOY_SSH_KEY" | base64 -d > ~/.ssh/id_rsa
    - chmod 600 ~/.ssh/id_rsa
    - ssh-keyscan -H "$DEPLOY_SERVER" >> ~/.ssh/known_hosts
    ${generateEnvUpdateScript()}

  script:
    - echo "Deploying to $DEPLOY_SERVER..."
    - rsync -avz --exclude 'storage/' ./ "$DEPLOY_USER@$DEPLOY_SERVER:$DEPLOY_PATH"
    - ssh "$DEPLOY_USER@$DEPLOY_SERVER" bash -c "'
        cd $DEPLOY_PATH &&
        composer install --no-interaction --optimize-autoloader &&
        php artisan key:generate &&
        php artisan optimize:clear ${config.general.useNode ? `&&
        npm install &&
        npm run build` : ''}
      '"
  environment:
    name: $DEPLOY_ENV
    url: "https://$DEPLOY_SERVER$APP_URL"
  only:
    - $DEPLOY_BRANCH
`;
    };

    const handlePreview = () => {
        if (!validateConfig()) return;

        setYamlContent(generateYamlContent());
        setShowPreview(true);
    };

    const handleDownload = () => {
        const blob = new Blob([yamlContent], { type: 'text/yaml' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cd-${config.general.environment}.yml`;
        a.click();
        setShowPreview(false);
    };

    const handleCopyToClipboard = () => {
        navigator.clipboard.writeText(yamlContent)
            .then(() => {
                showToast('success', 'Contenido copiado al portapapeles');
            })
            .catch(() => {
                showToast('error', 'Error al copiar el contenido');
            });
    };

    return (
        <Container fluid className="mt-4">
            <Breadcrumb />
            <ProjectInfoCard id={id} />

            <Card className="my-3">
                <Card.Header className="d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">Configuración de Despliegue Continuo</h5>
                    <Button size="sm" variant="primary" onClick={handlePreview}>
                        Previsualizar YAML
                    </Button>
                </Card.Header>
                <Card.Body>
                    <Accordion defaultActiveKey={['0', '1', '2']} alwaysOpen>
                        <Accordion.Item eventKey="0">
                            <Accordion.Header>Configuración General</Accordion.Header>
                            <Accordion.Body>
                                <Row>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            {renderFormLabel('Versión PHP')}
                                            {renderFormControl('general', 'phpVersion', config.general.phpVersion)}
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <div className="d-flex justify-content-between align-items-start">
                                                {renderFormLabel('Versión Node')}
                                                <Form.Check
                                                    type="switch"
                                                    label="Usar Node.js"
                                                    checked={config.general.useNode}
                                                    onChange={e => handleConfigChange('general', 'useNode', e.target.checked)}
                                                />
                                            </div>
                                            {renderFormControl('general', 'nodeVersion', config.general.nodeVersion, 'text', !config.general.useNode)}
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            {renderFormLabel('Ambiente')}
                                            <Form.Select
                                                size="sm"
                                                value={config.general.environment}
                                                onChange={e => handleConfigChange('general', 'environment', e.target.value)}
                                                isInvalid={isFieldInvalid('general', 'environment')}
                                            >
                                                <option value="production">Producción</option>
                                                <option value="integration">Integración</option>
                                                <option value="development">Desarrollo</option>
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            {renderFormLabel('Rama Git')}
                                            {renderFormControl('general', 'branch', config.general.branch)}
                                        </Form.Group>
                                    </Col>
                                </Row>
                            </Accordion.Body>
                        </Accordion.Item>

                        <Accordion.Item eventKey="1">
                            <Accordion.Header>Configuración del Servidor</Accordion.Header>
                            <Accordion.Body>
                                <Row>
                                    <Col md={4}>
                                        <Form.Group className="mb-3">
                                            {renderFormLabel('Servidor')}
                                            {renderFormControl('deploy', 'server', config.deploy.server)}
                                        </Form.Group>
                                    </Col>
                                    <Col md={4}>
                                        <Form.Group className="mb-3">
                                            {renderFormLabel('Usuario')}
                                            {renderFormControl('deploy', 'user', config.deploy.user)}
                                        </Form.Group>
                                    </Col>
                                    <Col md={4}>
                                        <Form.Group className="mb-3">
                                            {renderFormLabel('Ruta de Despliegue')}
                                            {renderFormControl('deploy', 'path', config.deploy.path)}
                                        </Form.Group>
                                    </Col>
                                    <Col xs={12}>
                                        <Form.Group className="mb-3">
                                            <div className="d-flex justify-content-between align-items-center">
                                                {renderFormLabel('SSH Key')}
                                                <Button
                                                    variant="link"
                                                    size="sm"
                                                    className="text-primary p-0"
                                                    onClick={() => setShowSshInstructions(true)}
                                                >
                                                    <FaQuestionCircle /> Ver instrucciones
                                                </Button>
                                            </div>
                                            <Form.Control
                                                size="sm"
                                                as="textarea"
                                                rows={3}
                                                value={config.deploy.ssh_key}
                                                onChange={e => handleConfigChange('deploy', 'ssh_key', e.target.value)}
                                                isInvalid={isFieldInvalid('deploy', 'ssh_key')}
                                                placeholder="Ingrese la clave SSH privada"
                                            />
                                            <Form.Text className="text-muted">
                                                Ingrese la clave SSH privada en formato texto plano
                                            </Form.Text>
                                        </Form.Group>
                                    </Col>
                                </Row>
                            </Accordion.Body>
                        </Accordion.Item>

                        <Accordion.Item eventKey="2">
                            <Accordion.Header>Variables de Entorno</Accordion.Header>
                            <Accordion.Body>
                                <Row className="mb-3">
                                    <Col xs={12}>
                                        <div className="d-flex gap-2">
                                            <Form.Control
                                                size="sm"
                                                type="text"
                                                placeholder="Nueva variable de entorno"
                                                value={newEnvKey}
                                                onChange={e => setNewEnvKey(e.target.value.toUpperCase())}
                                            />
                                            <Button
                                                size="sm"
                                            className="p-1 d-inline-flex align-items-center"
                                                variant="outline-success"
                                                onClick={handleAddEnvVariable}
                                            >
                                                <FaPlus />
                                            </Button>
                                        </div>
                                    </Col>
                                </Row>
                                <Row>
                                    {Object.entries(config.deploy.env).map(([key, value]) => (
                                        <Col md={6} key={key}>
                                            <Form.Group className="mb-3">
                                                <Form.Label className="d-flex justify-content-between align-items-center">
                                                    {key} <span className="text-danger">*</span>
                                                    {key !== 'APP_ENV' && key !== 'APP_URL' && (
                                                        <Button
                                                            size="sm"
                                                            variant="danger"
                                                            className="py-0"
                                                            onClick={() => handleRemoveEnvVariable(key)}
                                                        >
                                                            ×
                                                        </Button>
                                                    )}
                                                </Form.Label>
                                                {renderEnvFormControl(key, value)}
                                            </Form.Group>
                                        </Col>
                                    ))}
                                </Row>
                            </Accordion.Body>
                        </Accordion.Item>
                    </Accordion>
                </Card.Body>
            </Card>

            <SshInstructionsModal 
                show={showSshInstructions} 
                onHide={() => setShowSshInstructions(false)} 
            />

            <Modal
                show={showPreview}
                onHide={() => setShowPreview(false)}
                size="lg"
                dialogClassName="modal-90w"
                fullscreen="lg-down"
            >
                <div style={{ height: '90vh', display: 'flex', flexDirection: 'column' }}>
                    <Modal.Header closeButton className="bg-light">
                        <Modal.Title>Vista Previa del Archivo YAML</Modal.Title>
                    </Modal.Header>
                    <Modal.Body className="p-0" style={{ flex: 1, overflow: 'auto' }}>
                        <CodePreview content={yamlContent} />
                    </Modal.Body>
                    <Modal.Footer className="bg-light border-top">
                        <div className="me-auto">
                            <Button 
                                size="sm" 
                                variant="outline-secondary"
                                onClick={handleCopyToClipboard}
                                className="d-inline-flex align-items-center"
                            >
                                <FaCopy className="me-1" /> Copiar al Portapapeles
                            </Button>
                        </div>
                        <Button size="sm" variant="secondary" onClick={() => setShowPreview(false)}>
                            Cerrar
                        </Button>
                        <Button size="sm" variant="primary" onClick={handleDownload}>
                            Descargar YAML
                        </Button>
                    </Modal.Footer>
                </div>
            </Modal>
        </Container>
    );
};

export default ProjectContinuousDeployment;
