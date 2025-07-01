import React from 'react';
import { Modal, Button, Card, Collapse } from 'react-bootstrap';
import { FaBan } from 'react-icons/fa';
import StatusBadge from './StatusBadge';

export default function ProjectReviewDetailModal({ visible, checklist, review, onClose }) {
    if (!visible) return null;
    return (
        <Modal show={visible} onHide={onClose} size="lg" scrollable>
            <Modal.Header closeButton>
                <Modal.Title>Detalle de Revisión - {review.applied_at}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {checklist.map(aspect => (
                    <Card key={aspect.id} className="mb-3">
                        <Card.Header>
                            {aspect.name}
                        </Card.Header>
                        <Collapse in={true}>
                            <div>
                                <Card.Body>
                                    {aspect.points.map(point => {
                                        const result = review.results.find(r => r.point_id === point.id);
                                        if (!result) return null;

                                        return (
                                            <div key={point.id} className="row align-items-start border-bottom py-2 mb-2">
                                                <div className="col-md-12 d-flex justify-content-between fw-bold">
                                                    {point.name}
                                                    <StatusBadge status={result.status} />
                                                </div>
                                                <div className="col-md-12">
                                                    {result.observation && (
                                                        <div>
                                                            <span className="text-muted small fw-bold">Observación</span>
                                                            <div dangerouslySetInnerHTML={{ __html: result.observation }} />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </Card.Body>
                            </div>
                        </Collapse>
                    </Card>
                ))}
            </Modal.Body>
            <Modal.Footer>
                <Button 
                    variant="danger" 
                    size="sm" 
                    className="d-inline-flex align-items-center"
                    onClick={onClose}
                >
                    <FaBan className="me-2" />
                    Cerrar
                </Button>
            </Modal.Footer>
        </Modal>
    );
}
