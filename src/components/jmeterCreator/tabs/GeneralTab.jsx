import React from 'react';
import { Form, Row, Col, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { FaInfoCircle } from 'react-icons/fa';

const GeneralTab = ({ value, onChange }) => {
    const { planName, baseUrl, customPort, customPrefix } = value;

    const renderTooltip = (content) => (
        <Tooltip id="tooltip">{content}</Tooltip>
    );

    return (
        <Form className="mb-3">
            <Row className="g-3">
                <Col md={6}>
                    <Form.Group>
                        <Form.Label className="d-flex justify-content-between align-items-center">
                            Test Plan
                            <OverlayTrigger
                                placement="top"
                                overlay={renderTooltip("El Test Plan es el contenedor principal que organiza todos los elementos de tu prueba de carga")}
                            >
                                <FaInfoCircle className="text-muted" style={{ cursor: 'help', fontSize: '0.875rem' }} />
                            </OverlayTrigger>
                        </Form.Label>
                        <Form.Control
                            size="sm"
                            value={planName}
                            onChange={(e) => onChange('planName', e.target.value)}
                            placeholder='Test Plan'
                        />
                        <Form.Text muted className="small">
                            Nombre del plan de pruebas que agrupa todos los escenarios y configuraciones.
                        </Form.Text>
                    </Form.Group>
                </Col>
                <Col md={6}>
                    <Form.Group>
                        <Form.Label className="d-flex justify-content-between align-items-center">
                            Base URL
                            <OverlayTrigger
                                placement="top"
                                overlay={renderTooltip("URL completa del servidor donde se ejecutarán las pruebas. Ejemplo: https://api.miapp.com:8443")}
                            >
                                <FaInfoCircle className="text-muted" style={{ cursor: 'help', fontSize: '0.875rem' }} />
                            </OverlayTrigger>
                        </Form.Label>
                        <Form.Control
                            size="sm"
                            value={baseUrl}
                            onChange={(e) => onChange('baseUrl', e.target.value)}
                            placeholder="https://api.ejemplo.com"
                        />
                        <Form.Text muted className="small">
                            URL base del servidor objetivo. Incluye protocolo y dominio (puerto opcional).
                        </Form.Text>
                    </Form.Group>
                </Col>
            </Row>
            
            <Row className="g-3 mt-3">
                <Col md={6}>
                    <Form.Group>
                        <Form.Label className="d-flex justify-content-between align-items-center">
                            Puerto Personalizado
                            <OverlayTrigger
                                placement="top"
                                overlay={renderTooltip("Puerto específico para todas las peticiones. Sobrescribe el puerto de la URL base. Déjalo vacío para usar el de la URL base.")}
                            >
                                <FaInfoCircle className="text-muted" style={{ cursor: 'help', fontSize: '0.875rem' }} />
                            </OverlayTrigger>
                        </Form.Label>
                        <Form.Control
                            size="sm"
                            type="number"
                            min="1"
                            max="65535"
                            value={customPort || ''}
                            onChange={(e) => onChange('customPort', e.target.value)}
                            placeholder="8080"
                        />
                        <Form.Text muted className="small">
                            Puerto específico que se aplicará a todas las peticiones HTTP.
                        </Form.Text>
                    </Form.Group>
                </Col>
                <Col md={6}>
                    <Form.Group>
                        <Form.Label className="d-flex justify-content-between align-items-center">
                            Prefijo de Ruta
                            <OverlayTrigger
                                placement="top"
                                overlay={renderTooltip("Prefijo común que se añadirá al inicio de todas las rutas. Ejemplo: /api/v1 se agregará antes de cada path de petición.")}
                            >
                                <FaInfoCircle className="text-muted" style={{ cursor: 'help', fontSize: '0.875rem' }} />
                            </OverlayTrigger>
                        </Form.Label>
                        <Form.Control
                            size="sm"
                            value={customPrefix || ''}
                            onChange={(e) => onChange('customPrefix', e.target.value)}
                            placeholder="/api/v1"
                        />
                        <Form.Text muted className="small">
                            Prefijo común que se añadirá al inicio de todas las rutas de peticiones.
                        </Form.Text>
                    </Form.Group>
                </Col>
            </Row>
        </Form>
    );
};

export default GeneralTab;
