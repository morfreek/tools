import React from 'react';
import { Form, Row, Col, Alert, OverlayTrigger, Tooltip, Card } from 'react-bootstrap';
import { FaInfoCircle, FaClock } from 'react-icons/fa';

const TimersTab = ({ value, onChange }) => {
    const renderTooltip = (content) => (
        <Tooltip id="tooltip">{content}</Tooltip>
    );

    const updateTimerConfig = (timerType, field, newValue) => {
        const currentTimers = value.timers || {};
        const updatedTimers = {
            ...currentTimers,
            [timerType]: {
                ...currentTimers[timerType],
                [field]: newValue
            }
        };
        onChange('timers', updatedTimers);
    };

    const getTimerConfig = (timerType) => {
        return value.timers?.[timerType] || {};
    };

    return (
        <div>
            <Alert variant="info" className="mb-4">
                <FaClock className="me-2" />
                <strong>Temporizadores</strong>
                <p className="mb-0 mt-1 small">
                    Los temporizadores añaden pausas entre peticiones para simular comportamiento real de usuarios y controlar la carga.
                    Puedes habilitar múltiples temporizadores simultáneamente.
                </p>
            </Alert>

            {/* Uniform Random Timer */}
            <Card className="mb-3">
                <Card.Header className="py-2">
                    <Form.Check
                        type="switch"
                        id="uniform-timer-enabled"
                        label="Uniform Random Timer"
                        checked={getTimerConfig('uniform').enabled || false}
                        onChange={(e) => updateTimerConfig('uniform', 'enabled', e.target.checked)}
                    />
                </Card.Header>
                {getTimerConfig('uniform').enabled && (
                    <Card.Body>
                        <Row className="g-3">
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="d-flex justify-content-between align-items-center">
                                        <span>Delay Base (ms)</span>
                                        <OverlayTrigger
                                            placement="top"
                                            overlay={renderTooltip("Tiempo base de pausa en milisegundos")}
                                        >
                                            <FaInfoCircle className="text-muted" style={{ cursor: 'help', fontSize: '0.875rem' }} />
                                        </OverlayTrigger>
                                    </Form.Label>
                                    <Form.Control
                                        size="sm"
                                        type="number"
                                        min="0"
                                        value={getTimerConfig('uniform').delay || 1000}
                                        onChange={(e) => updateTimerConfig('uniform', 'delay', Number(e.target.value || 0))}
                                        placeholder="1000"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="d-flex justify-content-between align-items-center">
                                        <span>Random Range (ms)</span>
                                        <OverlayTrigger
                                            placement="top"
                                            overlay={renderTooltip("Variación aleatoria adicional al delay base")}
                                        >
                                            <FaInfoCircle className="text-muted" style={{ cursor: 'help', fontSize: '0.875rem' }} />
                                        </OverlayTrigger>
                                    </Form.Label>
                                    <Form.Control
                                        size="sm"
                                        type="number"
                                        min="0"
                                        value={getTimerConfig('uniform').range || 500}
                                        onChange={(e) => updateTimerConfig('uniform', 'range', Number(e.target.value || 0))}
                                        placeholder="500"
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                        <div className="mt-2 p-2 bg-light rounded small">
                            <strong>Configuración:</strong> Entre {getTimerConfig('uniform').delay || 1000}ms y {(getTimerConfig('uniform').delay || 1000) + (getTimerConfig('uniform').range || 500)}ms
                        </div>
                    </Card.Body>
                )}
            </Card>

            {/* Constant Timer */}
            <Card className="mb-3">
                <Card.Header className="py-2">
                    <Form.Check
                        type="switch"
                        id="constant-timer-enabled"
                        label="Constant Timer"
                        checked={getTimerConfig('constant').enabled || false}
                        onChange={(e) => updateTimerConfig('constant', 'enabled', e.target.checked)}
                    />
                </Card.Header>
                {getTimerConfig('constant').enabled && (
                    <Card.Body>
                        <Row className="g-3">
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="d-flex justify-content-between align-items-center">
                                        <span>Delay (ms)</span>
                                        <OverlayTrigger
                                            placement="top"
                                            overlay={renderTooltip("Tiempo fijo de pausa en milisegundos")}
                                        >
                                            <FaInfoCircle className="text-muted" style={{ cursor: 'help', fontSize: '0.875rem' }} />
                                        </OverlayTrigger>
                                    </Form.Label>
                                    <Form.Control
                                        size="sm"
                                        type="number"
                                        min="0"
                                        value={getTimerConfig('constant').delay || 1000}
                                        onChange={(e) => updateTimerConfig('constant', 'delay', Number(e.target.value || 0))}
                                        placeholder="1000"
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                        <div className="mt-2 p-2 bg-light rounded small">
                            <strong>Configuración:</strong> {getTimerConfig('constant').delay || 1000}ms fijo
                        </div>
                    </Card.Body>
                )}
            </Card>

            {/* Gaussian Random Timer */}
            <Card className="mb-3">
                <Card.Header className="py-2">
                    <Form.Check
                        type="switch"
                        id="gaussian-timer-enabled"
                        label="Gaussian Random Timer"
                        checked={getTimerConfig('gaussian').enabled || false}
                        onChange={(e) => updateTimerConfig('gaussian', 'enabled', e.target.checked)}
                    />
                </Card.Header>
                {getTimerConfig('gaussian').enabled && (
                    <Card.Body>
                        <Row className="g-3">
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="d-flex justify-content-between align-items-center">
                                        <span>Delay Base (ms)</span>
                                        <OverlayTrigger
                                            placement="top"
                                            overlay={renderTooltip("Tiempo base de pausa en milisegundos")}
                                        >
                                            <FaInfoCircle className="text-muted" style={{ cursor: 'help', fontSize: '0.875rem' }} />
                                        </OverlayTrigger>
                                    </Form.Label>
                                    <Form.Control
                                        size="sm"
                                        type="number"
                                        min="0"
                                        value={getTimerConfig('gaussian').delay || 1000}
                                        onChange={(e) => updateTimerConfig('gaussian', 'delay', Number(e.target.value || 0))}
                                        placeholder="1000"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="d-flex justify-content-between align-items-center">
                                        <span>Deviation (ms)</span>
                                        <OverlayTrigger
                                            placement="top"
                                            overlay={renderTooltip("Desviación estándar para la distribución gaussiana")}
                                        >
                                            <FaInfoCircle className="text-muted" style={{ cursor: 'help', fontSize: '0.875rem' }} />
                                        </OverlayTrigger>
                                    </Form.Label>
                                    <Form.Control
                                        size="sm"
                                        type="number"
                                        min="0"
                                        value={getTimerConfig('gaussian').deviation || 500}
                                        onChange={(e) => updateTimerConfig('gaussian', 'deviation', Number(e.target.value || 0))}
                                        placeholder="500"
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                        <div className="mt-2 p-2 bg-light rounded small">
                            <strong>Configuración:</strong> Distribución gaussiana con media {getTimerConfig('gaussian').delay || 1000}ms y desviación {getTimerConfig('gaussian').deviation || 500}ms
                        </div>
                    </Card.Body>
                )}
            </Card>

            {/* Constant Throughput Timer */}
            <Card className="mb-3">
                <Card.Header className="py-2">
                    <Form.Check
                        type="switch"
                        id="throughput-timer-enabled"
                        label="Constant Throughput Timer"
                        checked={getTimerConfig('constantThroughput').enabled || false}
                        onChange={(e) => updateTimerConfig('constantThroughput', 'enabled', e.target.checked)}
                    />
                </Card.Header>
                {getTimerConfig('constantThroughput').enabled && (
                    <Card.Body>
                        <Row className="g-3">
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="d-flex justify-content-between align-items-center">
                                        <span>Target Throughput (per minute)</span>
                                        <OverlayTrigger
                                            placement="top"
                                            overlay={renderTooltip("Número objetivo de peticiones por minuto")}
                                        >
                                            <FaInfoCircle className="text-muted" style={{ cursor: 'help', fontSize: '0.875rem' }} />
                                        </OverlayTrigger>
                                    </Form.Label>
                                    <Form.Control
                                        size="sm"
                                        type="number"
                                        min="1"
                                        value={getTimerConfig('constantThroughput').target || 1000}
                                        onChange={(e) => updateTimerConfig('constantThroughput', 'target', Number(e.target.value || 1000))}
                                        placeholder="1000"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="d-flex justify-content-between align-items-center">
                                        <span>Calculate Based On</span>
                                        <OverlayTrigger
                                            placement="top"
                                            overlay={renderTooltip("Ámbito de cálculo del throughput")}
                                        >
                                            <FaInfoCircle className="text-muted" style={{ cursor: 'help', fontSize: '0.875rem' }} />
                                        </OverlayTrigger>
                                    </Form.Label>
                                    <Form.Select
                                        size="sm"
                                        value={getTimerConfig('constantThroughput').calculation || 'this thread only'}
                                        onChange={(e) => updateTimerConfig('constantThroughput', 'calculation', e.target.value)}
                                    >
                                        <option value="this thread only">This thread only</option>
                                        <option value="all active threads">All active threads</option>
                                        <option value="all active threads (shared)">All active threads (shared)</option>
                                        <option value="all active threads in current thread group">All active threads in current thread group</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>
                        <div className="mt-2 p-2 bg-light rounded small">
                            <strong>Configuración:</strong> {getTimerConfig('constantThroughput').target || 1000} peticiones/minuto ({getTimerConfig('constantThroughput').calculation || 'this thread only'})
                        </div>
                    </Card.Body>
                )}
            </Card>

            {/* Poisson Random Timer */}
            <Card className="mb-3">
                <Card.Header className="py-2">
                    <Form.Check
                        type="switch"
                        id="poisson-timer-enabled"
                        label="Poisson Random Timer"
                        checked={getTimerConfig('poisson').enabled || false}
                        onChange={(e) => updateTimerConfig('poisson', 'enabled', e.target.checked)}
                    />
                </Card.Header>
                {getTimerConfig('poisson').enabled && (
                    <Card.Body>
                        <Row className="g-3">
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="d-flex justify-content-between align-items-center">
                                        <span>Delay Base (ms)</span>
                                        <OverlayTrigger
                                            placement="top"
                                            overlay={renderTooltip("Tiempo base de pausa en milisegundos")}
                                        >
                                            <FaInfoCircle className="text-muted" style={{ cursor: 'help', fontSize: '0.875rem' }} />
                                        </OverlayTrigger>
                                    </Form.Label>
                                    <Form.Control
                                        size="sm"
                                        type="number"
                                        min="0"
                                        value={getTimerConfig('poisson').delay || 1000}
                                        onChange={(e) => updateTimerConfig('poisson', 'delay', Number(e.target.value || 0))}
                                        placeholder="1000"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="d-flex justify-content-between align-items-center">
                                        <span>Lambda (ms)</span>
                                        <OverlayTrigger
                                            placement="top"
                                            overlay={renderTooltip("Parámetro lambda para la distribución de Poisson")}
                                        >
                                            <FaInfoCircle className="text-muted" style={{ cursor: 'help', fontSize: '0.875rem' }} />
                                        </OverlayTrigger>
                                    </Form.Label>
                                    <Form.Control
                                        size="sm"
                                        type="number"
                                        min="0"
                                        value={getTimerConfig('poisson').lambda || 500}
                                        onChange={(e) => updateTimerConfig('poisson', 'lambda', Number(e.target.value || 0))}
                                        placeholder="500"
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                        <div className="mt-2 p-2 bg-light rounded small">
                            <strong>Configuración:</strong> Distribución de Poisson con delay base {getTimerConfig('poisson').delay || 1000}ms y lambda {getTimerConfig('poisson').lambda || 500}ms
                        </div>
                    </Card.Body>
                )}
            </Card>
        </div>
    );
};

export default TimersTab;
