import React, { useState } from 'react';
import { FaPlus } from 'react-icons/fa';
import { Container, Row, Col, Button, Form, ButtonGroup } from 'react-bootstrap';
import UserModal from '@c/user/UserModal';
import ProjectModal from '@c/modal/ProjectModal';
import ProjectsTable from '@c/project/ProjectsTable';
import { useConfirm } from '@c/ConfirmContext';
import { useToast } from '@c/ToastContext';
import { useProjects } from '@hk/useProjects';
import { saveUser } from '@/services/users.service';
import { terminateProject } from '@/services/projects.service';

export default function Projects() {
    const { showToast } = useToast();
    const { showConfirm } = useConfirm();
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

    const confirm = (title, message) => new Promise((resolve) => {
        showConfirm({
            title,
            message,
            onConfirm: () => resolve(true),
            onClose: () => resolve(false),
            confirmText: 'Confirmar',
            cancelText: 'Cancelar',
        });
    });

    const handleTerminateProject = async (project) => {
        const confirmed = await confirm(
            'Finalizar Proyecto',
            `¿Está seguro que desea finalizar el proyecto "${project.name}"?\n\nEsta acción no se puede deshacer.`
        );
        if (!confirmed) return;

        try {
            await terminateProject(project.id);
            showToast('success', 'Proyecto finalizado correctamente');
            reloadProjects();
        } catch (err) {
            showToast('error', err.response?.data?.error || 'Error finalizando proyecto');
        }
    };

    return (
        <Container fluid className="mt-4">
            <Row className="mb-3">
                <Col>
                    <h3>Proyectos de Software</h3>
                </Col>
                <Col xs="auto">
                    <Button variant="primary" size="sm" className="d-inline-flex align-items-center me-1" onClick={openUserModal}>
                        <FaPlus className="me-2" />Usuario
                    </Button>
                    <Button variant="success" size="sm" className="d-inline-flex align-items-center" onClick={() => setProjectModalVisible(true)}>
                        <FaPlus className="me-2" />Proyecto
                    </Button>
                </Col>
            </Row>

            <Row className="align-items-center mb-3">
                <Col>
                    <Form.Control
                        type="text"
                        placeholder="Buscar por nombre o código..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </Col>
                <Col xs="auto">
                    <Form.Check
                        type="switch"
                        id="finished-projects-switch"
                        label="Mostrar finalizados"
                        checked={status === 'finished'}
                        onChange={(e) => setStatus(e.target.checked ? 'finished' : 'active')}
                    />
                </Col>
            </Row>

            <ProjectsTable
                projects={pageItems}
                loading={loading}
                sort={sort}
                onSort={toggleSort}
                getUserName={getUserName}
                onTerminate={handleTerminateProject}
            />

            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mt-3 mb-3">
                <span>Página {page} de {totalPages}</span>
                <div className="d-flex flex-wrap align-items-center gap-3">
                    <span className="fw-semibold text-muted">Total de registros: {total}</span>
                    <ButtonGroup>
                        <Button variant="outline-secondary" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>
                            Anterior
                        </Button>
                        <Button variant="outline-secondary" size="sm" disabled={page === totalPages} onClick={() => setPage(page + 1)}>
                            Siguiente
                        </Button>
                    </ButtonGroup>
                </div>
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
        </Container>
    );
}
