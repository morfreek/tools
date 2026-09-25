import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Card, Col, Placeholder, Row } from 'react-bootstrap';
import ProjectPageLayout from '@c/layout/ProjectPageLayout';
import StatusBadge from '@c/StatusBadge';
import ReviewTrendChart from '@c/review/ReviewTrendChart';
import { listReviews, getChecklist } from '@/services/reviews.service';
import { pendingPoints, lastChange, trendSeries, sortReviews } from '@u/reviewTracking';

const formatDate = (date) => new Date(`${date}T00:00:00`).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' });
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

const Panel = ({ title, sub, children }) => (
    <Card className="h-100">
        <Card.Header>
            <h2 className="h6 fw-semibold mb-0">{title} {sub && <span className="sub fw-normal">{sub}</span>}</h2>
        </Card.Header>
        <Card.Body>{children}</Card.Body>
    </Card>
);

const Pending = ({ groups }) => {
    const total = groups.reduce((n, g) => n + g.items.length, 0);
    if (total === 0) {
        return <div className="aviso aviso-ok m-0" role="status">Sin pendientes: todos los puntos evaluados están bien.</div>;
    }
    return groups.map((group) => (
        <section key={group.aspect} className="seguimiento-grupo">
            <h3 className="seguimiento-aspecto">{group.aspect}</h3>
            <ul className="seguimiento-lista">
                {group.items.map((item) => (
                    <li key={item.pointId}>
                        <div className="d-flex flex-wrap align-items-center gap-2">
                            <StatusBadge status={item.status} />
                            <span className="fw-semibold">{item.name}</span>
                            <span className="sub">
                                {item.streak > 1
                                    ? `pendiente en las últimas ${item.streak} revisiones, desde el ${formatDate(item.since)}`
                                    : 'nuevo en esta revisión'}
                            </span>
                        </div>
                        {item.observation && <p className="seguimiento-observacion">{item.observation}</p>}
                    </li>
                ))}
            </ul>
        </section>
    ));
};

const ChangeList = ({ title, items, empty }) => (
    <div>
        <h3 className="seguimiento-aspecto">{title} <span className="sub fw-normal">{items.length}</span></h3>
        {items.length === 0 ? <p className="sub mb-0">{empty}</p> : (
            <ul className="seguimiento-lista">
                {items.map((item) => (
                    <li key={item.pointId} className="d-flex flex-wrap align-items-center gap-1">
                        <span className="me-1">{item.name}</span>
                        <StatusBadge status={item.before} />
                        <span className="sub" aria-label="pasó a">→</span>
                        <StatusBadge status={item.now} />
                    </li>
                ))}
            </ul>
        )}
    </div>
);

// Pestaña "Seguimiento": qué tiene pendiente el proyecto y cómo evoluciona su calidad
export default function ProjectDetail() {
    const { id } = useParams();
    const [reviews, setReviews] = useState(null);
    const [checklist, setChecklist] = useState([]);
    const [error, setError] = useState(false);

    useEffect(() => {
        setReviews(null);
        setError(false);
        Promise.all([listReviews(id), getChecklist()])
            .then(([reviewData, checklistData]) => {
                setReviews(reviewData);
                setChecklist(checklistData);
            })
            .catch(() => setError(true));
    }, [id]);

    const data = useMemo(() => {
        if (!reviews?.length) return null;
        return {
            last: sortReviews(reviews)[0],
            pending: pendingPoints(reviews, checklist),
            change: lastChange(reviews, checklist),
            series: trendSeries(reviews),
        };
    }, [reviews, checklist]);

    let content;
    if (error) {
        content = <div className="aviso aviso-rojo m-0" role="alert">No se pudieron cargar las revisiones del proyecto. Recarga la página para reintentar.</div>;
    } else if (!reviews) {
        content = <Card><Card.Body><Placeholder animation="glow"><Placeholder xs={12} /><Placeholder xs={8} /></Placeholder></Card.Body></Card>;
    } else if (!data) {
        content = (
            <div className="vacio">
                El seguimiento se arma a partir de las revisiones técnicas y este proyecto aún no tiene ninguna.{' '}
                <Link to={`/projects/${id}/review`}>Crea la primera en Revisiones</Link>.
            </div>
        );
    } else {
        const pendingCount = data.pending.reduce((n, g) => n + g.items.length, 0);
        content = (
            <Row className="g-3">
                <Col xs={12}>
                    <Panel title="Pendientes de la última revisión" sub={`${plural(pendingCount, 'punto', 'puntos')} · ${formatDate(data.last.applied_at)}`}>
                        <Pending groups={data.pending} />
                    </Panel>
                </Col>
                <Col xs={12} xl={7}>
                    <Panel title="Evolución" sub={plural(reviews.length, 'revisión', 'revisiones')}>
                        <ReviewTrendChart series={data.series} total={reviews.length} />
                    </Panel>
                </Col>
                <Col xs={12} xl={5}>
                    <Panel
                        title="Último cambio registrado"
                        sub={data.change?.changed ? `${formatDate(data.change.previous.applied_at)} → ${formatDate(data.change.current.applied_at)}` : undefined}
                    >
                        {!data.change ? (
                            <p className="sub mb-0">Se necesitan al menos dos revisiones para comparar.</p>
                        ) : !data.change.changed ? (
                            <p className="sub mb-0">Ningún punto evaluado ha cambiado de estado en las {reviews.length} revisiones.</p>
                        ) : (
                            <div className="d-grid gap-3">
                                {data.change.unchangedSince > 0 && (
                                    <p className="sub mb-0">
                                        {data.change.unchangedSince === 1
                                            ? 'La revisión posterior no tuvo cambios.'
                                            : `Las ${data.change.unchangedSince} revisiones posteriores no tuvieron cambios.`}
                                    </p>
                                )}
                                <ChangeList title="Mejoraron" items={data.change.improved} empty="Ningún punto mejoró." />
                                <ChangeList title="Empeoraron" items={data.change.worsened} empty="Ningún punto empeoró." />
                            </div>
                        )}
                    </Panel>
                </Col>
            </Row>
        );
    }

    return <ProjectPageLayout>{content}</ProjectPageLayout>;
}
