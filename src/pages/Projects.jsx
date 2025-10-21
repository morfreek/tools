import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaPlus, FaTasks, FaStop } from 'react-icons/fa';
import { Container, Row, Col, Button, Form, Table, ButtonGroup, Spinner } from 'react-bootstrap';
import api from '@/api';
import UserModal from '@c/user/UserModal';
import ProjectModal from '@c/modal/ProjectModal';
import { useConfirm } from '@c/ConfirmContext';
import Toast from '@c/Toast';

const SortableHeader = ({ title, sortKey, currentSort, onSort }) => (
    <th onClick={() => onSort(sortKey)} style={{ cursor: 'pointer' }}>
        {title} {currentSort.key === sortKey ? (currentSort.direction === 'asc' ? '▲' : '▼') : ''}
    </th>
);

const TableHeader = ({ sortConfig, handleSort }) => (
    <thead>
        <tr>
            <SortableHeader title="Nombre" sortKey="name" currentSort={sortConfig} onSort={handleSort} />
            <SortableHeader title="Código" sortKey="code" currentSort={sortConfig} onSort={handleSort} />
            <SortableHeader title="Coordinador" sortKey="coordinator_id" currentSort={sortConfig} onSort={handleSort} />
            <th>Desarrolladores</th>
            <th className="text-center">Acciones</th>
        </tr>
    </thead>
);

const LoadingRow = () => (
    <tr>
        <td colSpan="5" className="text-center">
            <Spinner animation="border" size="sm" /> Cargando...
        </td>
    </tr>
);

const EmptyRow = () => (
    <tr>
        <td colSpan="5" className="text-center text-muted">
            No existen datos
        </td>
    </tr>
);

const ProjectRow = ({ project, getUserName, onTerminate }) => (
    <tr>
        <td>{project.name}</td>
        <td>{project.code}</td>
        <td>{getUserName(project.coordinator_id)}</td>
        <td>{(project.developer_ids || []).map(getUserName).join(', ')}</td>
        <td className="text-center">
            <ButtonGroup size="sm">
                <Button
                    as={Link}
                    to={`/projects/${project.id}/detail`}
                    variant="primary"
                    className="d-inline-flex align-items-center"
                >
                    <FaTasks className="me-1" />
                    {/* Detalles */}
                </Button>
                <Button
                    variant="outline-secondary"
                    className="d-inline-flex align-items-center"
                    onClick={() => onTerminate(project)}
                >
                    <FaStop className="me-1" />
                    Finalizar
                </Button>
            </ButtonGroup>
        </td>
    </tr>
);

export default function Projects() {
    const [projects, setProjects] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        id: null,
        name: '',
        code: '',
        coordinator_id: '',
        developer_ids: [],
    });
    const [editing, setEditing] = useState(false);
    const [projectModalVisible, setProjectModalVisible] = useState(false);

    const [userModalVisible, setUserModalVisible] = useState(false);
    const [userData, setUserData] = useState({});
    const [userEditing, setUserEditing] = useState(false);

    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const { showConfirm } = useConfirm();

    const [toast, setToast] = useState({
        show: false,
        type: 'success',
        message: ''
    });

    const showToast = (type, message) => {
        setToast({ show: true, type, message });
    };

    const closeToast = () => {
        setToast(prev => ({ ...prev, show: false }));
    };

    useEffect(() => {
        fetchProjects();
        fetchUsers();
    }, []);

    const fetchProjects = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/projects`);
            setProjects(res.data);
        } catch (err) {
            console.error(err);
            showToast('error', 'Error cargando proyectos');
        }
        setLoading(false);
    };

    const fetchUsers = async () => {
        try {
            const res = await api.get(`/users`);
            setUsers(res.data);
        } catch (err) {
            console.error(err);
            showToast('error', 'Error cargando usuarios');
        }
    };

    const openProjectModal = (project = null) => {
        if (project) {
            setFormData({
                id: project.id,
                name: project.name,
                code: project.code,
                coordinator_id: project.coordinator_id,
                developer_ids: project.developer_ids || [],
            });
            setEditing(true);
        } else {
            setFormData({
                id: null,
                name: '',
                code: '',
                coordinator_id: '',
                developer_ids: [],
            });
            setEditing(false);
        }
        setProjectModalVisible(true);
    };

    const closeProjectModal = () => {
        setProjectModalVisible(false);
    };

    const handleProjectSubmit = async () => {
        try {
            const payload = {
                name: formData.name,
                code: formData.code,
                coordinator_id: formData.coordinator_id,
                developer_ids: formData.developer_ids,
            };
            if (editing) {
                await api.put(`/projects/${formData.id}`, payload);
                showToast('success', 'Proyecto actualizado');
            } else {
                await api.post(`/projects`, payload);
                showToast('success', 'Proyecto creado');
            }
            fetchProjects();
            closeProjectModal();
        } catch (err) {
            console.error(err);
            showToast('error', 'Error guardando proyecto');
        }
    };

    const openUserModal = (user = null) => {
        if (user) {
            setUserData(user);
            setUserEditing(true);
        } else {
            setUserData({});
            setUserEditing(false);
        }
        setUserModalVisible(true);
    };

    const closeUserModal = () => {
        setUserModalVisible(false);
    };

    const handleUserSubmit = async () => {
        try {
            if (userEditing) {
                await api.put(`/users/${userData.id}`, userData);
                showToast('success', 'Usuario actualizado');
            } else {
                await api.post(`/users`, userData);
                showToast('success', 'Usuario creado');
            }
            fetchUsers();
            closeUserModal();
        } catch (err) {
            console.error(err);
            showToast('error', 'Error guardando usuario');
        }
    };

    const getUserName = (id) => {
        const user = users.find(u => u.id === id);
        return user ? user.name : 'N/A';
    };

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const normalizeString = (str) => {
        return str.toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
    };

    const filteredProjects = projects.filter(project => {
        const searchTermNormalized = normalizeString(searchTerm);
        return normalizeString(project.name).includes(searchTermNormalized)
            || normalizeString(project.code).includes(searchTermNormalized)
            || normalizeString(getUserName(project.coordinator_id)).includes(searchTermNormalized)
            || (project.developer_ids || [])
                .map(id => normalizeString(getUserName(id)))
                .some(name => name.includes(searchTermNormalized));
    });

    const sortedProjects = [...filteredProjects].sort((a, b) => {
        const key = sortConfig.key;
        const aValue = (key === 'coordinator_id' ? getUserName(a[key]) : a[key])?.toString().toLowerCase() || '';
        const bValue = (key === 'coordinator_id' ? getUserName(b[key]) : b[key])?.toString().toLowerCase() || '';
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    const totalPages = Math.ceil(sortedProjects.length / itemsPerPage);
    const paginatedProjects = sortedProjects.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const confirm = (title, message) => {
        return new Promise((resolve) => {
            showConfirm({
                title,
                message,
                onConfirm: () => resolve(true),
                onClose: () => resolve(false),
                confirmText: 'Confirmar',
                cancelText: 'Cancelar',
                confirmButtonClass: 'btn-warning'
            });
        });
    };

    const handleTerminateProject = async (project) => {
        const confirmed = await confirm(
            'Finalizar Proyecto',
            `¿Está seguro que desea finalizar el proyecto "${project.name}"?\n\nEsta acción no se puede deshacer.`
        );
        
        if (!confirmed) return;

        try {
            await api.patch(`/projects/${project.id}/terminate`);
            showToast('success', 'Proyecto finalizado correctamente');
            fetchProjects();
        } catch (err) {
            console.error(err);
            const errorMessage = err.response?.data?.error || 'Error finalizando proyecto';
            showToast('error', errorMessage);
        }
    };

    return (
        <Container fluid className="mt-4">
            <Row className="mb-3">
                <Col>
                    <h3>Proyectos de Software</h3>
                </Col>
                <Col xs="auto">
                    <Button variant="primary" size="sm" className="d-inline-flex align-items-center me-1" onClick={() => openUserModal()}>
                        <FaPlus className="me-2" />Usuario
                    </Button>
                    <Button variant="success" size="sm" className="d-inline-flex align-items-center" onClick={() => openProjectModal()}>
                        <FaPlus className="me-2" />Proyecto
                    </Button>
                </Col>
            </Row>

            <Form.Control
                type="text"
                className="mb-3"
                placeholder="Buscar por nombre o código..."
                value={searchTerm}
                onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                }}
            />

            <Table striped bordered hover>
                <TableHeader sortConfig={sortConfig} handleSort={handleSort} />
                <tbody>
                    {loading ? (
                        <LoadingRow />
                    ) : paginatedProjects.length > 0 ? (
                        paginatedProjects.map(project => (
                            <ProjectRow 
                                key={project.id}
                                project={project}
                                getUserName={getUserName}
                                onTerminate={handleTerminateProject}
                            />
                        ))
                    ) : (
                        <EmptyRow />
                    )}
                </tbody>
            </Table>

            <Row className="align-items-center mt-1">
                <Col>
                    <span>Página {currentPage} de {totalPages}</span>
                </Col>
                <Col xs="auto">
                    <ButtonGroup>
                        <Button
                            variant="outline-secondary"
                            size="sm"
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(currentPage - 1)}
                        >
                            Anterior
                        </Button>
                        <Button
                            variant="outline-secondary"
                            size="sm"
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(currentPage + 1)}
                        >
                            Siguiente
                        </Button>
                    </ButtonGroup>
                </Col>
            </Row>

            <ProjectModal
                show={projectModalVisible}
                onClose={closeProjectModal}
                onSubmit={handleProjectSubmit}
                formData={formData}
                setFormData={setFormData}
                users={users}
                editing={editing}
            />

            <UserModal
                show={userModalVisible}
                onClose={closeUserModal}
                onSubmit={handleUserSubmit}
                userData={userData}
                setUserData={setUserData}
                editing={userEditing}
            />

            <Toast
                show={toast.show}
                type={toast.type}
                message={toast.message}
                onClose={closeToast}
                position="top-right"
                duration={3000}
            />
        </Container>
    );
}
