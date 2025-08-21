import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaHome, FaExchangeAlt } from 'react-icons/fa';
import { Breadcrumb as BSBreadcrumb, Modal, ListGroup, Form } from 'react-bootstrap';
import { useBreadcrumb } from '@/hooks/useBreadcrumb';
import api from '@/api';

export default function Breadcrumb() {
    const items = useBreadcrumb();
    const [showProjectsModal, setShowProjectsModal] = useState(false);
    const [projects, setProjects] = useState([]);
    const [loadingProjects, setLoadingProjects] = useState(false);
    const [projectsError, setProjectsError] = useState(null);
    const [search, setSearch] = useState(''); // nuevo estado de búsqueda

    const location = useLocation();
    const navigate = useNavigate();

    // Detectar el proyecto actual desde el path: /projects/:id
    const match = location.pathname.match(/^\/projects\/([^/]+)/);
    const currentProjectId = match ? match[1] : null;

    // Helpers para mostrar nombres
    const getProjectName = (p) => p?.name || p?.title || p?.id;

    // Normalizador que elimina acentos y pasa a minúsculas
    const normalizeString = (str) =>
        (str ?? '')
            .toString()
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');

    // Proyectos visibles (excluye actual y filtra por búsqueda: nombre, código o desarrolladores)
    const visibleProjects = projects
        .filter(p => !currentProjectId || String(p.id) !== String(currentProjectId))
        .filter(p => {
            if (!search) return true;
            const q = normalizeString(search);
            const name = normalizeString(getProjectName(p));
            const code = normalizeString(p?.code);
            const devs = Array.isArray(p?.developer_names) ? p.developer_names.map(normalizeString).join(' ') : '';
            return name.includes(q) || code.includes(q) || devs.includes(q);
        });

    // Cargar proyectos al abrir el modal
    useEffect(() => {
        if (!showProjectsModal) return;
        // Limpiar buscador al abrir el modal
        setSearch('');

        let ignore = false;
        (async () => {
            try {
                setLoadingProjects(true);
                setProjectsError(null);
                const { data } = await api.get('/projects'); // Espera un array de proyectos
                if (!ignore) setProjects(Array.isArray(data) ? data : []);
            } catch (e) {
                if (!ignore) setProjectsError(e?.message || 'Error');
            } finally {
                if (!ignore) setLoadingProjects(false);
            }
        })();
        return () => { ignore = true; };
    }, [showProjectsModal]);

    const handleOpenProjects = (e) => {
        // Evitar que el breadcrumb navegue
        e.preventDefault();
        e.stopPropagation();
        setShowProjectsModal(true);
    };

    const handleSelectProject = (proj) => {
        setShowProjectsModal(false);
        navigate(`/projects/${proj.id}/detail`);
    };

    return (
        <div className="d-flex align-items-center">
            <BSBreadcrumb>
                <BSBreadcrumb.Item linkAs={Link} linkProps={{ to: "/" }}>
                    <FaHome />
                </BSBreadcrumb.Item>
                {items.map((item, index) => (
                    <BSBreadcrumb.Item
                        key={index}
                        active={item.isLast}
                        linkAs={item.path ? Link : undefined}
                        linkProps={item.path ? { to: item.path } : undefined}
                    >
                        {typeof item.label === 'string' ? (
                            <span className="d-inline-flex align-items-center">
                                {item.label}
                                {item.path === '/projects' && (
                                    <FaExchangeAlt
                                        className="ms-2 cursor-pointer"
                                        onClick={handleOpenProjects}
                                        title="Ver proyectos"
                                        role="button"
                                        aria-label="Abrir listado de proyectos"
                                    />
                                )}
                            </span>
                        ) : item.label}
                    </BSBreadcrumb.Item>
                ))}
            </BSBreadcrumb>
            <>
                <Modal show={showProjectsModal} onHide={() => setShowProjectsModal(false)} centered size="lg" scrollable>
                    <Modal.Header closeButton>
                        <Modal.Title>Proyectos</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        {projectsError && <div className="text-danger small">{projectsError}</div>}
                        {!loadingProjects && (
                            <Form.Control
                                type="search"
                                size="sm"
                                className="mb-3"
                                placeholder="Buscar por nombre, código o desarrollador"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        )}
                        {loadingProjects ? (
                            <div className="text-center py-3">Cargando...</div>
                        ) : (
                            // Contenedor scrollable para el listado
                            <div style={{ maxHeight: 'calc(100vh - 280px)', overflowY: 'auto' }}>
                                <ListGroup>
                                    {visibleProjects.map(p => {
                                        const devs = Array.isArray(p?.developer_names) ? p.developer_names.filter(Boolean) : [];
                                        const coord = null;
                                        return (
                                            <ListGroup.Item
                                                key={p.id}
                                                action
                                                onClick={() => handleSelectProject(p)}
                                            >
                                                {/* Código y nombre en la misma fila */}
                                                <div className="d-flex align-items-center gap-2">
                                                    {p.code && <span className="fw-bold text-primary">{p.code}</span>}
                                                    <span className="fw-semibold">{getProjectName(p)}</span>
                                                </div>
                                                <div className="text-muted small">
                                                    Desarrolladores: {devs.length ? devs.join(', ') : 'N/D'}
                                                    {coord && <> • Coordinador: {coord}</>}
                                                </div>
                                            </ListGroup.Item>
                                        );
                                    })}
                                    {visibleProjects.length === 0 && (
                                        <div className="text-muted small">
                                            {search ? 'No hay resultados para la búsqueda.' : 'No hay otros proyectos.'}
                                        </div>
                                    )}
                                </ListGroup>
                            </div>
                        )}
                    </Modal.Body>
                </Modal>
            </>
        </div>
    );
}
