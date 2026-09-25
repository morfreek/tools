import { Badge, Card, Button } from 'react-bootstrap';
import { FaEye, FaTrash } from 'react-icons/fa';
import StatusBadge from '@c/StatusBadge';
import { EVALUATED, countStatuses } from '@u/reviewTracking';
import { htmlToText } from '@u/html';

// applied_at es una fecha sin hora (YYYY-MM-DD); se interpreta en hora local
const formatDate = (date) => new Date(`${date}T00:00:00`).toLocaleDateString('es-CL', {
    day: '2-digit', month: 'short', year: 'numeric',
});

export default function ReviewCards({ reviews, startReview, deleteReview }) {
    return (
        <div className="rejilla">
            {reviews.map(review => {
                const counts = countStatuses(review);
                const note = htmlToText(review.note);
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
                            <p className="resumen-nota sub mb-2">{note || 'Sin observación general.'}</p>
                            <div className="d-flex flex-wrap gap-1 mb-3">
                                {counts.evaluados > 0
                                    ? EVALUATED.filter((status) => counts[status] > 0).map((status) => (
                                        <StatusBadge key={status} status={status} text={`: ${counts[status]}`} />
                                    ))
                                    : <Badge bg="secondary">Sin checklist</Badge>}
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
