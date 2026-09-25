import React, { useCallback, useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Badge, Button, Nav, Placeholder } from 'react-bootstrap';
import { FaEdit } from 'react-icons/fa';
import { useToast } from '@c/ToastContext';
import ProjectModal from '@c/modal/ProjectModal';
import ProjectSwitcher from '@c/project/ProjectSwitcher';
import { getProject } from '@/services/projects.service';
import { listUsers } from '@/services/users.service';

// Secciones de /projects/:id/<path>; el orden es el de las pestañas
export const PROJECT_SECTIONS = [
    { path: 'detail', label: 'Resumen' },
    { path: 'review', label: 'Revisiones' },
    { path: 'notes', label: 'Notas' },
    { path: 'files', label: 'Archivos' },
    { path: 'continuous-deployment', label: 'Despliegue continuo' },
];

// Panel superior de las páginas de proyecto: migas con selector de proyecto,
// ficha resumida, editar proyecto y pestañas entre secciones. Las acciones de
// cada sección van en su propio panel, no aquí.
export default function ProjectHeader({ projectId }) {
    const { showToast } = useToast();
    const location = useLocation();
    const [project, setProject] = useState(null);
    const [users, setUsers] = useState([]);
    const [editing, setEditing] = useState(null);

    const section = PROJECT_SECTIONS.find((s) => location.pathname.endsWith(`/${s.path}`)) ?? PROJECT_SECTIONS[0];

    const load = useCallback(async () => {
        try {
            const [projectData, usersData] = await Promise.all([getProject(projectId), listUsers()]);
            setProject(projectData);
            setUsers(usersData);
        } catch {
            showToast('error', 'No se pudo cargar el proyecto');
        }
    }, [projectId, showToast]);

    useEffect(() => {
        setProject(null);
        load();
    }, [load]);

    const coordinator = users.find((u) => u.id === project?.coordinator_id)?.name;
    const team = (project?.developers || []).map((d) => d.name);
    const finished = Boolean(project?.termination_date);

    const openEdit = () => setEditing({
        id: project.id,
        name: project.name,
        code: project.code,
        coordinator_id: project.coordinator_id,
        developer_ids: (project.developers || []).map((d) => d.id),
    });

    return (
        <section className="panel proyecto-cabecera mb-3" aria-label="Proyecto">
            <nav aria-label="Migas de pan">
                <ol className="migas">
                    <li><Link to="/projects">Proyectos</Link></li>
                    <li aria-current="page">
                        {project
                            ? <ProjectSwitcher projectId={projectId} name={project.name} section={section.path} />
                            : <Placeholder xs={3} size="sm" animation="glow" />}
                    </li>
                </ol>
            </nav>

            <div className="d-flex flex-wrap align-items-start justify-content-between gap-2">
                <div className="min-w-0">
                    <h2 className="proyecto-titulo">
                        {project ? project.name : <Placeholder xs={6} animation="glow" />}
                        {project && <code className="sub ms-2">{project.code}</code>}
                        {finished && <Badge bg="secondary" className="ms-2">Finalizado</Badge>}
                    </h2>
                    {project && (
                        <p className="sub mb-0">
                            Coordinador: {coordinator || 'N/D'} · Equipo: {team.length ? team.join(', ') : 'sin desarrolladores'}
                        </p>
                    )}
                </div>
                <div className="d-flex align-items-center gap-2">
                    {project && !finished && (
                        <Button variant="link" size="sm" className="accion accion-editar" title="Editar proyecto" onClick={openEdit}>
                            <FaEdit />
                        </Button>
                    )}
                </div>
            </div>

            <Nav variant="underline" as="nav" className="pestanas-proyecto" aria-label="Secciones del proyecto">
                {PROJECT_SECTIONS.map(({ path, label }) => (
                    <Nav.Link key={path} as={NavLink} to={`/projects/${projectId}/${path}`}>{label}</Nav.Link>
                ))}
            </Nav>

            <ProjectModal
                show={Boolean(editing)}
                onClose={() => setEditing(null)}
                onSaved={load}
                formData={editing}
                users={users}
            />
        </section>
    );
}
