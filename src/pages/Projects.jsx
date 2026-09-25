import React, { useState } from 'react';
import { FaPlus } from 'react-icons/fa';
import { Button, ButtonGroup, Card, Form } from 'react-bootstrap';
import UserModal from '@c/user/UserModal';
import ProjectModal from '@c/modal/ProjectModal';
import ProjectsTable from '@c/project/ProjectsTable';
import { useDialog } from '@c/DialogProvider';
import { useToast } from '@c/ToastContext';
import { useProjects } from '@hk/useProjects';
import { saveUser } from '@/services/users.service';
import { terminateProject } from '@/services/projects.service';

export default function Projects() {
    const { showToast } = useToast();
    const dialog = useDialog();
    const {
        users, loading, getUserName,
        status, setStatus, search, setSearch, sort, toggleSort,
        page, setPage, totalPages, total, pageItems,
        reloadProjects, reloadUsers,
    } = useProjects({ onError: (message) => showToast('error', message) });

    const [projectModalVisible, setProjectModalVisible] = useState(false);
    const [userModalVisible, setUserModalVisible] = useState(false);
    const [userData, setUserData] = useState({});

    const openUserModal = () => {
        setUserData({});
        setUserModalVisible(true);
    };

    const handleUserSubmit = async () => {
        try {
            await saveUser(userData);
            showToast('success', userData.id ? 'Usuario actualizado' : 'Usuario creado');
            reloadUsers();
            setUserModalVisible(false);
        } catch {
            showToast('error', 'Error guardando usuario');
        }
    };

    const handleTerminateProject = async (project) => {
        const ok = await dialog.confirm({
            title: 'Finalizar proyecto',
            message: `¿Finalizar el proyecto "${project.name}"? Quedará en solo lectura y esta acción no se puede deshacer.`,
            acceptText: 'Finalizar',
            danger: true,
        });
        if (!ok) return;

        try {
            await terminateProject(project.id);
            showToast('success', 'Proyecto finalizado correctamente');
            reloadProjects();
        } catch (err) {
            showToast('error', err.response?.data?.error || 'Error finalizando proyecto');
        }
    };

    return (
        <>
            <div className="titulo-seccion">
                <h2>
                    Proyectos de software{' '}
                    <span className="sub">{total} {status === 'finished' ? 'finalizados' : 'activos'}</span>
                </h2>
                <div className="d-flex gap-2">
                    <Button variant="outline-secondary" size="sm" className="d-inline-flex align-items-center" onClick={openUserModal}>
                        <FaPlus className="me-2" />Usuario
                    </Button>
                    <Button size="sm" className="d-inline-flex align-items-center" onClick={() => setProjectModalVisible(true)}>
                        <FaPlus className="me-2" />Proyecto
                    </Button>
                </div>
            </div>

            <Card className="mb-3">
                <Card.Body className="d-flex flex-wrap align-items-center gap-3">
                    <Form.Control
                        type="search"
                        className="flex-grow-1 w-auto"
                        placeholder="Buscar por nombre, código o integrante"
                        aria-label="Buscar proyectos"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <Form.Check
                        type="switch"
                        id="finished-projects-switch"
                        label="Mostrar finalizados"
                        checked={status === 'finished'}
                        onChange={(e) => setStatus(e.target.checked ? 'finished' : 'active')}
                    />
                </Card.Body>
            </Card>

            <ProjectsTable
                projects={pageItems}
                loading={loading}
                sort={sort}
                onSort={toggleSort}
                getUserName={getUserName}
                onTerminate={handleTerminateProject}
            />

            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mt-3">
                <span className="sub">Página {page} de {totalPages}</span>
                <ButtonGroup>
                    <Button variant="outline-secondary" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>
                        Anterior
                    </Button>
                    <Button variant="outline-secondary" size="sm" disabled={page === totalPages} onClick={() => setPage(page + 1)}>
                        Siguiente
                    </Button>
                </ButtonGroup>
            </div>

            <ProjectModal
                show={projectModalVisible}
                onClose={() => setProjectModalVisible(false)}
                onSaved={reloadProjects}
                users={users}
            />

            <UserModal
                show={userModalVisible}
                onClose={() => setUserModalVisible(false)}
                onSubmit={handleUserSubmit}
                userData={userData}
                setUserData={setUserData}
                editing={Boolean(userData.id)}
            />
        </>
    );
}
