import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaPlus, FaEdit, FaTasks } from 'react-icons/fa';
import { Tooltip, OverlayTrigger } from 'react-bootstrap';
import api from '@/api';
import UserModal from '@/components/UserModal';
import ProjectModal from '@/components/ProjectModal';

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
            alert('Error cargando proyectos');
        }
        setLoading(false);
    };

    const fetchUsers = async () => {
        try {
            const res = await api.get(`/users`);
            setUsers(res.data);
        } catch (err) {
            console.error(err);
            alert('Error cargando usuarios');
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
                alert('Proyecto actualizado');
            } else {
                await api.post(`/projects`, payload);
                alert('Proyecto creado');
            }
            fetchProjects();
            closeProjectModal();
        } catch (err) {
            console.error(err);
            alert('Error guardando proyecto');
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
                alert('Usuario actualizado');
            } else {
                await api.post(`/users`, userData);
                alert('Usuario creado');
            }
            fetchUsers();
            closeUserModal();
        } catch (err) {
            console.error(err);
            alert('Error guardando usuario');
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

    const filteredProjects = projects.filter(project =>
        project.name.toLowerCase().includes(searchTerm.toLowerCase())
        || project.code.toLowerCase().includes(searchTerm.toLowerCase())
        // AGREGAR COORDINADOR O DESARROLLADOR
    );

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

    return (
        <div className="container-fluid mt-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h3>Proyectos de Software</h3>
                <div>
                    <button className="btn btn-sm btn-primary d-inline-flex align-items-center me-1" onClick={() => openUserModal()}>
                        <FaPlus className="me-2" />Usuario
                    </button>
                    <button className="btn btn-sm btn-success d-inline-flex align-items-center" onClick={() => openProjectModal()}>
                        <FaPlus className="me-2" />Proyecto
                    </button>
                </div>
            </div>

            <input
                type="text"
                className="form-control mb-3"
                placeholder="Buscar por nombre o código..."
                value={searchTerm}
                onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                }}
            />

            <table className="table table-striped table-bordered table-hover">
                <thead>
                    <tr>
                        <th onClick={() => handleSort('name')} style={{ cursor: 'pointer' }}>
                            Nombre {sortConfig.key === 'name' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                        </th>
                        <th onClick={() => handleSort('code')} style={{ cursor: 'pointer' }}>
                            Código {sortConfig.key === 'code' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                        </th>
                        <th onClick={() => handleSort('coordinator_id')} style={{ cursor: 'pointer' }}>
                            Coordinador {sortConfig.key === 'coordinator_id' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                        </th>
                        <th>Desarrolladores</th>
                        <th className='text-center'>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {loading ? (
                        <tr><td colSpan="5" className="text-center">Cargando...</td></tr>
                    ) : paginatedProjects.length > 0 ? (
                        paginatedProjects.map(project => (
                            <tr key={project.id}>
                                <td>{project.name}</td>
                                <td>{project.code}</td>
                                <td>{getUserName(project.coordinator_id)}</td>
                                <td>{(project.developer_ids || []).map(getUserName).join(', ')}</td>
                                <td className='text-center'>
                                    <Link
                                        to={`/projects/${project.id}/detail`}
                                        className="btn btn-sm btn-primary d-inline-flex align-items-center"
                                    >
                                        <FaTasks />
                                    </Link>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="5" className="text-center text-muted">
                                No existen datos
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            <div className="d-flex justify-content-between align-items-center mt-1">
                <span>Página {currentPage} de {totalPages}</span>
                <div className="btn-group">
                    <button
                        className="btn btn-sm btn-outline-secondary"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(currentPage - 1)}
                    >
                        Anterior
                    </button>
                    <button
                        className="btn btn-sm btn-outline-secondary"
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(currentPage + 1)}
                    >
                        Siguiente
                    </button>
                </div>
            </div>

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
        </div>
    );
}
