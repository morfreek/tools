import React from 'react';
import { Row, Col, Form, Button } from 'react-bootstrap';

export default function ParametersForm({ params, onChange, onShowUrls, onGenerate, isGenerating, hasSelectedRoutes }) {
    const handleChange = (e) => {
        const { name, value } = e.target;
        onChange(name, value);
    };

    if (!hasSelectedRoutes) return null;

    return (
        <div className="mb-4">
            <Row className="g-3 mt-4">
                <Col md={2}>
                    <Form.Group>
                        <Form.Label className="small">Protocolo (http o https)</Form.Label>
                        <Form.Control 
                            size="sm" 
                            type="text" 
                            name="protocol" 
                            value={params.protocol} 
                            onChange={handleChange} 
                        />
                    </Form.Group>
                </Col>
                <Col md={4}>
                    <Form.Group>
                        <Form.Label className="small">Servidor (host)</Form.Label>
                        <Form.Control 
                            size="sm" 
                            type="text" 
                            name="server" 
                            value={params.server} 
                            onChange={handleChange} 
                        />
                    </Form.Group>
                </Col>
                <Col md={2}>
                    <Form.Group>
                        <Form.Label className="small">Puerto (opcional)</Form.Label>
                        <Form.Control 
                            size="sm" 
                            type="text" 
                            name="port" 
                            value={params.port} 
                            onChange={handleChange} 
                        />
                    </Form.Group>
                </Col>
                <Col md={4}>
                    <Form.Group>
                        <Form.Label className="small">Prefijo para las rutas (opcional)</Form.Label>
                        <Form.Control 
                            size="sm" 
                            type="text" 
                            name="prefix" 
                            value={params.prefix} 
                            onChange={handleChange} 
                        />
                    </Form.Group>
                </Col>
            </Row>

            <Row className="g-3 mt-2">
                <Col md={3}>
                    <Form.Group>
                        <Form.Label className="small">Hilos (usuarios concurrentes)</Form.Label>
                        <Form.Control 
                            size="sm" 
                            type="number" 
                            name="threads" 
                            value={params.threads} 
                            onChange={handleChange} 
                        />
                    </Form.Group>
                </Col>
                <Col md={3}>
                    <Form.Group>
                        <Form.Label className="small">Tiempo de incremento (s)</Form.Label>
                        <Form.Control 
                            size="sm" 
                            type="number" 
                            name="rampUp" 
                            value={params.rampUp} 
                            onChange={handleChange} 
                        />
                    </Form.Group>
                </Col>
                <Col md={3}>
                    <Form.Group>
                        <Form.Label className="small">Duración total del test (s)</Form.Label>
                        <Form.Control 
                            size="sm" 
                            type="number" 
                            name="duration" 
                            value={params.duration} 
                            onChange={handleChange} 
                        />
                    </Form.Group>
                </Col>
                <Col md={3}>
                    <Form.Group>
                        <Form.Label className="small">Throughput (requests/minute)</Form.Label>
                        <Form.Control 
                            size="sm" 
                            type="number" 
                            name="throughput" 
                            value={params.throughput} 
                            onChange={handleChange} 
                        />
                    </Form.Group>
                </Col>
            </Row>
            <div className="d-flex gap-2 mt-4">
                <Button size="sm" variant="primary" onClick={onShowUrls}>
                    Ver URLs a Testear
                </Button>
                <Button size="sm" variant="success" onClick={onGenerate} disabled={isGenerating}>
                    {isGenerating ? 'Generando...' : 'Generar archivo JMeter (.jmx)'}
                </Button>
            </div>
        </div>
    );
}
