import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge, Button, Card, Col, Placeholder, Row } from 'react-bootstrap';
import { FaHistory, FaProjectDiagram } from 'react-icons/fa';
import { useSession } from '@c/SessionContext';
import { listProjects } from '@/services/projects.service';
import { HERRAMIENTAS } from '@/config/tools';
import { FRESHNESS, FRESHNESS_DAYS, reviewFreshness, sortByFreshness } from '@u/reviewTracking';
import { readRecent } from '@u/recent';

const formatDate = (date) => new Date(`${date}T00:00:00`).toLocaleDateString('es-CL', {
    day: '2-digit', month: 'short', year: 'numeric',
});

const haceDias = (days) => (days === 0 ? 'hoy' : days === 1 ? 'hace 1 día' : `hace ${days} días`);

// Panel de trabajo: proyectos activos ordenados por urgencia de revisión
function PanelRevisiones() {
    const [projects, setProjects] = useState(null);
    const [error, setError] = useState(false);

    useEffect(() => {
        listProjects('active').then(setProjects).catch(() => setError(true));
    }, []);

    const rows = useMemo(() => sortByFreshness(projects || []).map((p) => ({
        ...p, ...reviewFreshness(p.last_review_at),
    })), [projects]);

    const alDia = rows.filter((r) => r.estado === 'al-dia').length;
    const cifras = [
        { valor: rows.length, texto: 'proyectos activos' },
        { valor: alDia, texto: `revisados en ${FRESHNESS_DAYS.alDia} días`, clase: 'ok' },
        { valor: rows.length - alDia, texto: 'por revisar', clase: rows.length - alDia ? 'ambar' : '' },
    ];

    return (
        <>
            {projects && (
                <div className="cifras mb-3">
                    {cifras.map(({ valor, texto, clase }) => (
                        <div key={texto} className={`panel cifra ${clase || ''}`}>
                            <strong>{valor}</strong>
                            <span className="sub">{texto}</span>
                        </div>
                    ))}
                </div>
            )}

            <Card>
                <Card.Header>
                    <h2 className="h6 fw-semibold mb-0">
                        Proyectos por revisar{' '}
                        <span className="sub fw-normal">
                            al día hasta {FRESHNESS_DAYS.alDia} días · atrasado sobre {FRESHNESS_DAYS.atencion}
                        </span>
                    </h2>
                </Card.Header>
                {error ? (
                    <Card.Body><div className="aviso aviso-rojo mb-0">No se pudieron cargar los proyectos. Revisa que la API esté disponible.</div></Card.Body>
                ) : !projects ? (
                    <Card.Body>
                        <Placeholder animation="glow"><Placeholder xs={12} /><Placeholder xs={10} /><Placeholder xs={11} /></Placeholder>
                    </Card.Body>
                ) : rows.length === 0 ? (
                    <Card.Body><div className="vacio">No hay proyectos activos.</div></Card.Body>
                ) : (
                    <div className="table-responsive">
                        <table className="tabla">
                            <thead>
                                <tr>
                                    <th>Proyecto</th>
                                    <th>Última revisión</th>
                                    <th>Estado</th>
                                    <th className="text-end"><span className="visually-hidden">Acciones</span></th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((p) => (
                                    <tr key={p.id}>
                                        <td>
                                            <Link to={`/projects/${p.id}/detail`} className="enlace">{p.name}</Link>
                                            <code className="sub ms-2">{p.code}</code>
                                        </td>
                                        <td className="text-nowrap">
                                            {p.last_review_at
                                                ? <>{formatDate(p.last_review_at)} <span className="sub">· {haceDias(p.days)}</span></>
                                                : <span className="sub">Nunca</span>}
                                        </td>
                                        <td><Badge bg={FRESHNESS[p.estado].bg}>{FRESHNESS[p.estado].label}</Badge></td>
                                        <td className="text-end">
                                            <Button
                                                as={Link}
                                                to={`/projects/${p.id}/review?nueva=1`}
                                                variant="outline-secondary"
                                                size="sm"
                                                className="text-nowrap"
                                            >
                                                Nueva revisión
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>
        </>
    );
}

export default function Home() {
    const { authenticated } = useSession();
    // Sin sesión no se muestran nombres de proyectos, ni siquiera los recientes
    const recientes = useMemo(
        () => readRecent().filter((r) => authenticated || r.type !== 'proyecto'),
        [authenticated]
    );

    return (
        <>
            <div className="titulo-seccion">
                <h2>Inicio <span className="sub">Herramientas de administración de la UDS</span></h2>
            </div>
            <Row className="g-3">
                <Col lg={8}>
                    {authenticated ? <PanelRevisiones /> : (
                        <div className="panel">
                            <h2>Estado de los proyectos</h2>
                            <p className="sub">Ingresa para ver qué proyectos necesitan una revisión técnica.</p>
                            <Button as={Link} to="/projects" size="sm">Ingresar</Button>
                        </div>
                    )}
                </Col>
                <Col lg={4} className="d-flex flex-column gap-3">
                    <Card>
                        <Card.Header><h2 className="h6 fw-semibold mb-0">Recientes</h2></Card.Header>
                        {recientes.length === 0 ? (
                            <Card.Body><p className="sub mb-0">Los proyectos y herramientas que abras aparecerán aquí.</p></Card.Body>
                        ) : (
                            <nav className="accesos" aria-label="Recientes">
                                {recientes.map(({ key, to, label, detail, type }) => {
                                    const Icon = type === 'proyecto'
                                        ? FaProjectDiagram
                                        : HERRAMIENTAS.find((h) => h.to === to)?.icon ?? FaHistory;
                                    return (
                                        <Link key={key} to={to} className="acceso">
                                            <Icon className="icono" aria-hidden="true" />
                                            <span className="min-w-0">
                                                <span className="acceso-titulo">{label}</span>
                                                {detail && <span className="sub">{detail}</span>}
                                            </span>
                                        </Link>
                                    );
                                })}
                            </nav>
                        )}
                    </Card>
                    <Card>
                        <Card.Header><h2 className="h6 fw-semibold mb-0">Herramientas</h2></Card.Header>
                        <nav className="accesos" aria-label="Herramientas">
                            {HERRAMIENTAS.map(({ to, icon: Icon, title, description }) => (
                                <Link key={to} to={to} className="acceso">
                                    <Icon className="icono" aria-hidden="true" />
                                    <span className="min-w-0">
                                        <span className="acceso-titulo">{title}</span>
                                        <span className="sub">{description}</span>
                                    </span>
                                </Link>
                            ))}
                        </nav>
                    </Card>
                </Col>
            </Row>
        </>
    );
}
