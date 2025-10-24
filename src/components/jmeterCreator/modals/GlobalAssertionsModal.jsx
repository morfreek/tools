import React, { useState } from 'react';
import { Modal, Button, Form, Card, Row, Col, Alert, Badge } from 'react-bootstrap';
import { FaCheckCircle, FaPlus, FaTimes, FaInfoCircle } from 'react-icons/fa';

const GlobalAssertionsModal = ({ show, onHide, onApply, requestsCount }) => {
    const [responseAssertions, setResponseAssertions] = useState([]);
    const [jsonAssertions, setJsonAssertions] = useState([]);

    // Plantillas predefinidas de assertions comunes
    const responseTemplates = [
        { 
            name: 'Código HTTP 200', 
            field: 'response_code', 
            type: 'equals', 
            pattern: '200',
            description: 'Verifica que la respuesta sea exitosa'
        },
        { 
            name: 'Código HTTP 2xx', 
            field: 'response_code', 
            type: 'matches', 
            pattern: '2\\d\\d',
            description: 'Verifica cualquier código de éxito (200-299)'
        },
        { 
            name: 'No contiene error', 
            field: 'response_data', 
            type: 'not_contains', 
            pattern: 'error',
            description: 'Verifica que la respuesta no contenga la palabra "error"'
        },
        { 
            name: 'Contiene JSON válido', 
            field: 'response_data', 
            type: 'contains', 
            pattern: '{',
            description: 'Verifica que la respuesta contenga JSON'
        }
    ];

    const jsonTemplates = [
        { 
            name: 'Estado exitoso', 
            jsonPath: '$.status', 
            expectedValue: 'success',
            description: 'Verifica que el campo status sea "success"'
        },
        { 
            name: 'Estado verdadero', 
            jsonPath: '$.success', 
            expectedValue: 'true',
            description: 'Verifica que el campo success sea verdadero'
        },
        { 
            name: 'Datos no vacíos', 
            jsonPath: '$.data', 
            expectedValue: '',
            description: 'Verifica que exista el campo data (valor puede estar vacío)'
        },
        { 
            name: 'Sin errores', 
            jsonPath: '$.error', 
            expectedValue: 'null',
            description: 'Verifica que no haya errores'
        }
    ];

    const resetState = () => {
        setResponseAssertions([]);
        setJsonAssertions([]);
    };

    React.useEffect(() => {
        if (show) {
            resetState();
        }
    }, [show]);

    const addResponseAssertion = (template = null) => {
        const newAssertion = {
            id: Date.now() + Math.random(),
            field: template?.field || 'response_code',
            type: template?.type || 'equals',
            pattern: template?.pattern || '200',
            enabled: true
        };
        setResponseAssertions(prev => [...prev, newAssertion]);
    };

    const updateResponseAssertion = (id, updates) => {
        setResponseAssertions(prev => 
            prev.map(assertion => 
                assertion.id === id ? { ...assertion, ...updates } : assertion
            )
        );
    };

    const removeResponseAssertion = (id) => {
        setResponseAssertions(prev => prev.filter(assertion => assertion.id !== id));
    };

    const addJsonAssertion = (template = null) => {
        const newAssertion = {
            id: Date.now() + Math.random(),
            jsonPath: template?.jsonPath || '$.status',
            expectedValue: template?.expectedValue || 'success',
            enabled: true
        };
        setJsonAssertions(prev => [...prev, newAssertion]);
    };

    const updateJsonAssertion = (id, updates) => {
        setJsonAssertions(prev => 
            prev.map(assertion => 
                assertion.id === id ? { ...assertion, ...updates } : assertion
            )
        );
    };

    const removeJsonAssertion = (id) => {
        setJsonAssertions(prev => prev.filter(assertion => assertion.id !== id));
    };

    const handleApply = () => {
        const enabledResponseAssertions = responseAssertions.filter(a => a.enabled);
        const enabledJsonAssertions = jsonAssertions.filter(a => a.enabled);
        
        onApply({
            responseAssertions: enabledResponseAssertions,
            jsonAssertions: enabledJsonAssertions
        });
    };

    const totalAssertions = responseAssertions.filter(a => a.enabled).length + 
                           jsonAssertions.filter(a => a.enabled).length;

    return (
        <Modal show={show} onHide={onHide} size="xl" centered>
            <Modal.Header closeButton>
                <Modal.Title>Configurar Assertions Globales</Modal.Title>
            </Modal.Header>
            
            <Modal.Body>
                <Alert variant="info" className="mb-4">
                    <div className="d-flex align-items-center gap-2 mb-2">
                        <FaInfoCircle />
                        <strong>Assertions Globales</strong>
                    </div>
                    <p className="mb-0 small">
                        Configura assertions que se aplicarán a todas las <strong>{requestsCount} peticiones</strong> existentes. 
                        Estas validaciones verificarán automáticamente las respuestas HTTP.
                    </p>
                </Alert>

                <Row>
                    {/* Response Assertions */}
                    <Col lg={6}>
                        <Card className="h-100">
                            <Card.Header className="py-2">
                                <div className="d-flex justify-content-between align-items-center">
                                    <h6 className="mb-0">Response Assertions</h6>
                                    <Button
                                        size="sm"
                                        variant="outline-success"
                                        onClick={() => addResponseAssertion()}
                                    >
                                        <FaPlus size={10} /> Personalizada
                                    </Button>
                                </div>
                            </Card.Header>
                            <Card.Body className="p-2">
                                {/* Plantillas predefinidas */}
                                <div className="mb-3">
                                    <small className="text-muted mb-2 d-block">Plantillas comunes:</small>
                                    <div className="d-flex flex-wrap gap-1">
                                        {responseTemplates.map((template, index) => (
                                            <Button
                                                key={index}
                                                size="sm"
                                                variant="outline-primary"
                                                onClick={() => addResponseAssertion(template)}
                                                title={template.description}
                                                className="small"
                                            >
                                                {template.name}
                                            </Button>
                                        ))}
                                    </div>
                                </div>

                                {/* Assertions configuradas */}
                                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                    {responseAssertions.map((assertion) => (
                                        <Card key={assertion.id} className="mb-2 border-success border-opacity-25">
                                            <Card.Body className="p-2">
                                                <Row className="g-1 align-items-center">
                                                    <Col md={3}>
                                                        <Form.Select
                                                            size="sm"
                                                            value={assertion.field}
                                                            onChange={(e) => updateResponseAssertion(assertion.id, { field: e.target.value })}
                                                        >
                                                            <option value="response_code">Código</option>
                                                            <option value="response_message">Mensaje</option>
                                                            <option value="response_headers">Headers</option>
                                                            <option value="response_data">Contenido</option>
                                                        </Form.Select>
                                                    </Col>
                                                    <Col md={3}>
                                                        <Form.Select
                                                            size="sm"
                                                            value={assertion.type}
                                                            onChange={(e) => updateResponseAssertion(assertion.id, { type: e.target.value })}
                                                        >
                                                            <option value="equals">Igual a</option>
                                                            <option value="contains">Contiene</option>
                                                            <option value="not_contains">No contiene</option>
                                                            <option value="matches">Regex</option>
                                                        </Form.Select>
                                                    </Col>
                                                    <Col md={4}>
                                                        <Form.Control
                                                            size="sm"
                                                            placeholder="Valor"
                                                            value={assertion.pattern}
                                                            onChange={(e) => updateResponseAssertion(assertion.id, { pattern: e.target.value })}
                                                        />
                                                    </Col>
                                                    <Col md={1}>
                                                        <Form.Check
                                                            type="checkbox"
                                                            checked={assertion.enabled}
                                                            onChange={(e) => updateResponseAssertion(assertion.id, { enabled: e.target.checked })}
                                                        />
                                                    </Col>
                                                    <Col md={1}>
                                                        <Button
                                                            size="sm"
                                                            variant="outline-danger"
                                                            onClick={() => removeResponseAssertion(assertion.id)}
                                                        >
                                                            <FaTimes size={10} />
                                                        </Button>
                                                    </Col>
                                                </Row>
                                            </Card.Body>
                                        </Card>
                                    ))}
                                    
                                    {responseAssertions.length === 0 && (
                                        <Alert variant="light" className="text-center py-2 small">
                                            Usa las plantillas o crea una assertion personalizada
                                        </Alert>
                                    )}
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>

                    {/* JSON Path Assertions */}
                    <Col lg={6}>
                        <Card className="h-100">
                            <Card.Header className="py-2">
                                <div className="d-flex justify-content-between align-items-center">
                                    <h6 className="mb-0">JSON Path Assertions</h6>
                                    <Button
                                        size="sm"
                                        variant="outline-success"
                                        onClick={() => addJsonAssertion()}
                                    >
                                        <FaPlus size={10} /> Personalizada
                                    </Button>
                                </div>
                            </Card.Header>
                            <Card.Body className="p-2">
                                {/* Plantillas predefinidas */}
                                <div className="mb-3">
                                    <small className="text-muted mb-2 d-block">Plantillas comunes:</small>
                                    <div className="d-flex flex-wrap gap-1">
                                        {jsonTemplates.map((template, index) => (
                                            <Button
                                                key={index}
                                                size="sm"
                                                variant="outline-info"
                                                onClick={() => addJsonAssertion(template)}
                                                title={template.description}
                                                className="small"
                                            >
                                                {template.name}
                                            </Button>
                                        ))}
                                    </div>
                                </div>

                                {/* Assertions configuradas */}
                                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                    {jsonAssertions.map((assertion) => (
                                        <Card key={assertion.id} className="mb-2 border-info border-opacity-25">
                                            <Card.Body className="p-2">
                                                <Row className="g-1 align-items-start">
                                                    <Col md={5}>
                                                        <Form.Control
                                                            size="sm"
                                                            placeholder="JSONPath"
                                                            value={assertion.jsonPath}
                                                            onChange={(e) => updateJsonAssertion(assertion.id, { jsonPath: e.target.value })}
                                                        />
                                                    </Col>
                                                    <Col md={4}>
                                                        <Form.Control
                                                            size="sm"
                                                            placeholder="Valor esperado"
                                                            value={assertion.expectedValue}
                                                            onChange={(e) => updateJsonAssertion(assertion.id, { expectedValue: e.target.value })}
                                                        />
                                                    </Col>
                                                    <Col md={1}>
                                                        <Form.Check
                                                            type="checkbox"
                                                            checked={assertion.enabled}
                                                            onChange={(e) => updateJsonAssertion(assertion.id, { enabled: e.target.checked })}
                                                        />
                                                    </Col>
                                                    <Col md={2}>
                                                        <Button
                                                            size="sm"
                                                            variant="outline-danger"
                                                            onClick={() => removeJsonAssertion(assertion.id)}
                                                        >
                                                            <FaTimes size={10} />
                                                        </Button>
                                                    </Col>
                                                </Row>
                                            </Card.Body>
                                        </Card>
                                    ))}
                                    
                                    {jsonAssertions.length === 0 && (
                                        <Alert variant="light" className="text-center py-2 small">
                                            Usa las plantillas o crea una assertion personalizada
                                        </Alert>
                                    )}
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Modal.Body>
            
            <Modal.Footer>
                <div className="d-flex justify-content-between align-items-center w-100">
                    <div>
                        {totalAssertions > 0 && (
                            <Badge bg="success" className="d-flex align-items-center gap-1">
                                <FaCheckCircle size={12} />
                                {totalAssertions} assertions configuradas
                            </Badge>
                        )}
                    </div>
                    <div className="d-flex gap-2">
                        <Button variant="secondary" onClick={onHide}>
                            Cancelar
                        </Button>
                        <Button 
                            variant="primary" 
                            onClick={handleApply}
                            disabled={totalAssertions === 0}
                        >
                            Aplicar a {requestsCount} peticiones
                        </Button>
                    </div>
                </div>
            </Modal.Footer>
        </Modal>
    );
};

export default GlobalAssertionsModal;
