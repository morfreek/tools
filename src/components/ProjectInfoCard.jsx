import React, { useEffect, useState } from 'react';
import { Dropdown, Button, Card, Placeholder } from 'react-bootstrap';
import { FaEdit, FaStickyNote, FaEye, FaEllipsisV, FaUpload, FaFile } from 'react-icons/fa'; // Import FaUpload and FaFile
import { useToast } from './ToastContext'; // Importa el contexto de Toast
import api from '@/api';
import ProjectModal from './ProjectModal';
import ProjectNoteModal from './ProjectNoteModal';
import ProjectNotesList from './ProjectNotesList';
import ProjectFileUploader from './ProjectFileUploader';
import ProjectFilesList from './ProjectFilesList'; // Importa ProjectFilesList

// Componente privado para el dropdown
const OptionsDropdown = ({ options }) => (
    <Dropdown align="end">
        <Dropdown.Toggle
            variant="link"
            size="sm"
            className="text-muted p-1"
            style={{
                boxShadow: 'none',
                border: 'none',
                background: 'transparent'
            }}
        >
            <FaEllipsisV size={14} />
        </Dropdown.Toggle>
        <Dropdown.Menu style={{ minWidth: '160px', fontSize: '0.875rem' }}>
            {options.map((option, index) => (
                option.divider ? (
                    <Dropdown.Divider key={`divider-${index}`} className="my-1" />
                ) : (
                    <Dropdown.Item
                        key={option.label}
                        onClick={option.onClick}
                        className="px-2 py-1"
                    >
                        {option.icon && (
                            <option.icon className="me-2" size={12} />
                        )}
                        {option.label}
                    </Dropdown.Item>
                )
            ))}
        </Dropdown.Menu>
    </Dropdown>
);

export default function ProjectInfoCard({ id, onRefresh, onNoteAdded }) {
    const { showToast } = useToast(); // Usa el contexto de Toast
    const [project, setProject] = useState({});
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formDataProject, setFormDataProject] = useState(null);
    const [showNoteModal, setShowNoteModal] = useState(false);
    const [showNotesList, setShowNotesList] = useState(false);
    const [showUploader, setShowUploader] = useState(false);
    const [showFilesList, setShowFilesList] = useState(false);

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
    }, [id]);

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

    const handleCloseNoteModal = () => {
        setShowNoteModal(false);
        if (onNoteAdded) onNoteAdded();
    };

    const dropdownOptions = [
        {
            label: 'Editar proyecto',
            icon: FaEdit,
            onClick: handleEditClick
        },
        { divider: true },
        {
            label: 'Notas',
            icon: FaStickyNote,
            onClick: () => setShowNotesList(true)
        },
        { divider: true },
        {
            label: 'Subir archivos',
            icon: FaUpload,
            onClick: () => setShowUploader(true)
        },
        {
            label: 'Ver archivos',
            icon: FaEye,
            onClick: () => setShowFilesList(true)
        },
    ];

    if (loading || !project) {
        return (
            <Card className="my-3">
                <Card.Body>
                    <Placeholder as={Card.Title} animation="glow">
                        <Placeholder xs={12} />
                    </Placeholder>
                    <Placeholder as="p" animation="glow">
                        <Placeholder xs={12} />
                        <Placeholder xs={12} />
                        <Placeholder xs={12} />
                    </Placeholder>
                </Card.Body>
            </Card>
        );
    }

    return (
        <Card className="my-3">
            <Card.Body>
                <div className="d-flex justify-content-between align-items-center">
                    <Card.Title className="mb-0">{project.name}</Card.Title>
                    <OptionsDropdown options={dropdownOptions} />
                </div>
                <Card.Text className="mb-1">
                    <strong>Código:</strong> {project.code}
                </Card.Text>
                <Card.Text className="mb-1">
                    <strong>Coordinador:</strong> {getUserName(project.coordinator_id)}
                </Card.Text>
                <Card.Text className="mb-1">
                    <strong>Desarrolladores:</strong> {(project.developers || []).map(m => m.name).join(', ')}
                </Card.Text>
            </Card.Body>

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

            <ProjectFileUploader
                show={showUploader}
                onClose={() => setShowUploader(false)}
                projectId={id}
                onUploadComplete={fetchAll}
            />

            <ProjectFilesList
                projectId={id}
                show={showFilesList}
                onClose={() => setShowFilesList(false)}
            />
        </Card>
    );
}
