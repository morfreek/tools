import { Card, Button } from 'react-bootstrap';
import { FaEye, FaTrash } from 'react-icons/fa';
import StatusBadge from '@c/StatusBadge';

const getStatusMetrics = (results) => {
    const counts = {};
    results.forEach(r => {
        counts[r.status] = (counts[r.status] || 0) + 1;
    });
    return counts;
};

// applied_at es una fecha sin hora (YYYY-MM-DD); se interpreta en hora local
const formatDate = (date) => new Date(`${date}T00:00:00`).toLocaleDateString('es-CL', {
    day: '2-digit', month: 'short', year: 'numeric',
});

export default function ReviewCards({ reviews, startReview, deleteReview }) {
    return (
        <div className="rejilla">
            {reviews.map(review => {
                const metrics = getStatusMetrics(review.results);
                const total = review.results.length;
                return (
                    <Card key={review.id} className="h-100">
                        <Card.Body className="d-flex flex-column">
                            <div className="d-flex justify-content-between align-items-start mb-2">
                                <Card.Title as="h2" className="h6 fw-semibold mb-0">Revisión del {formatDate(review.applied_at)}</Card.Title>
                                <Button
                                    variant="link"
                                    size="sm"
                                    className="accion accion-eliminar"
                                    title="Eliminar revisión"
                                    onClick={() => deleteReview(review.id)}
                                >
                                    <FaTrash />
                                </Button>
                            </div>
                            <div className="d-flex flex-wrap gap-1 mb-3">
                                {Object.entries(metrics).map(([status, count]) => (
                                    <StatusBadge
                                        key={status}
                                        status={status}
                                        text={`: ${count} (${((count / total) * 100).toFixed(1)}%)`}
                                    />
                                ))}
                            </div>
                            <div className="mt-auto">
                                <Button
                                    variant="outline-secondary"
                                    size="sm"
                                    className="d-inline-flex align-items-center"
                                    onClick={() => startReview(review)}
                                >
                                    <FaEye className="me-2" />Ver detalle
                                </Button>
                            </div>
                        </Card.Body>
                    </Card>
                );
            })}
        </div>
    );
}
