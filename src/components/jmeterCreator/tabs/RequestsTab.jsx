import React, { useRef, useState, useCallback, memo, useMemo } from 'react';
import { Button, Alert, Card, Form, Row, Col, OverlayTrigger, Tooltip, Badge, Collapse, Modal, ButtonGroup } from 'react-bootstrap';
import { FaPlus, FaGlobe, FaInfoCircle, FaTrash, FaCopy, FaUpload, FaCheckCircle, FaTimes, FaChevronDown, FaChevronUp, FaExclamationTriangle } from 'react-icons/fa';
import RoutesSelectorModal from '../modals/RoutesSelectorModal';
import GlobalAssertionsModal from '../modals/GlobalAssertionsModal';
import { useToast } from '@/components/ToastContext';

const RequestsTab = ({ requests, onAdd, onDelete, onDuplicate, onChange, onClearAll }) => {
    const [showRoutesModal, setShowRoutesModal] = useState(false);
    const [showGlobalAssertions, setShowGlobalAssertions] = useState(false);
    const [laravelRoutes, setLaravelRoutes] = useState([]);
    const [showClearModal, setShowClearModal] = useState(false);
    const fileInputRef = useRef(null);
    const { showToast } = useToast();

    const renderTooltip = (content) => (
        <Tooltip id="tooltip" className="text-start" style={{ textAlign: 'left' }}>
            {content}
        </Tooltip>
    );

    const tooltipProps = useMemo(() => ({
        placement: 'left',
        container: typeof document !== 'undefined' ? document.body : undefined,
        delay: { show: 150, hide: 75 },
        popperConfig: {
            strategy: 'fixed',
            modifiers: [
                { name: 'flip', enabled: false },
                { name: 'preventOverflow', options: { boundary: 'viewport', padding: 8 } },
                { name: 'offset', options: { offset: [0, 8] } }
            ]
        }
    }), []);

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        if (!file.name.toLowerCase().endsWith('.json')) {
            showToast('error', 'Por favor seleccione un archivo JSON válido');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const routes = JSON.parse(e.target.result);

                const filtered = routes
                    .filter(route =>
                        route.uri &&
                        route.method &&
                        route.uri !== '/' &&
                        !route.uri.startsWith('_') &&
                        !route.uri.includes('sanctum/csrf-cookie') &&
                        ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD'].some(m =>
                            route.method.includes(m)
                        )
                    )
                    .map(route => ({
                        ...route,
                        method: route.method.replace('GET|HEAD', 'GET').split('|')[0],
                        uri: route.uri.startsWith('/') ? route.uri : '/' + route.uri
                    }));

                if (filtered.length === 0) {
                    showToast('warning', 'No se encontraron rutas válidas en el archivo JSON');
                    return;
                }

                setLaravelRoutes(filtered);
                setShowRoutesModal(true);
                showToast('success', `Archivo cargado: ${filtered.length} rutas encontradas`);
            } catch (error) {
                console.error('Error parsing JSON:', error);
                showToast('error', 'Archivo JSON inválido. Verifique el formato.');
            }
        };
        reader.readAsText(file);

        event.target.value = '';
    };

    const handleRoutesSelected = (selectedRoutes) => {
        selectedRoutes.forEach((route, routeIndex) => {
            const request = {
                name: route.name || `${route.method.toUpperCase()} ${route.uri}`,
                method: route.method.toUpperCase(),
                path: route.uri,
                headersText: '',
                bodyText: '',
                paramsText: '',
                enabled: true,
                responseAssertions: [],
                jsonAssertions: [],
                dataEnabled: false,
                advancedEnabled: false,
                assertionsEnabled: false,
                id: Date.now() + routeIndex
            };

            onAdd();

            setTimeout(() => {
                const currentRequestIndex = requests.length + routeIndex;
                onChange(currentRequestIndex, request);
            }, routeIndex * 10);
        });

        setShowRoutesModal(false);
        showToast('success', `${selectedRoutes.length} rutas agregadas como peticiones HTTP`);
    };

    const handleGlobalAssertionsApply = (assertions) => {
        const { responseAssertions, jsonAssertions } = assertions;

        requests.forEach((_, index) => {
            const updatedRequest = { ...requests[index] };

            if (responseAssertions.length > 0) {
                const existingResponseAssertions = updatedRequest.responseAssertions || [];
                const newResponseAssertions = responseAssertions.filter(newAssertion =>
                    !existingResponseAssertions.some(existing =>
                        existing.field === newAssertion.field &&
                        existing.pattern === newAssertion.pattern
                    )
                );
                updatedRequest.responseAssertions = [...existingResponseAssertions, ...newResponseAssertions];
                updatedRequest.assertionsEnabled = true;
            }

            if (jsonAssertions.length > 0) {
                const existingJsonAssertions = updatedRequest.jsonAssertions || [];
                const newJsonAssertions = jsonAssertions.filter(newAssertion =>
                    !existingJsonAssertions.some(existing =>
                        existing.jsonPath === newAssertion.jsonPath
                    )
                );
                updatedRequest.jsonAssertions = [...existingJsonAssertions, ...newJsonAssertions];
                updatedRequest.assertionsEnabled = true;
            }

            onChange(index, updatedRequest);
        });

        const totalAdded = responseAssertions.length + jsonAssertions.length;
        showToast('success', `Se agregaron ${totalAdded} assertions globales a ${requests.length} peticiones`);
        setShowGlobalAssertions(false);
    };

    const handleClearAll = () => {
        onClearAll();
        setShowClearModal(false);
    };

    const requestHandlers = useMemo(() => {
        return requests.map((_, index) => ({
            addResponseAssertion: () => {
                const newAssertion = {
                    id: Date.now(),
                    field: 'response_code',
                    pattern: '200',
                    type: 'equals',
                    enabled: true
                };
                const updatedAssertions = [...(requests[index].responseAssertions || []), newAssertion];
                onChange(index, { responseAssertions: updatedAssertions });
            },
            updateResponseAssertion: (assertionId, updates) => {
                const assertions = requests[index].responseAssertions || [];
                const updatedAssertions = assertions.map(assertion =>
                    assertion.id === assertionId ? { ...assertion, ...updates } : assertion
                );
                onChange(index, { responseAssertions: updatedAssertions });
            },
            removeResponseAssertion: (assertionId) => {
                const assertions = requests[index].responseAssertions || [];
                const updatedAssertions = assertions.filter(assertion => assertion.id !== assertionId);
                onChange(index, { responseAssertions: updatedAssertions });
            },
            addJsonAssertion: () => {
                const newAssertion = {
                    id: Date.now(),
                    jsonPath: '$.status',
                    expectedValue: 'success',
                    enabled: true
                };
                const updatedAssertions = [...(requests[index].jsonAssertions || []), newAssertion];
                onChange(index, { jsonAssertions: updatedAssertions });
            },
            updateJsonAssertion: (assertionId, updates) => {
                const assertions = requests[index].jsonAssertions || [];
                const updatedAssertions = assertions.map(assertion =>
                    assertion.id === assertionId ? { ...assertion, ...updates } : assertion
                );
                onChange(index, { jsonAssertions: updatedAssertions });
            },
            removeJsonAssertion: (assertionId) => {
                const assertions = requests[index].jsonAssertions || [];
                const updatedAssertions = assertions.filter(assertion => assertion.id !== assertionId);
                onChange(index, { jsonAssertions: updatedAssertions });
            },
            onRequestChange: (updates) => onChange(index, updates),
            onDuplicate: () => onDuplicate(index),
            onDelete: () => onDelete(index)
        }));
    }, [requests, onChange, onDuplicate, onDelete]);

    return (
        <div>
            <Alert variant="info">
                <div className="d-flex align-items-center">
                    <FaGlobe className="me-2" />
                    <strong>Peticiones HTTP</strong>
                </div>
                <p className="mb-0 mt-1 small">
                    Define las peticiones HTTP que JMeter ejecutará. Puedes agregarlas manualmente o cargar rutas desde Laravel.
                </p>
            </Alert>
            <Alert variant="light" className="small">
                <strong>💡 Tip:</strong> Para obtener el archivo routes.json de Laravel, ejecuta en tu proyecto:
                <br />
                <code className="bg-dark text-light px-2 py-1 rounded mt-1 d-inline-block">
                    php artisan route:list --json &gt; routes.json
                </code>
            </Alert>

            <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="m-0 d-flex align-items-center gap-2">
                    Lista de Peticiones
                    <span className="badge bg-secondary">{requests.length}</span>
                </h6>
                <div className="d-flex gap-2">
                    <Button
                        size="sm"
                        variant="outline-success"
                        onClick={() => setShowGlobalAssertions(true)}
                        className="d-flex align-items-center gap-1"
                        disabled={requests.length === 0}
                    >
                        <FaCheckCircle size={12} />
                        Assertions globales
                    </Button>
                    <Button
                        size="sm"
                        variant="outline-primary"
                        onClick={() => fileInputRef.current?.click()}
                        className="d-flex align-items-center gap-1"
                    >
                        <FaUpload size={12} />
                        Cargar routes.json
                    </Button>
                    <Button
                        size="sm"
                        variant="primary"
                        onClick={onAdd}
                        className="d-flex align-items-center gap-1"
                    >
                        <FaPlus size={12} />
                        Añadir petición
                    </Button>
                    {requests.length > 0 && (
                        <Button
                            size="sm"
                            variant="outline-danger"
                            onClick={() => setShowClearModal(true)}
                            className="d-flex align-items-center gap-1"
                        >
                            <FaTrash size={12} />
                            Limpiar Todo
                        </Button>
                    )}
                </div>
            </div>

            <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                style={{ display: 'none' }}
                onChange={handleFileUpload}
            />

            {requests.length === 0 && (
                <Alert variant="light" className="text-center border">
                    <p className="mb-2">No hay peticiones HTTP configuradas</p>
                    <div className="d-flex gap-2 justify-content-center">
                        <Button size="sm" variant="outline-primary" onClick={() => fileInputRef.current?.click()}>
                            Cargar desde Laravel
                        </Button>
                        <Button size="sm" variant="outline-primary" onClick={onAdd}>
                            Añadir manualmente
                        </Button>
                    </div>
                </Alert>
            )}

            {requests.map((req, idx) => (
                <RequestCard 
                    key={req.id || `request-${idx}`}
                    req={req} 
                    index={idx}
                    handlers={requestHandlers[idx]}
                    renderTooltip={renderTooltip}
                    tooltipProps={tooltipProps}
                />
            ))}

            <RoutesSelectorModal
                show={showRoutesModal}
                onHide={() => setShowRoutesModal(false)}
                routes={laravelRoutes}
                onRoutesSelected={handleRoutesSelected}
            />

            <GlobalAssertionsModal
                show={showGlobalAssertions}
                onHide={() => setShowGlobalAssertions(false)}
                onApply={handleGlobalAssertionsApply}
                requestsCount={requests.length}
            />

            <Modal show={showClearModal} onHide={() => setShowClearModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>
                        <FaExclamationTriangle className="text-warning me-2" />
                        Confirmar eliminación
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>
                        ¿Estás seguro de que deseas eliminar todas las peticiones HTTP?
                    </p>
                    <p className="mb-0">
                        <strong>Se eliminarán {requests.length} peticiones.</strong> Esta acción no se puede deshacer.
                    </p>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowClearModal(false)}>
                        Cancelar
                    </Button>
                    <Button variant="danger" onClick={handleClearAll}>
                        <FaTrash className="me-1" />
                        Eliminar Todo
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

const RequestCard = memo(({ req, index, handlers, renderTooltip, tooltipProps }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [showJsonHelp, setShowJsonHelp] = useState(false);

    const methodVariant = (method = 'GET') => {
        switch ((method || 'GET').toUpperCase()) {
            case 'POST': return 'success';
            case 'PUT': return 'warning';
            case 'PATCH': return 'warning';
            case 'DELETE': return 'danger';
            default: return 'info';
        }
    };

    const totalAssertions = (req.responseAssertions?.length || 0) + (req.jsonAssertions?.length || 0);

    const dataEnabled = !!req.dataEnabled;
    const advancedEnabled = !!req.advancedEnabled;
    const assertionsEnabled = !!req.assertionsEnabled;

    return (
        <Card className="mb-2 shadow-sm">
            <Card.Header
                className="py-1 px-2"
                onClick={() => setIsOpen(v => !v)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setIsOpen(v => !v);
                    }
                }}
                role="button"
                tabIndex={0}
                aria-expanded={isOpen}
                style={{ cursor: 'pointer' }}
            >
                <div className="d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center gap-2 flex-wrap">
                        <span className="text-muted d-inline-flex align-items-center">
                            {isOpen ? <FaChevronUp size={14} /> : <FaChevronDown size={14} />}
                        </span>
                        <Badge bg={methodVariant(req.method)}>{(req.method || 'GET').toUpperCase()}</Badge>
                        <span className="fw-bold text-muted">#{index + 1} - {req.name || 'Nueva petición'}</span>
                        {req.path && <small className="text-muted">{req.path}</small>}
                        {totalAssertions > 0 && (
                            <Badge bg="success" className="d-flex align-items-center gap-1">
                                <FaCheckCircle size={10} />
                                {totalAssertions} assertions
                            </Badge>
                        )}
                    </div>
                    <div className="btn-group btn-group-sm" onClick={(e) => e.stopPropagation()}>
                        <button
                            className="btn btn-outline-secondary p-1"
                            onClick={(e) => { e.stopPropagation(); handlers.onDuplicate(); }}
                            aria-label="Duplicar"
                        >
                            <FaCopy size={14} />
                        </button>
                        <button
                            className="btn btn-outline-danger p-1"
                            onClick={(e) => { e.stopPropagation(); handlers.onDelete(); }}
                            aria-label="Eliminar"
                        >
                            <FaTrash size={14} />
                        </button>
                    </div>
                </div>
            </Card.Header>

            <Collapse in={isOpen}>
                <div>
                    <Card.Body className="p-2">
                        <Form>
                            <h6 className="mb-2">Básico</h6>
                            <Row className="g-2 mb-2">
                                <Col lg={5} md={6}>
                                    <Form.Group>
                                        <Form.Label className="d-flex justify-content-between align-items-center">
                                            <span>Nombre de la petición</span>
                                            <OverlayTrigger {...tooltipProps} overlay={renderTooltip("Nombre descriptivo que aparecerá en JMeter")}>
                                                <FaInfoCircle className="text-muted" style={{ cursor: 'help', fontSize: '0.875rem' }} />
                                            </OverlayTrigger>
                                        </Form.Label>
                                        <Form.Control
                                            size="sm"
                                            value={req.name || ''}
                                            onChange={(e) => handlers.onRequestChange({ name: e.target.value })}
                                            placeholder="Ej: Login de usuario"
                                        />
                                    </Form.Group>
                                </Col>
                                <Col lg={3} md={3}>
                                    <Form.Group>
                                        <Form.Label className="d-flex justify-content-between align-items-center">
                                            <span>Método HTTP</span>
                                            <OverlayTrigger {...tooltipProps} overlay={renderTooltip("Verbo HTTP: GET, POST, PUT, PATCH, DELETE")}>
                                                <FaInfoCircle className="text-muted" style={{ cursor: 'help', fontSize: '0.875rem' }} />
                                            </OverlayTrigger>
                                        </Form.Label>
                                        <Form.Select
                                            size="sm"
                                            value={req.method || 'GET'}
                                            onChange={(e) => handlers.onRequestChange({ method: e.target.value })}
                                        >
                                            <option value="GET">GET</option>
                                            <option value="POST">POST</option>
                                            <option value="PUT">PUT</option>
                                            <option value="PATCH">PATCH</option>
                                            <option value="DELETE">DELETE</option>
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                                <Col lg={4} md={3}>
                                    <Form.Group>
                                        <Form.Label>Estado</Form.Label>
                                        <Form.Select
                                            size="sm"
                                            value={req.enabled !== false ? 'enabled' : 'disabled'}
                                            onChange={(e) => handlers.onRequestChange({ enabled: e.target.value === 'enabled' })}
                                        >
                                            <option value="enabled">Habilitada</option>
                                            <option value="disabled">Deshabilitada</option>
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                            </Row>
                            <Row className="g-2 mb-2">
                                <Col md={12}>
                                    <Form.Group>
                                        <Form.Label className="d-flex justify-content-between align-items-center">
                                            <span>Ruta del endpoint</span>
                                            <OverlayTrigger {...tooltipProps} overlay={renderTooltip("Ruta relativa a la Base URL. Ejemplo: /api/users/123")}>
                                                <FaInfoCircle className="text-muted" style={{ cursor: 'help', fontSize: '0.875rem' }} />
                                            </OverlayTrigger>
                                        </Form.Label>
                                        <Form.Control
                                            size="sm"
                                            placeholder="/api/endpoint"
                                            value={req.path || ''}
                                            onChange={(e) => handlers.onRequestChange({ path: e.target.value })}
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>

                            <div className="d-flex flex-wrap align-items-center gap-3 mb-2">
                                <small className="text-muted">Secciones:</small>
                                <Form.Check
                                    type="switch"
                                    id={`sec-data-${index}`}
                                    label="Datos"
                                    checked={dataEnabled}
                                    onChange={(e) => handlers.onRequestChange({ dataEnabled: e.target.checked })}
                                />
                                <Form.Check
                                    type="switch"
                                    id={`sec-adv-${index}`}
                                    label="Avanzado"
                                    checked={advancedEnabled}
                                    onChange={(e) => handlers.onRequestChange({ advancedEnabled: e.target.checked })}
                                />
                                <Form.Check
                                    type="switch"
                                    id={`sec-assert-${index}`}
                                    label="Assertions"
                                    checked={assertionsEnabled}
                                    onChange={(e) => handlers.onRequestChange({ assertionsEnabled: e.target.checked })}
                                />
                            </div>

                            {dataEnabled && (
                                <>
                                    <div className="border-top my-2" />
                                    <h6 className="mb-2">Datos</h6>
                                    <Row className="g-2">
                                        <Col lg={5}>
                                            <Form.Group>
                                                <Form.Label className="d-flex justify-content-between align-items-center">
                                                    <span>Headers HTTP</span>
                                                    <OverlayTrigger {...tooltipProps} overlay={renderTooltip("Una cabecera por línea en formato Nombre:Valor")}>
                                                        <FaInfoCircle className="text-muted" style={{ cursor: 'help', fontSize: '0.875rem' }} />
                                                    </OverlayTrigger>
                                                </Form.Label>
                                                <Form.Control
                                                    size="sm"
                                                    as="textarea"
                                                    rows={3}
                                                    value={req.headersText || ''}
                                                    onChange={(e) => handlers.onRequestChange({ headersText: e.target.value })}
                                                    placeholder="Content-Type:application/json&#10;Authorization:Bearer token123"
                                                />
                                                <Form.Text muted className="small">
                                                    Formato: <code>Nombre:Valor</code> (una por línea)
                                                </Form.Text>
                                            </Form.Group>
                                        </Col>
                                        <Col lg={7}>
                                            {req.method === 'GET' ? (
                                                <Form.Group>
                                                    <Form.Label className="d-flex justify-content-between align-items-center">
                                                        <span>Query Parameters</span>
                                                        <OverlayTrigger {...tooltipProps} overlay={renderTooltip("Parámetros de consulta que se añaden a la URL")}>
                                                            <FaInfoCircle className="text-muted" style={{ cursor: 'help', fontSize: '0.875rem' }} />
                                                        </OverlayTrigger>
                                                    </Form.Label>
                                                    <Form.Control
                                                        size="sm"
                                                        as="textarea"
                                                        rows={3}
                                                        value={req.paramsText || ''}
                                                        onChange={(e) => handlers.onRequestChange({ paramsText: e.target.value })}
                                                        placeholder="page=1&#10;limit=10&#10;search=usuario"
                                                    />
                                                    <Form.Text muted className="small">
                                                        Formato: <code>clave=valor</code> (uno por línea)
                                                    </Form.Text>
                                                </Form.Group>
                                            ) : (
                                                <Form.Group>
                                                    <Form.Label className="d-flex justify-content-between align-items-center">
                                                        <span>Body (JSON/XML/Texto)</span>
                                                        <OverlayTrigger {...tooltipProps} overlay={renderTooltip("Cuerpo de la petición en formato JSON, XML o texto plano")}>
                                                            <FaInfoCircle className="text-muted" style={{ cursor: 'help', fontSize: '0.875rem' }} />
                                                        </OverlayTrigger>
                                                    </Form.Label>
                                                    <Form.Control
                                                        size="sm"
                                                        as="textarea"
                                                        rows={3}
                                                        value={req.bodyText || ''}
                                                        onChange={(e) => handlers.onRequestChange({ bodyText: e.target.value })}
                                                        placeholder='{"name": "Juan", "email": "juan@ejemplo.com"}'
                                                    />
                                                    <Form.Text muted className="small">
                                                        Incluye header <code>Content-Type</code> apropiado
                                                    </Form.Text>
                                                </Form.Group>
                                            )}
                                        </Col>
                                    </Row>
                                </>
                            )}

                            {advancedEnabled && (
                                <>
                                    <div className="border-top my-2" />
                                    <h6 className="mb-2">Avanzado</h6>
                                    <Row className="g-2">
                                        <Col md={4}>
                                            <Form.Group>
                                                <Form.Label>Timeout conexión (ms)</Form.Label>
                                                <Form.Control
                                                    size="sm"
                                                    type="number"
                                                    min="0"
                                                    value={req.connectTimeout || ''}
                                                    onChange={(e) => handlers.onRequestChange({ connectTimeout: e.target.value })}
                                                    placeholder="5000"
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={4}>
                                            <Form.Group>
                                                <Form.Label>Timeout respuesta (ms)</Form.Label>
                                                <Form.Control
                                                    size="sm"
                                                    type="number"
                                                    min="0"
                                                    value={req.responseTimeout || ''}
                                                    onChange={(e) => handlers.onRequestChange({ responseTimeout: e.target.value })}
                                                    placeholder="30000"
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={4}>
                                            <Form.Group>
                                                <Form.Label>Seguir redirecciones</Form.Label>
                                                <Form.Select
                                                    size="sm"
                                                    value={req.followRedirects !== false ? 'true' : 'false'}
                                                    onChange={(e) => handlers.onRequestChange({ followRedirects: e.target.value === 'true' })}
                                                >
                                                    <option value="true">Sí</option>
                                                    <option value="false">No</option>
                                                </Form.Select>
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                </>
                            )}

                            {assertionsEnabled && (
                                <>
                                    <div className="border-top my-2" />
                                    <h6 className="mb-2">Assertions</h6>
                                    <div className="border rounded p-2 bg-light">
                                        <div className="mb-3">
                                            <div className="d-flex justify-content-between align-items-center mb-2">
                                                <h6 className="m-0 d-flex align-items-center gap-2">
                                                    Response Assertions
                                                    <OverlayTrigger {...tooltipProps} overlay={renderTooltip("Valida aspectos de la respuesta HTTP como código de estado, headers o contenido")}>
                                                        <FaInfoCircle className="text-muted" style={{ cursor: 'help', fontSize: '0.875rem' }} />
                                                    </OverlayTrigger>
                                                </h6>
                                                <Button
                                                    size="sm"
                                                    variant="outline-success"
                                                    onClick={handlers.addResponseAssertion}
                                                    className="d-flex align-items-center gap-1"
                                                >
                                                    <FaPlus size={10} />
                                                    Agregar
                                                </Button>
                                            </div>

                                            {req.responseAssertions?.map((assertion) => (
                                                <Card key={assertion.id} className="mb-2 border-success border-opacity-25">
                                                    <Card.Body className="p-2">
                                                        <Row className="g-1 align-items-center">
                                                            <Col md={3}>
                                                                <Form.Select
                                                                    size="sm"
                                                                    value={assertion.field}
                                                                    onChange={(e) => handlers.updateResponseAssertion(assertion.id, { field: e.target.value })}
                                                                >
                                                                    <option value="response_code">Código de respuesta</option>
                                                                    <option value="response_message">Mensaje de respuesta</option>
                                                                    <option value="response_headers">Headers de respuesta</option>
                                                                    <option value="response_data">Contenido de respuesta</option>
                                                                </Form.Select>
                                                            </Col>
                                                            <Col md={2}>
                                                                <Form.Select
                                                                    size="sm"
                                                                    value={assertion.type}
                                                                    onChange={(e) => handlers.updateResponseAssertion(assertion.id, { type: e.target.value })}
                                                                >
                                                                    <option value="equals">Igual a</option>
                                                                    <option value="contains">Contiene</option>
                                                                    <option value="not_contains">No contiene</option>
                                                                    <option value="matches">Coincide (regex)</option>
                                                                    <option value="not_equals">No igual a</option>
                                                                </Form.Select>
                                                            </Col>
                                                            <Col md={4}>
                                                                <Form.Control
                                                                    size="sm"
                                                                    placeholder="Valor esperado"
                                                                    value={assertion.pattern}
                                                                    onChange={(e) => handlers.updateResponseAssertion(assertion.id, { pattern: e.target.value })}
                                                                />
                                                            </Col>
                                                            <Col md={2}>
                                                                <Form.Check
                                                                    type="checkbox"
                                                                    label="Activo"
                                                                    checked={assertion.enabled}
                                                                    onChange={(e) => handlers.updateResponseAssertion(assertion.id, { enabled: e.target.checked })}
                                                                />
                                                            </Col>
                                                            <Col md={1}>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline-danger"
                                                                    onClick={() => handlers.removeResponseAssertion(assertion.id)}
                                                                >
                                                                    <FaTimes size={10} />
                                                                </Button>
                                                            </Col>
                                                        </Row>
                                                    </Card.Body>
                                                </Card>
                                            ))}

                                            {req.responseAssertions?.length === 0 && (
                                                <Alert variant="light" className="small text-center py-2 mb-0">
                                                    No hay response assertions configuradas
                                                </Alert>
                                            )}
                                        </div>

                                        <div className="mb-2">
                                            <div className="d-flex justify-content-between align-items-center mb-2">
                                                <h6 className="m-0 d-flex align-items-center gap-2">
                                                    JSON Path Assertions
                                                    <OverlayTrigger {...tooltipProps} overlay={renderTooltip("Valida valores específicos dentro de respuestas JSON usando JSONPath")}>
                                                        <FaInfoCircle className="text-muted" style={{ cursor: 'help', fontSize: '0.875rem' }} />
                                                    </OverlayTrigger>
                                                </h6>
                                                <div className="d-flex gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline-secondary"
                                                        onClick={() => setShowJsonHelp(true)}
                                                        className="d-flex align-items-center gap-1"
                                                    >
                                                        <FaInfoCircle size={12} /> Ejemplos
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline-success"
                                                        onClick={handlers.addJsonAssertion}
                                                        className="d-flex align-items-center gap-1"
                                                    >
                                                        <FaPlus size={10} /> Agregar
                                                    </Button>
                                                </div>
                                            </div>

                                            {req.jsonAssertions?.map((assertion) => (
                                                <Card key={assertion.id} className="mb-2 border-info border-opacity-25">
                                                    <Card.Body className="p-2">
                                                        <Row className="g-1 align-items-start">
                                                            <Col md={4}>
                                                                <Form.Control
                                                                    size="sm"
                                                                    placeholder="JSONPath (ej: $.data.id)"
                                                                    value={assertion.jsonPath}
                                                                    onChange={(e) => handlers.updateJsonAssertion(assertion.id, { jsonPath: e.target.value })}
                                                                />
                                                                <Form.Text className="small text-muted">
                                                                    Ej: $.status, $.data[0].name
                                                                </Form.Text>
                                                            </Col>
                                                            <Col md={4}>
                                                                <Form.Control
                                                                    size="sm"
                                                                    placeholder="Valor esperado"
                                                                    value={assertion.expectedValue}
                                                                    onChange={(e) => handlers.updateJsonAssertion(assertion.id, { expectedValue: e.target.value })}
                                                                />
                                                            </Col>
                                                            <Col md={2}>
                                                                <Form.Check
                                                                    type="checkbox"
                                                                    label="Activo"
                                                                    checked={assertion.enabled}
                                                                    onChange={(e) => handlers.updateJsonAssertion(assertion.id, { enabled: e.target.checked })}
                                                                />
                                                            </Col>
                                                            <Col md={2}>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline-danger"
                                                                    onClick={() => handlers.removeJsonAssertion(assertion.id)}
                                                                >
                                                                    <FaTimes size={10} />
                                                                </Button>
                                                            </Col>
                                                        </Row>
                                                    </Card.Body>
                                                </Card>
                                            ))}

                                            {req.jsonAssertions?.length === 0 && (
                                                <Alert variant="light" className="small text-center py-2 mb-0">
                                                    No hay JSON assertions configuradas
                                                </Alert>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}
                        </Form>
                    </Card.Body>
                </div>
            </Collapse>

            <style>
                {`.modal-backdrop { z-index: 1055 !important; }`}
            </style>
            <Modal
                show={showJsonHelp}
                onHide={() => setShowJsonHelp(false)}
                centered
                size="md"
                backdrop="static"
                style={{ zIndex: 1056 }}
            >
                <Modal.Header closeButton className="pb-1 pt-2">
                    <Modal.Title>Ejemplos de JSONPath</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Alert variant="info" className="small mb-0">
                        <ul className="mb-0 mt-1">
                            <li><code>$.status</code> - Valor del campo "status" en el root</li>
                            <li><code>$.data.user.id</code> - ID del usuario dentro de data</li>
                            <li><code>$.items[0].name</code> - Nombre del primer elemento en array items</li>
                            <li><code>$.errors.length()</code> - Cantidad de errores</li>
                        </ul>
                    </Alert>
                </Modal.Body>
                <Modal.Footer className="pt-1 pb-2">
                    <Button variant="danger" size="sm" onClick={() => setShowJsonHelp(false)}>
                        Entendido
                    </Button>
                </Modal.Footer>
            </Modal>
        </Card>
    );
});

export default RequestsTab;
