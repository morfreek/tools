import React, { useEffect, useState, useRef } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { FaEdit, FaTrash, FaTimes } from 'react-icons/fa';
import { useToast } from './ToastContext';
import api from '@/api';
import ProjectNoteModal from './ProjectNoteModal';

export default function ProjectNotesList({ projectId, show, onClose }) {
    const { showToast } = useToast();
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedNote, setSelectedNote] = useState(null);
    const sidebarRef = useRef(null);

    const fetchNotes = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/projects/${projectId}/notes`);
            setNotes(response.data.sort((a, b) => 
                new Date(b.created_at) - new Date(a.created_at)
            ));
        } catch (err) {
            console.error(err);
            showToast('error', 'Error al cargar las notas');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (projectId) fetchNotes();
    }, [projectId]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (sidebarRef.current && !sidebarRef.current.contains(event.target) && show) {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [show, onClose]);

    const handleEdit = (note) => {
        setSelectedNote(note);
        setShowEditModal(true);
    };

    const handleDelete = async (noteId) => {
        if (!window.confirm('¿Estás seguro de eliminar esta nota?')) return;
        
        try {
            await api.delete(`/projects/${projectId}/notes/${noteId}`);
            showToast('success', 'Nota eliminada correctamente');
            fetchNotes();
        } catch (err) {
            console.error(err);
            showToast('error', 'Error al eliminar la nota');
        }
    };

    if (!show) return null;

    return (
        <div className="position-fixed top-0 end-0 h-100 bg-white shadow-lg" 
             style={{ 
                 width: '400px', 
                 zIndex: 1040,
                 transform: `translateX(${show ? '0' : '100%'})`,
                 transition: 'transform 0.3s ease-in-out'
             }}
             ref={sidebarRef}>
            <div className="d-flex justify-content-between align-items-center p-3 border-bottom">
                <h5 className="mb-0">Notas del Proyecto</h5>
                <button 
                    className="btn btn-sm btn-link text-dark" 
                    onClick={onClose}
                    style={{ fontSize: '1.2rem' }}
                >
                    <FaTimes />
                </button>
            </div>
            <div className="p-3" style={{ height: 'calc(100vh - 60px)', overflowY: 'auto' }}>
                {loading ? (
                    <div className="placeholder-glow">
                        <div className="placeholder col-12 mb-2"></div>
                        <div className="placeholder col-12 mb-2"></div>
                    </div>
                ) : notes.length === 0 ? (
                    <p className="text-muted text-center">No hay notas registradas</p>
                ) : (
                    <div className="list-group list-group-flush">
                        {notes.map(note => (
                            <div key={note.id} className="list-group-item">
                                <div className="d-flex justify-content-between align-items-start mb-2">
                                    <small className="text-muted">
                                        {format(new Date(note.created_at), "d 'de' MMMM 'de' yyyy, HH:mm", { locale: es })}
                                    </small>
                                    <div className="btn-group">
                                        <button
                                            className="btn btn-sm btn-outline-primary"
                                            onClick={() => handleEdit(note)}
                                        >
                                            <FaEdit />
                                        </button>
                                        <button
                                            className="btn btn-sm btn-outline-danger"
                                            onClick={() => handleDelete(note.id)}
                                        >
                                            <FaTrash />
                                        </button>
                                    </div>
                                </div>
                                <div className="border-start border-4 border-info ps-3">
                                    <div dangerouslySetInnerHTML={{ __html: note.detail }} />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            
            <ProjectNoteModal
                show={showEditModal}
                onClose={() => {
                    setShowEditModal(false);
                    setSelectedNote(null);
                }}
                onSaved={fetchNotes}
                projectId={projectId}
                note={selectedNote}
            />
        </div>
    );
}
