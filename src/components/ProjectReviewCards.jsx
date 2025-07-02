import { Row, Col, Card, Badge, Button } from 'react-bootstrap';
import { FaEye } from 'react-icons/fa';
import StatusBadge from './StatusBadge';

const getStatusMetrics = (results) => {
    const counts = {};
    results.forEach(r => {
        counts[r.status] = (counts[r.status] || 0) + 1;
    });
    return counts;
};

const statusColors = {
    bien: 'success',
    regular: 'warning',
    incompleto: 'danger',
    noaplica: 'info',
};

export default function ReviewCards({ reviews, startReview }) {
    return (
        <Row>
            {reviews.map(review => {
                const metrics = getStatusMetrics(review.results);
                const total = review.results.length;
                return (
                    <Col key={review.id} md={4} className="mb-4">
                        <Card className="h-100 shadow-sm">
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
