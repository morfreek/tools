import React from 'react';
import { Modal, Accordion, Row, Col, Card } from 'react-bootstrap';
import { FaStickyNote } from 'react-icons/fa';
import StatusBadge from '@c/StatusBadge';
import CancelButton from '@c/ui/CancelButton';

export default function ProjectReviewDetailModal({ visible, checklist, review, onClose }) {
    if (!visible) return null;
    
    return (
        <Modal show={visible} onHide={onClose} size="xl" scrollable fullscreen="xl-down">
            <Modal.Header closeButton>
                <Modal.Title>Detalle de Revisión - {review.applied_at}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {review.note && (
                    <Card className="mb-3">
                        <Card.Header className="d-flex align-items-center">
                            <FaStickyNote className="me-2 text-primary" />
                            <strong>Notas Generales</strong>
                        </Card.Header>
                        <Card.Body>
                            <div
                                dangerouslySetInnerHTML={{
                                    __html: review.note
                                }}
                            />
                        </Card.Body>
                    </Card>
                )}
                <Accordion defaultActiveKey="0" alwaysOpen>
                    {checklist.map((aspect, index) => (
                        <Accordion.Item key={aspect.id} eventKey={index.toString()}>
                            <Accordion.Header>{aspect.name}</Accordion.Header>
                            <Accordion.Body>
                                {aspect.points.map(point => {
                                    const result = review.results.find(r => r.point_id === point.id);
                                    if (!result) return null;

                                    return (
                                        <Row 
                                            key={point.id} 
                                            className="border-bottom py-2 mb-2"
                                        >
                                            <Col xs={12} className="d-flex justify-content-between">
                                                <div className="fw-bold">{point.name}</div>
                                                <StatusBadge status={result.status} />
                                            </Col>
                                            {result.observation && (
                                                <Col xs={12}>
                                                    <div>
                                                        <small className="text-muted fw-bold d-block">
                                                            Observación
                                                        </small>
                                                        <div dangerouslySetInnerHTML={{ 
                                                            __html: result.observation 
                                                        }} />
                                                    </div>
                                                </Col>
                                            )}
                                        </Row>
                                    );
                                })}
                            </Accordion.Body>
                        </Accordion.Item>
                    ))}
                </Accordion>
            </Modal.Body>
            <Modal.Footer>
                <CancelButton onClick={onClose}>Cerrar</CancelButton>
            </Modal.Footer>
        </Modal>
    );
}
