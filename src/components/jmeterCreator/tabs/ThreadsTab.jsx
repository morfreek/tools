import React from 'react';
import { Form, Row, Col, OverlayTrigger, Tooltip, Alert } from 'react-bootstrap';
import { FaInfoCircle, FaUsers } from 'react-icons/fa';

const ThreadsTab = ({ value, onChange }) => {
    const { threads, rampUp, loops, duration, scheduler } = value;

    const renderTooltip = (content) => (
        <Tooltip id="tooltip">{content}</Tooltip>
    );

    return (
        <div>
            <Alert variant="info" className="mb-4">
                <FaUsers className="me-2" />
                <strong>Configuración del Thread Group</strong>
                <p className="mb-0 mt-1 small">
                    Define cómo JMeter simulará usuarios virtuales y la carga de trabajo sobre tu aplicación.
                </p>
            </Alert>

            <Form>
                <Row className="g-3">
                    <Col md={4}>
                        <Form.Group>
                            <Form.Label className="d-flex justify-content-between align-items-center">
                                <span>Número de Threads (Usuarios)</span>
                                <OverlayTrigger
                                    placement="top"
                                    overlay={renderTooltip("Cada thread simula un usuario concurrente. 10 threads = 10 usuarios simultáneos ejecutando el plan")}
                                >
                                    <FaInfoCircle className="text-muted" style={{ cursor: 'help', fontSize: '0.875rem' }} />
                                </OverlayTrigger>
                            </Form.Label>
                            <Form.Control
                                size="sm"
                                type="number"
                                min="1"
                                value={threads}
                                onChange={(e) => onChange('threads', Number(e.target.value || 1))}
                            />
                            <Form.Text muted className="small">
                                Número de usuarios virtuales concurrentes.
                            </Form.Text>
                        </Form.Group>
                    </Col>
                    
                    <Col md={4}>
                        <Form.Group>
                            <Form.Label className="d-flex justify-content-between align-items-center">
                                <span>Ramp-up Period (segundos)</span>
                                <OverlayTrigger
                                    placement="top"
                                    overlay={renderTooltip("Tiempo para alcanzar el número total de usuarios. 60s con 10 usuarios = 1 usuario cada 6 segundos")}
                                >
                                    <FaInfoCircle className="text-muted" style={{ cursor: 'help', fontSize: '0.875rem' }} />
                                </OverlayTrigger>
                            </Form.Label>
                            <Form.Control
                                size="sm"
                                type="number"
                                min="0"
                                value={rampUp}
                                onChange={(e) => onChange('rampUp', Number(e.target.value || 0))}
                            />
                            <Form.Text muted className="small">
                                Tiempo para iniciar todos los threads gradualmente.
                            </Form.Text>
                        </Form.Group>
                    </Col>
                    
                    <Col md={4}>
                        <Form.Group>
                            <Form.Label className="d-flex justify-content-between align-items-center">
                                <span>Loop Count (Iteraciones)</span>
                                <OverlayTrigger
                                    placement="top"
                                    overlay={renderTooltip("Número de veces que cada usuario repetirá todas las peticiones. -1 = infinito")}
                                >
                                    <FaInfoCircle className="text-muted" style={{ cursor: 'help', fontSize: '0.875rem' }} />
                                </OverlayTrigger>
                            </Form.Label>
                            <Form.Control
                                size="sm"
                                type="number"
                                min="-1"
                                value={loops}
                                onChange={(e) => onChange('loops', Number(e.target.value || 1))}
                            />
                            <Form.Text muted className="small">
                                Iteraciones por thread (-1 para infinito).
                            </Form.Text>
                        </Form.Group>
                    </Col>
                </Row>

                <Row className="g-3 mt-3">
                    <Col md={12}>
                        <Form.Group>
                            <Form.Label className="d-flex justify-content-between align-items-center">
                                <span>Usar Scheduler</span>
                                <OverlayTrigger
                                    placement="top"
                                    overlay={renderTooltip("Habilita el programador para controlar duración y tiempo de inicio de la prueba")}
                                >
                                    <FaInfoCircle className="text-muted" style={{ cursor: 'help', fontSize: '0.875rem' }} />
                                </OverlayTrigger>
                            </Form.Label>
                            <Form.Check
                                type="switch"
                                id="scheduler-switch"
                                label="Activar programador de tiempo"
                                checked={scheduler || false}
                                onChange={(e) => onChange('scheduler', e.target.checked)}
                            />
                            <Form.Text muted className="small">
                                Permite establecer duración específica de la prueba.
                            </Form.Text>
                        </Form.Group>
                    </Col>
                </Row>

                {scheduler && (
                    <Row className="g-3 mt-3">
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label className="d-flex justify-content-between align-items-center">
                                    <span>Duración (segundos)</span>
                                    <OverlayTrigger
                                        placement="top"
                                        overlay={renderTooltip("Duración total de la prueba en segundos")}
                                    >
                                        <FaInfoCircle className="text-muted" style={{ cursor: 'help', fontSize: '0.875rem' }} />
                                    </OverlayTrigger>
                                </Form.Label>
                                <Form.Control
                                    size="sm"
                                    type="number"
                                    min="1"
                                    value={duration || ''}
                                    onChange={(e) => onChange('duration', Number(e.target.value || 0))}
                                    placeholder="300"
                                />
                                <Form.Text muted className="small">
                                    Tiempo total de ejecución de la prueba.
                                </Form.Text>
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>Startup Delay (segundos)</Form.Label>
                                <Form.Control
                                    size="sm"
                                    type="number"
                                    min="0"
                                    value={value.startupDelay || ''}
                                    onChange={(e) => onChange('startupDelay', Number(e.target.value || 0))}
                                    placeholder="0"
                                />
                                <Form.Text muted className="small">
                                    Retraso antes de iniciar la prueba.
                                </Form.Text>
                            </Form.Group>
                        </Col>
                    </Row>
                )}
            </Form>
        </div>
    );
};

export default ThreadsTab;
