import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Badge, Card, Placeholder } from 'react-bootstrap';
import ProjectPageLayout from '@c/layout/ProjectPageLayout';
import StatusBadge from '@c/StatusBadge';
import { listReviews } from '@/services/reviews.service';
import { EVALUATED, countStatuses, reviewCadence, sortReviews } from '@u/reviewTracking';
import { sanitizeHtml, hasText } from '@u/html';

const formatDate = (date) => new Date(`${date}T00:00:00`).toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' });
const days = (n) => (n === 0 ? 'hoy' : n === 1 ? 'hace 1 día' : `hace ${n} días`);

const cadenceText = (total, cadence) => {
    const parts = [`${total} ${total === 1 ? 'revisión' : 'revisiones'}`, `última ${days(cadence.daysSinceLast)}`];
    if (cadence.averageDays !== null) parts.push(`una cada ${cadence.averageDays} días en promedio`);
    return parts.join(' · ');
};

const ChecklistSummary = ({ review }) => {
    const counts = countStatuses(review);
    if (counts.evaluados === 0) return <Badge bg="secondary">Sin checklist</Badge>;
    return EVALUATED.filter((s) => counts[s] > 0).map((s) => <StatusBadge key={s} status={s} text={`: ${counts[s]}`} />);
};

// Pestaña "Seguimiento": bitácora de las observaciones generales de cada revisión,
// de la más reciente a la más antigua. El checklist es opcional y solo se resume.
export default function ProjectDetail() {
    const { id } = useParams();
    const [reviews, setReviews] = useState(null);
    const [error, setError] = useState(false);

    useEffect(() => {
        setReviews(null);
        setError(false);
        listReviews(id).then(setReviews).catch(() => setError(true));
    }, [id]);

    const ordered = useMemo(() => sortReviews(reviews || []), [reviews]);
    const cadence = useMemo(() => reviewCadence(ordered), [ordered]);

    let body;
    if (error) {
        body = <div className="aviso aviso-rojo m-0" role="alert">No se pudieron cargar las revisiones del proyecto. Recarga la página para reintentar.</div>;
    } else if (!reviews) {
        body = <Placeholder animation="glow"><Placeholder xs={12} /><Placeholder xs={8} /></Placeholder>;
    } else if (!ordered.length) {
        body = (
            <div className="vacio">
                Aún no hay revisiones. <Link to={`/projects/${id}/review`}>Registra la primera en Revisiones</Link>.
            </div>
        );
    } else {
        body = (
            <ol className="bitacora">
                {ordered.map((review) => (
                    <li key={review.id} className="bitacora-item">
                        <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
                            <strong>{formatDate(review.applied_at)}</strong>
                            <ChecklistSummary review={review} />
                        </div>
                        {hasText(review.note)
                            ? <div className="nota-contenido" dangerouslySetInnerHTML={{ __html: sanitizeHtml(review.note) }} />
                            : <p className="sub mb-0">Sin observación general.</p>}
                    </li>
                ))}
            </ol>
        );
    }

    return (
        <ProjectPageLayout>
            <Card>
                <Card.Header>
                    <h2 className="h6 fw-semibold mb-0">
                        Bitácora de revisiones{' '}
                        {cadence && <span className="sub fw-normal">{cadenceText(ordered.length, cadence)}</span>}
                    </h2>
                </Card.Header>
                <Card.Body>{body}</Card.Body>
            </Card>
        </ProjectPageLayout>
    );
}
