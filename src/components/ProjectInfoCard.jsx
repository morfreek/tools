import React, { useEffect, useState } from 'react';
import { FaEdit } from 'react-icons/fa';
import api from '@/api';

export default function ProjectInfoCard({ id, onClickEdit, refreshTrigger }) {
    const [project, setProject] = useState({});
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

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
            alert('Error al cargar datos del proyecto');
        } finally {
            setLoading(false);
        }
    };

    const getUserName = (userId) => users.find(u => u.id === userId)?.name || 'N/A';

    useEffect(() => {
        if (id) fetchAll();
    }, [id, refreshTrigger]); // ← se vuelve a ejecutar cuando cambia id o refreshTrigger

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
        <div className="card p-3 my-3">
            <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">{project.name}</h5>
                {onClickEdit && (
                    <button
                        className="btn btn-sm btn-primary d-inline-flex align-items-center me-2"
                        onClick={() => onClickEdit(project)}
                    >
                        <FaEdit />
                    </button>
                )}
            </div>
            <p className="mb-1"><strong>Código:</strong> {project.code}</p>
            <p className="mb-1"><strong>Coordinador:</strong> {getUserName(project.coordinator_id)}</p>
            <p className="mb-1">
                <strong>Desarrolladores:</strong> {(project.developers || []).map(m => m.name).join(', ')}
            </p>
        </div>
    );
}
