import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Row, Col, Accordion, Modal } from 'react-bootstrap';
import { FaPlus, FaQuestionCircle, FaCopy } from 'react-icons/fa';
import { CodePreview } from '@/utils/CodePreview';
import { useToast } from '@/components/ToastContext';
import SshInstructionsModal from '@/components/cd/SshInstructionsModal';
import SaveConfigModal from '@/components/cd/SaveConfigModal';
import LoadConfigModal from '@/components/cd/LoadConfigModal';
import EnvVariableRow from '@/components/cd/EnvVariableRow';
import { defaultConfig } from '@/config/ContinuousDeploymentDefaults';
import { generateYamlContent } from '@/utils/ContinuousDeploymentYamlGenerator';
import api from '@/api';

export default function ContinuousDeploymentForm({ projectId }) {
    const { showToast } = useToast();
    const [config, setConfig] = useState(defaultConfig);
    const [showPreview, setShowPreview] = useState(false);
    const [yamlContent, setYamlContent] = useState('');
    const [newEnvKey, setNewEnvKey] = useState('');
    const [invalidFields, setInvalidFields] = useState([]);
    const [showSshInstructions, setShowSshInstructions] = useState(false);
    const [savedConfigs, setSavedConfigs] = useState([]);
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [showLoadModal, setShowLoadModal] = useState(false);
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

    const handleEnvChange = (key, value) => {
        const newValue = value;
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

        Object.entries(config.general).forEach(([key, value]) => {
            if (key === 'nodeVersion' && !config.general.useNode) return;
            if (key === 'useNode') return;
            if (!value.trim()) {
                invalid.push(`general.${key}`);
            }
        });

        Object.entries(config.deploy).forEach(([key, value]) => {
            if (key === 'env') return;
            if (!value.trim()) {
                invalid.push(`deploy.${key}`);
            }
        });

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
                                <div className="env-variables-container">
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
            />
            <LoadConfigModal
                show={showLoadModal}
                onHide={() => setShowLoadModal(false)}
                configs={savedConfigs}
                onLoad={handleLoadConfig}
                onDelete={handleDeleteConfig}
                loading={loading}
            />
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
