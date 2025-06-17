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

    // Estado para proyecto
    const [formData, setFormData] = useState({
        id: null,
        name: '',
        code: '',
        coordinator_id: '',
        developer_ids: [],
    });
    const [loading, setLoading] = useState(false);
    const [editing, setEditing] = useState(false);
    const [projectModalVisible, setProjectModalVisible] = useState(false);

    // Estado para usuario
    const [userModalVisible, setUserModalVisible] = useState(false);
    const [userData, setUserData] = useState({});
    const [userEditing, setUserEditing] = useState(false);

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

    // Modal proyectos
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
                await api.put(`/projects/${formData.id}, payload`);
                alert('Proyecto actualizado');
            } else {
                await api.post(`/projects, payload`);
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
                await api.put(`/users/${userData.id}, userData`);
                alert('Usuario actualizado');
            } else {
                await api.post(`/users, userData`);
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

    return (
        <div className="container mt-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h3>Proyectos de Software</h3>

                <div className="">
                    <button className="btn btn-sm btn-primary d-inline-flex align-items-center me-1" onClick={() => openUserModal()}>
                        <FaPlus className="me-2" />Usuario
                    </button>
                    <button className="btn btn-sm btn-success d-inline-flex align-items-center" onClick={() => openProjectModal()}>
                        <FaPlus className="me-2" />Proyecto
                    </button>
                </div>
            </div>

            <table className="table table-striped table-bordered table-hover">
                <thead>
                    <tr>
                        <th>Nombre</th>
                        <th>Código</th>
                        <th>Coordinador</th>
                        <th>Desarrolladores</th>
                        <th className='text-center'>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {loading ? (
                        <tr><td colSpan="5" className="text-center">Cargando...</td></tr>
                    ) : projects.length > 0 ? (
                        projects.map(project => (
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

            {/* Modal Proyectos */}
            <ProjectModal
                show={projectModalVisible}
                onClose={closeProjectModal}
                onSubmit={handleProjectSubmit}
                formData={formData}
                setFormData={setFormData}
                users={users}
                editing={editing}
            />

            {/* Modal Usuarios */}
            <UserModal
                show={userModalVisible}
                onClose={closeUserModal}
                onSubmit={handleUserSubmit}
                userData={userData}
                setUserData={setUserData}
                editing={userEditing}
            />
        </div >
    );
}