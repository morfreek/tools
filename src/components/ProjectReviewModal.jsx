import React from 'react';
import { Modal, Button, Form, Accordion, Row, Col } from 'react-bootstrap';
import { FaSave, FaBan } from 'react-icons/fa';
import { STATUS_OPTIONS } from '@/utils/Constants';

export default function ProjectReviewModal({ visible, checklist, form, setForm, onClose, onSave }) {
    const updateResult = (point_id, field, value) => {
        setForm(prev => ({
            ...prev,
            results: prev.results.map(r =>
                r.point_id === point_id ? { ...r, [field]: value } : r
            )
        }));
    };

    return (
        <Modal show={visible} onHide={onClose} size="lg" scrollable>
            <Modal.Header closeButton>
                <Modal.Title>Nueva Revisión Técnica</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form>
                    <Form.Group className="mb-3">
                        <Form.Label>Fecha:</Form.Label>
                        <Form.Control
                            type="date"
                            value={form.applied_at}
                            onChange={e => setForm({ ...form, applied_at: e.target.value })}
                        />
                    </Form.Group>

                    <Accordion defaultActiveKey="0" className="mb-3">
                        {checklist.map((aspect, index) => (
                            <Accordion.Item key={aspect.id} eventKey={index.toString()}>
                                <Accordion.Header>{aspect.name}</Accordion.Header>
                                <Accordion.Body>
                                    {aspect.points.map(point => {
                                        const result = form.results.find(r => r.point_id === point.id) || { status: '', observation: '' };
                                        return (
                                            <Form.Group key={point.id} className="mb-4 border-bottom pb-2">
                                                <Form.Label className="fw-bold">{point.name}</Form.Label>
                                                <Row className="mb-2">
                                                    <Col md={4}>
                                                        <Form.Select
                                                            value={result.status}
                                                            onChange={(e) => updateResult(point.id, 'status', e.target.value)}
                                                        >
                                                            <option value="">Seleccione estado</option>
                                                            {STATUS_OPTIONS.map((status) => (
                                                                <option key={status} value={status}>
                                                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                                                </option>
                                                            ))}
                                                        </Form.Select>
                                                    </Col>
                                                    <Col md={8}>
                                                        <Form.Control
                                                            as="textarea"
                                                            rows={2}
                                                            placeholder="Observación"
                                                            value={result.observation}
                                                            onChange={(e) => updateResult(point.id, 'observation', e.target.value)}
                                                        />
                                                    </Col>
                                                </Row>
                                            </Form.Group>
                                        );
                                    })}
                                </Accordion.Body>
                            </Accordion.Item>
                        ))}
                    </Accordion>
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button 
                    variant="success" 
                    size="sm" 
                    className="d-inline-flex align-items-center"
                    onClick={onSave}
                >
                    <FaSave className="me-2" />
                    Guardar Revisión
                </Button>
                <Button 
                    variant="danger" 
                    size="sm" 
                    className="d-inline-flex align-items-center"
                    onClick={onClose}
                >
                    <FaBan className="me-2" />
                    Cancelar
                </Button>
            </Modal.Footer>
        </Modal>
    );
}
