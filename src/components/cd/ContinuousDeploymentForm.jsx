import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Row, Col, Accordion, Modal, Badge } from 'react-bootstrap';
import { FaPlus, FaQuestionCircle, FaCopy, FaExternalLinkAlt, FaKey } from 'react-icons/fa';
import { CodePreview } from '@u/CodePreview';
import { useToast } from '@c/ToastContext';
import SshInstructionsModal from '@c/cd/SshInstructionsModal';
import SaveConfigModal from '@c/cd/SaveConfigModal';
import LoadConfigModal from '@c/cd/LoadConfigModal';
import LoadEnvModal from '@c/cd/LoadEnvModal';
import EnvVariableRow from '@c/cd/EnvVariableRow';
import { defaultConfig } from '@/config/ContinuousDeploymentDefaults.jsx';
import { generateYamlContent } from '@c/cd/ContinuousDeploymentYamlGenerator';
import api from '@/api';

export default function ContinuousDeploymentForm({ projectId }) {
    const { showToast } = useToast();
    const [config, setConfig] = useState(defaultConfig);
    const [showPreview, setShowPreview] = useState(false);
    const [yamlContent, setYamlContent] = useState('');
    const [newEnvKey, setNewEnvKey] = useState('');
    const [newEnvValue, setNewEnvValue] = useState('');
    const [newEnvBase64, setNewEnvBase64] = useState(false);
    const [invalidFields, setInvalidFields] = useState([]);
    const [showSshInstructions, setShowSshInstructions] = useState(false);
    const [savedConfigs, setSavedConfigs] = useState([]);
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [showLoadModal, setShowLoadModal] = useState(false);
    const [showLoadEnvModal, setShowLoadEnvModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [variableToDelete, setVariableToDelete] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (projectId) {
            fetchSavedConfigs();
        }
    }, [projectId]);

    const fetchSavedConfigs = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/projects/${projectId}/configs`);
            setSavedConfigs(response.data);
        } catch (error) {
            console.error('Error al cargar configuraciones:', error);
            showToast('error', 'Error al cargar las configuraciones guardadas');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveConfig = async (name) => {
        if (!name.trim()) {
            showToast('error', 'Debe ingresar un nombre para la configuración');
            return;
        }

        try {
            setLoading(true);
            const configData = {
                name: name,
                config: config,
                projectId: projectId || 'global',
                savedAt: new Date().toISOString()
            };
            await api.post(`/projects/${projectId}/configs`, configData);
            await fetchSavedConfigs();
            setShowSaveModal(false);
            showToast('success', 'Configuración guardada correctamente');
        } catch (error) {
            console.error('Error al guardar configuración:', error);
            showToast('error', 'Error al guardar la configuración');
        } finally {
            setLoading(false);
        }
    };

    const handleLoadConfig = (savedConfig) => {
        setConfig(savedConfig);
        setShowLoadModal(false);
        showToast('success', 'Configuración cargada correctamente');
    };

    const handleDeleteConfig = async (name) => {
        try {
            setLoading(true);
            await api.delete(`/projects/${projectId}/configs`, {
                data: { name }
            });
            await fetchSavedConfigs();
            showToast('success', 'Configuración eliminada correctamente');
        } catch (error) {
            console.error('Error al eliminar configuración:', error);
            showToast('error', 'Error al eliminar la configuración');
        } finally {
            setLoading(false);
        }
    };

    const handleConfigChange = (section, field, value) => {
        setConfig(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [field]: value
            }
        }));
    };

    const handleEnvChange = (key, value, base64 = false) => {
        const newValue = base64 ? { value, base64 } : value;
        setConfig(prev => ({
            ...prev,
            deploy: {
                ...prev.deploy,
                env: {
                    ...prev.deploy.env,
                    [key]: newValue
                }
            }
        }));
    };

    const handleAddEnvVariable = () => {
        if (!newEnvKey.trim()) {
            showToast('error', 'El nombre de la variable no puede estar vacío');
            return;
        }

        if (!newEnvValue.trim()) {
            showToast('error', 'El valor de la variable no puede estar vacío');
            return;
        }

        if (config.deploy.env.hasOwnProperty(newEnvKey)) {
            showToast('error', 'La variable ya existe');
            return;
        }

        const newValue = newEnvBase64 ? { value: newEnvValue, base64: true } : newEnvValue;

        setConfig(prev => ({
            ...prev,
            deploy: {
                ...prev.deploy,
                env: {
                    ...prev.deploy.env,
                    [newEnvKey]: newValue
                }
            }
        }));
        setNewEnvKey('');
        setNewEnvValue('');
        setNewEnvBase64(false);
        showToast('success', `Variable ${newEnvKey} agregada correctamente`);
    };

    const handleRemoveEnvVariable = (keyToRemove) => {
        if (keyToRemove === 'APP_ENV' || keyToRemove === 'APP_URL') return;

        setVariableToDelete(keyToRemove);
        setShowDeleteConfirm(true);
    };

    const confirmDeleteEnvVariable = () => {
        setConfig(prev => ({
            ...prev,
            deploy: {
                ...prev.deploy,
                env: Object.fromEntries(
                    Object.entries(prev.deploy.env)
                        .filter(([key]) => key !== variableToDelete)
                )
            }
        }));
        
        showToast('success', `Variable ${variableToDelete} eliminada correctamente`);
        setShowDeleteConfirm(false);
        setVariableToDelete('');
    };

    const cancelDeleteEnvVariable = () => {
        setShowDeleteConfirm(false);
        setVariableToDelete('');
    };

    const handleLoadEnvVariables = (variables, mode) => {
        setConfig(prev => {
            let newEnvVars;
            
            if (mode === 'replace') {
                // Mantener solo APP_ENV y APP_URL, reemplazar el resto
                const preservedVars = {
                    APP_ENV: prev.deploy.env.APP_ENV || 'production',
                    APP_URL: prev.deploy.env.APP_URL || ''
                };
                newEnvVars = { ...preservedVars, ...variables };
            } else {
                // Modo merge: combinar con las existentes
                newEnvVars = { ...prev.deploy.env, ...variables };
            }

            return {
                ...prev,
                deploy: {
                    ...prev.deploy,
                    env: newEnvVars
                }
            };
        });

        const variableCount = Object.keys(variables).length;
        showToast('success', `${variableCount} variables de entorno cargadas correctamente`);
    };

    const validateConfig = () => {
        const invalid = [];

        Object.entries(config.general).forEach(([key, value]) => {
            if (key === 'nodeVersion' && !config.general.useNode) return;
            if (key === 'useNode') return;
            if (typeof value === 'string' && !value.trim()) {
                invalid.push(`general.${key}`);
            }
        });

        Object.entries(config.deploy).forEach(([key, value]) => {
            if (key === 'env') return;
            if (key === 'ssh_key') {
                // Validación específica para SSH key
                if (!value.trim()) {
                    invalid.push(`deploy.${key}`);
                } else if (!value.includes('BEGIN') || !value.includes('END')) {
                    showToast('warning', 'La clave SSH debe incluir los headers BEGIN y END');
                }
                return;
            }
            if (!value.trim()) {
                invalid.push(`deploy.${key}`);
            }
        });

        Object.entries(config.deploy.env).forEach(([key, varConfig]) => {
            const value = typeof varConfig === 'string' ? varConfig : varConfig.value;
            if (!value || !value.trim()) {
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

    const renderFormLabel = (label) => (
        <Form.Label>
            {label} <span className="text-danger">*</span>
        </Form.Label>
    );

    const handlePreview = () => {
        if (!validateConfig()) return;

        setYamlContent(generateYamlContent(config));
        setShowPreview(true);
    };

    const handleDownload = () => {
        const blob = new Blob([yamlContent], { type: 'text/yaml' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `.gitlab-ci.yml`;
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

    const openRepository = () => {
        const repoUrl = config.general.repository;
        if (repoUrl && repoUrl.trim()) {
            window.open(repoUrl, '_blank');
        }
    };

    return (
        <>
            <Card className="my-3">
                <Card.Header className="d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">Configuración de Despliegue Continuo</h5>
                    <div className="d-flex gap-2">
                        <Button 
                            size="sm" 
                            variant="outline-secondary" 
                            onClick={() => setShowLoadModal(true)}
                            disabled={loading}
                        >
                            {loading ? 'Cargando...' : 'Cargar Configuración'}
                        </Button>
                        <Button 
                            size="sm" 
                            variant="outline-primary" 
                            onClick={() => setShowSaveModal(true)}
                            disabled={loading}
                        >
                            {loading ? 'Guardando...' : 'Guardar Configuración'}
                        </Button>
                        <Button size="sm" variant="primary" onClick={handlePreview}>
                            Previsualizar YAML
                        </Button>
                    </div>
                </Card.Header>
                <Card.Body>
                    <Row className="mb-4">
                        <Col xs={12}>
                            <Form.Group>
                                <div className="d-flex justify-content-between align-items-center">
                                    {renderFormLabel('Repositorio')}
                                    {config.general.repository && config.general.repository.trim() && (
                                        <Button
                                            variant="link"
                                            size="sm"
                                            className="text-primary p-0"
                                            onClick={openRepository}
                                        >
                                            <FaExternalLinkAlt className="me-1" />
                                            Abrir repositorio
                                        </Button>
                                    )}
                                </div>
                                <Form.Control
                                    size="sm"
                                    type="url"
                                    value={config.general.repository || ''}
                                    onChange={e => {
                                        handleConfigChange('general', 'repository', e.target.value);
                                        setInvalidFields(prev => prev.filter(f => f !== 'general.repository'));
                                    }}
                                    isInvalid={isFieldInvalid('general', 'repository')}
                                    placeholder="https://gitlab.com/usuario/proyecto.git"
                                />
                                <Form.Text className="text-muted">
                                    URL del repositorio Git donde se encuentra el código fuente
                                </Form.Text>
                            </Form.Group>
                        </Col>
                    </Row>

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
                                
                                <Row>
                                    <Col xs={12}>
                                        <Form.Group className="mb-3">
                                            <Form.Label className="fw-bold">Comandos Artisan en el Pipeline</Form.Label>
                                            <div className="d-flex gap-4">
                                                <Form.Check
                                                    type="checkbox"
                                                    id="run-optimize"
                                                    label="Ejecutar php artisan optimize"
                                                    checked={config.general.runOptimize !== false}
                                                    onChange={e => handleConfigChange('general', 'runOptimize', e.target.checked)}
                                                />
                                                <Form.Check
                                                    type="checkbox"
                                                    id="run-migrate"
                                                    label="Ejecutar php artisan migrate --force"
                                                    checked={config.general.runMigrate !== false}
                                                    onChange={e => handleConfigChange('general', 'runMigrate', e.target.checked)}
                                                />
                                            </div>
                                            <Form.Text className="text-muted">
                                                Seleccione qué comandos Artisan se ejecutarán durante el despliegue
                                            </Form.Text>
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
                                                rows={8}
                                                value={config.deploy.ssh_key}
                                                onChange={e => handleConfigChange('deploy', 'ssh_key', e.target.value)}
                                                isInvalid={isFieldInvalid('deploy', 'ssh_key')}
                                                placeholder="-----BEGIN RSA PRIVATE KEY-----
MIICXAIBAAKBgQC8kGa1pSjbSYZVebtTRBLxBz5H4i2p/llLCrEeQhta5kaQu/Rn
...
-----END RSA PRIVATE KEY-----"
                                                style={{ fontFamily: 'monospace', fontSize: '12px' }}
                                            />
                                            <Form.Text className="text-muted">
                                                Ingrese la clave SSH privada completa con headers BEGIN y END
                                            </Form.Text>
                                        </Form.Group>
                                    </Col>
                                </Row>
                            </Accordion.Body>
                        </Accordion.Item>

                        <Accordion.Item eventKey="2">
                            <Accordion.Header>Variables de Entorno</Accordion.Header>
                            <Accordion.Body>
                                <div className="env-variables-container">
                                    <Row className="mb-3">
                                        <Col xs={12}>
                                            <Row className="g-2 mb-2">
                                                <Col md={4}>
                                                    <Form.Control
                                                        size="sm"
                                                        type="text"
                                                        placeholder="Nombre de la variable"
                                                        value={newEnvKey}
                                                        onChange={e => setNewEnvKey(e.target.value.toUpperCase())}
                                                    />
                                                </Col>
                                                <Col md={8}>
                                                    <div className="d-flex gap-2 align-items-start">
                                                        {newEnvBase64 ? (
                                                            <Form.Control
                                                                size="sm"
                                                                as="textarea"
                                                                rows={3}
                                                                placeholder="Ingrese el contenido que será codificado en Base64..."
                                                                value={newEnvValue}
                                                                onChange={e => setNewEnvValue(e.target.value)}
                                                                style={{ 
                                                                    fontFamily: 'monospace',
                                                                    fontSize: '12px',
                                                                    resize: 'vertical'
                                                                }}
                                                            />
                                                        ) : (
                                                            <Form.Control
                                                                size="sm"
                                                                type="text"
                                                                placeholder="Valor de la variable"
                                                                value={newEnvValue}
                                                                onChange={e => setNewEnvValue(e.target.value)}
                                                            />
                                                        )}
                                                        <div className="d-flex align-items-center gap-2">
                                                            <Form.Check
                                                                type="switch"
                                                                id="new-env-base64"
                                                                checked={newEnvBase64}
                                                                onChange={e => setNewEnvBase64(e.target.checked)}
                                                                className="mb-0"
                                                            />
                                                            {newEnvBase64 ? (
                                                                <Badge bg="warning" text="dark" className="small">
                                                                    <FaKey className="me-1" style={{ fontSize: '10px' }} />
                                                                    Base64
                                                                </Badge>
                                                            ) : (
                                                                <Badge bg="light" text="muted" className="small">
                                                                    Texto
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <Button
                                                            size="sm"
                                                            className="d-inline-flex align-items-center justify-content-center"
                                                            variant="outline-success"
                                                            onClick={handleAddEnvVariable}
                                                            disabled={!newEnvKey.trim() || !newEnvValue.trim()}
                                                            style={{ 
                                                                width: '38px', 
                                                                height: newEnvBase64 ? '38px' : '31px',
                                                                alignSelf: 'flex-start'
                                                            }}
                                                        >
                                                            <FaPlus />
                                                        </Button>
                                                    </div>
                                                </Col>
                                            </Row>
                                            <div className="d-flex justify-content-end">
                                                <Button
                                                    variant="link"
                                                    size="sm"
                                                    className="text-primary p-0"
                                                    onClick={() => setShowLoadEnvModal(true)}
                                                >
                                                    Cargar desde archivo .env
                                                </Button>
                                            </div>
                                        </Col>
                                    </Row>
                                    
                                    {/* Encabezados de columnas para variables existentes */}
                                    {Object.keys(config.deploy.env).length > 0 && (
                                        <Row className="g-2 mb-2">
                                            <Col md={3}>
                                                <small className="text-muted fw-bold">Variable</small>
                                            </Col>
                                            <Col md={6}>
                                                <small className="text-muted fw-bold">Valor</small>
                                            </Col>
                                            <Col md={2}>
                                                <small className="text-muted fw-bold text-center">Codificación</small>
                                            </Col>
                                            <Col md={1}>
                                                <small className="text-muted fw-bold text-center">Acción</small>
                                            </Col>
                                        </Row>
                                    )}

                                    {Object.entries(config.deploy.env).map(([key, value]) => (
                                        <EnvVariableRow
                                            key={key}
                                            envKey={key}
                                            value={value}
                                            onRemove={handleRemoveEnvVariable}
                                            canRemove={key !== 'APP_ENV' && key !== 'APP_URL'}
                                            onChange={handleEnvChange}
                                            isInvalid={isFieldInvalid('env', key)}
                                        />
                                    ))}
                                </div>
                            </Accordion.Body>
                        </Accordion.Item>
                    </Accordion>
                </Card.Body>
            </Card>

            <SaveConfigModal
                show={showSaveModal}
                onHide={() => setShowSaveModal(false)}
                onSave={handleSaveConfig}
                loading={loading}
                defaultName={config.deploy.env.APP_URL || ''}
            />
            <LoadConfigModal
                show={showLoadModal}
                onHide={() => setShowLoadModal(false)}
                configs={savedConfigs}
                onLoad={handleLoadConfig}
                onDelete={handleDeleteConfig}
                loading={loading}
            />
            <LoadEnvModal
                show={showLoadEnvModal}
                onHide={() => setShowLoadEnvModal(false)}
                onLoadEnvVariables={handleLoadEnvVariables}
            />
            <SshInstructionsModal
                show={showSshInstructions}
                onHide={() => setShowSshInstructions(false)}
            />

            {/* Modal de confirmación para eliminar variable */}
            <Modal show={showDeleteConfirm} onHide={cancelDeleteEnvVariable} size="sm" centered>
                <Modal.Header closeButton>
                    <Modal.Title>Confirmar Eliminación</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p className="mb-0">
                        ¿Está seguro de que desea eliminar la variable de entorno{' '}
                        <strong>{variableToDelete}</strong>?
                    </p>
                    <p className="text-muted small mt-2 mb-0">
                        Esta acción no se puede deshacer.
                    </p>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" size="sm" onClick={cancelDeleteEnvVariable}>
                        Cancelar
                    </Button>
                    <Button variant="danger" size="sm" onClick={confirmDeleteEnvVariable}>
                        Eliminar
                    </Button>
                </Modal.Footer>
            </Modal>

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
                            Descargar .gitlab-ci.yml
                        </Button>
                        <Button 
                            size="sm" 
                            variant="success" 
                            onClick={() => {
                                handleDownload();
                                showToast('success', 'Archivo .gitlab-ci.yml generado correctamente siguiendo el template cdv2');
                                setShowPreview(false);
                            }}
                        >
                            Descargar y Finalizar
                        </Button>
                    </Modal.Footer>
                </div>
            </Modal>
        </>
    );
}
