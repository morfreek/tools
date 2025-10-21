import { Row, Col, Card, Badge, Button, ButtonGroup } from 'react-bootstrap';
import { FaEye, FaTrash } from 'react-icons/fa';
import StatusBadge from '@c/StatusBadge';

const getStatusMetrics = (results) => {
    const counts = {};
    results.forEach(r => {
        counts[r.status] = (counts[r.status] || 0) + 1;
    });
    return counts;
};

export default function ReviewCards({ reviews, startReview, deleteReview }) {
    return (
        <Row>
            {reviews.map(review => {
                const metrics = getStatusMetrics(review.results);
                const total = review.results.length;
                return (
                    <Col key={review.id} md={4} className="mb-4">
                        <Card className="h-100 shadow-sm position-relative">
                            <Button
                                variant="link"
                                size="sm"
                                className="position-absolute p-1 text-danger"
                                style={{ 
                                    top: '8px', 
                                    right: '8px', 
                                    zIndex: 1,
                                    border: 'none',
                                    fontSize: '0.75rem',
                                    opacity: 0.7
                                }}
                                onClick={() => deleteReview(review.id)}
                                onMouseEnter={(e) => e.target.style.opacity = '1'}
                                onMouseLeave={(e) => e.target.style.opacity = '0.7'}
                            >
                                <FaTrash />
                            </Button>
                            <Card.Body>
                                <Card.Title>Revisión: {review.applied_at}</Card.Title>
                                <div className="mb-3">
                                    {Object.entries(metrics).map(([status, count]) => (
                                        <StatusBadge
                                            key={status}
                                            status={status}
                                            text={`: ${count} (${((count / total) * 100).toFixed(1)}%)`}
                                        />
                                    ))}
                                </div>
                                <Button
                                    variant="primary"
                                    size="sm"
                                    className="d-inline-flex align-items-center"
                                    onClick={() => startReview(review)}
                                >
                                    <FaEye className="me-2" />Ver Detalle
                                </Button>
                            </Card.Body>
                        </Card>
                    </Col>
                );
            })}
        </Row>
    );
}
