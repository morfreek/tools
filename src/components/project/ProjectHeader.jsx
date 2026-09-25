import React, { useCallback, useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Badge, Button, Nav, Placeholder } from 'react-bootstrap';
import { FaEdit, FaExchangeAlt } from 'react-icons/fa';
import { useToast } from '@c/ToastContext';
import ProjectModal from '@c/modal/ProjectModal';
import ProjectSwitcher from '@c/project/ProjectSwitcher';
import { getProject, transferProject } from '@/services/projects.service';
import { listAccountOptions } from '@/services/accounts.service';
import { useSession } from '@c/SessionContext';
import TransferModal from '@c/account/TransferModal';
import { listUsers } from '@/services/users.service';
import { recordVisit } from '@u/recent';

// Secciones de /projects/:id/<path>; el orden es el de las pestañas
export const PROJECT_SECTIONS = [
    { path: 'detail', label: 'Seguimiento' },
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
    const [transferAccounts, setTransferAccounts] = useState(null);
    const { account } = useSession();
    const navigate = useNavigate();

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

    // Accesos recientes del Inicio: el proyecto con la última sección visitada
    useEffect(() => {
        if (!project) return;
        recordVisit({
            key: `proyecto:${project.id}`,
            type: 'proyecto',
            to: `/projects/${project.id}/${section.path}`,
            label: project.name,
            detail: `${project.code} · ${section.label}`,
            account: account?.id,
        });
    }, [project, section.path, section.label, account?.id]);

    const openTransfer = async () => {
        try {
            const options = await listAccountOptions();
            setTransferAccounts(options.filter((a) => a.id !== account.id));
        } catch {
            showToast('error', 'No se pudieron cargar las cuentas');
        }
    };

    // Tras transferir, el proyecto deja de pertenecer a esta cuenta: se vuelve al listado
    const transfer = async (accountId) => {
        const { message } = await transferProject(project.id, accountId);
        showToast('success', message);
        navigate('/projects');
    };

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
                    {project && (
                        <Button variant="link" size="sm" className="accion" title="Transferir proyecto a otra cuenta" onClick={openTransfer}>
                            <FaExchangeAlt />
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
            <TransferModal
                show={Boolean(transferAccounts)}
                onClose={() => setTransferAccounts(null)}
                title="Transferir proyecto"
                description={project && `${project.name} pasará a la cuenta elegida, que será su única dueña, con sus revisiones, notas, archivos y configuraciones. Usted dejará de verlo.`}
                accounts={transferAccounts || []}
                acceptText="Transferir proyecto"
                onConfirm={transfer}
            />
        </section>
    );
}
