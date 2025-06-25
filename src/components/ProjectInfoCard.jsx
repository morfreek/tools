import React, { useEffect, useState } from 'react';
import { Dropdown } from 'react-bootstrap';
import { FaEdit, FaStickyNote, FaEye, FaEllipsisV } from 'react-icons/fa'; // Cambiar FaPlus por FaStickyNote
import { useToast } from './ToastContext'; // Importa el contexto de Toast
import api from '@/api';
import ProjectModal from './ProjectModal';
import ProjectNoteModal from './ProjectNoteModal';
import ProjectNotesList from './ProjectNotesList';

export default function ProjectInfoCard({ id, onRefresh }) { // Eliminar refreshTrigger
    const { showToast } = useToast(); // Usa el contexto de Toast
    const [project, setProject] = useState({});
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formDataProject, setFormDataProject] = useState(null);
    const [showNoteModal, setShowNoteModal] = useState(false);
    const [showNotesList, setShowNotesList] = useState(false);

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [projectRes, usersRes] = await Promise.all([
                api.get(`/projects/${id}`),
                api.get(`/users`)
            ]);
            setProject(projectRes.data);
            setUsers(usersRes.data);
        } catch (err) {
            console.error(err);
            showToast('error', 'Error al cargar datos del proyecto');
        } finally {
            setLoading(false);
        }
    };

    const getUserName = (userId) => users.find(u => u.id === userId)?.name || 'N/A';

    useEffect(() => {
        if (id) fetchAll();
    }, [id]); // Eliminar refreshTrigger del array de dependencias

    const handleEditClick = () => {
        setFormDataProject({
            id: project.id,
            name: project.name,
            code: project.code,
            coordinator_id: project.coordinator_id,
            developer_ids: (project.developers || []).map(m => m.id),
        });
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setFormDataProject(null);
        setShowModal(false);
        fetchAll();
        if (onRefresh) onRefresh();
    };

    const handleAddNote = () => {
        setShowNoteModal(true);
    };

    const handleCloseNoteModal = () => {
        setShowNoteModal(false);
    };

    if (loading || !project) {
        return (
            <div className="card p-3 my-3">
                <div className="placeholder-glow">
                    <h5 className="placeholder col-12 mb-2"></h5>
                    <p className="placeholder col-12 mb-1"></p>
                    <p className="placeholder col-12 mb-1"></p>
                    <p className="placeholder col-12 mb-1"></p>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="card p-3 my-3">
                <div className="d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">{project.name}</h5>
                    <Dropdown>
                        <Dropdown.Toggle variant="light" size="sm" id="project-actions">
                            <FaEllipsisV />
                        </Dropdown.Toggle>
                        <Dropdown.Menu align="end">
                            <Dropdown.Item onClick={() => setShowNotesList(true)}>
                                <FaEye className="me-2" />
                                Ver notas
                            </Dropdown.Item>
                            <Dropdown.Item onClick={handleAddNote}>
                                <FaStickyNote className="me-2" />
                                Agregar nota
                            </Dropdown.Item>
                            <Dropdown.Divider />
                            <Dropdown.Item onClick={handleEditClick}>
                                <FaEdit className="me-2" />
                                Editar proyecto
                            </Dropdown.Item>
                        </Dropdown.Menu>
                    </Dropdown>
                </div>
                <p className="mb-1"><strong>Código:</strong> {project.code}</p>
                <p className="mb-1"><strong>Coordinador:</strong> {getUserName(project.coordinator_id)}</p>
                <p className="mb-1">
                    <strong>Desarrolladores:</strong> {(project.developers || []).map(m => m.name).join(', ')}
                </p>
            </div>

            <ProjectModal
                show={showModal}
                onClose={handleCloseModal}
                formData={formDataProject}
            />
            
            <ProjectNoteModal
                show={showNoteModal}
                onClose={handleCloseNoteModal}
                onSaved={fetchAll}
                projectId={id}
                note={null}
            />

            <ProjectNotesList
                projectId={id}
                show={showNotesList}
                onClose={() => setShowNotesList(false)}
            />
        </>
    );
}
