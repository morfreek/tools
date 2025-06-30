import React, { useEffect, useState, useRef } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { FaEdit, FaTrash, FaTimes, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { useToast } from '@/components/ToastContext';
import { useConfirm } from '@/components/ConfirmContext';
import api from '@/api';
import ProjectNoteModal from './ProjectNoteModal';

export default function ProjectNotesList({ 
    projectId, 
    show, 
    onClose, 
    className = '',
    containerStyle = {},
    refreshKey
}) {
    const { showToast } = useToast();
    const { showConfirm } = useConfirm();
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedNote, setSelectedNote] = useState(null);
    const [currentNoteIndex, setCurrentNoteIndex] = useState(0);
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
        if (projectId && refreshKey) {
            fetchNotes();
        }
    }, [projectId, refreshKey]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (sidebarRef.current && 
                !sidebarRef.current.contains(event.target) && 
                show && 
                typeof onClose === 'function') {
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

    const handleDelete = (noteId) => {
        showConfirm({
            title: "Eliminar Nota",
            message: "¿Estás seguro de eliminar esta nota? Esta acción no se puede deshacer.",
            confirmText: "Eliminar",
            cancelText: "Cancelar",
            onConfirm: async () => {
                try {
                    await api.delete(`/projects/${projectId}/notes/`, { data: {noteId} });
                    showToast('success', 'Nota eliminada correctamente');
                    fetchNotes();
                } catch (err) {
                    console.error(err);
                    showToast('error', 'Error al eliminar la nota');
                }
            }
        });
    };

    const handleNext = () => {
        if (currentNoteIndex < notes.length - 1) {
            setCurrentNoteIndex(prev => prev + 1);
        }
    };

    const handlePrev = () => {
        if (currentNoteIndex > 0) {
            setCurrentNoteIndex(prev => prev - 1);
        }
    };

    const defaultContainerStyle = !Object.keys(containerStyle).length ? {
        position: 'fixed',
        top: 0,
        right: 0,
        height: '100%',
        width: '400px',
        zIndex: 1040,
        transform: `translateX(${show ? '0' : '100%'})`,
        transition: 'transform 0.3s ease-in-out'
    } : containerStyle;

    if (!show) return null;

    return (
        <>
            <div 
                className={`bg-white shadow-lg ${className}`}
                style={defaultContainerStyle}
                ref={sidebarRef}
            >
                <div className="d-flex flex-column h-100">
                    <div className="border-bottom">
                        <div className="d-flex justify-content-between align-items-center p-3">
                            <h5 className="mb-0">Notas del Proyecto</h5>
                            {typeof onClose === 'function' && (
                                <button
                                    className="btn btn-sm btn-link text-dark"
                                    onClick={onClose}
                                    style={{ fontSize: '1.2rem' }}
                                >
                                    <FaTimes />
                                </button>
                            )}
                        </div>
                        {!loading && notes.length > 0 && (
                            <div className="px-3 pb-3">
                                <div className="d-flex justify-content-between align-items-start">
                                    <small className="text-muted">
                                        {format(new Date(notes[currentNoteIndex].created_at),
                                            "d 'de' MMMM 'de' yyyy, HH:mm",
                                            { locale: es })}
                                    </small>
                                    <div className="btn-group">
                                        <button
                                            className="btn btn-sm btn-outline-primary p-1 d-inline-flex align-items-center"
                                            onClick={() => handleEdit(notes[currentNoteIndex])}
                                        >
                                            <FaEdit />
                                        </button>
                                        <button
                                            className="btn btn-sm btn-outline-danger p-1 d-inline-flex align-items-center"
                                            onClick={() => handleDelete(notes[currentNoteIndex].id)}
                                        >
                                            <FaTrash />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex-grow-1 overflow-hidden">
                        {loading ? (
                            <div className="p-3">
                                <div className="placeholder-glow">
                                    <div className="placeholder col-12 mb-2"></div>
                                    <div className="placeholder col-12 mb-2"></div>
                                </div>
                            </div>
                        ) : notes.length === 0 ? (
                            <div className="p-3">
                                <p className="text-muted text-center">No hay notas registradas</p>
                            </div>
                        ) : (
                            <div className="p-3 h-100 overflow-auto">
                                <div key={notes[currentNoteIndex].id}>
                                    <div className="border-start border-4 border-info ps-3">
                                        <div 
                                            className="note-content"
                                            dangerouslySetInnerHTML={{
                                                __html: notes[currentNoteIndex].detail
                                            }} 
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {!loading && notes.length > 0 && (
                        <div className="border-top p-3">
                            <div className="d-flex justify-content-between align-items-center">
                                <button
                                    className="btn btn-sm btn-outline-secondary"
                                    onClick={handlePrev}
                                    disabled={notes.length <= 1 || currentNoteIndex === 0}
                                >
                                    <FaChevronLeft /> Anterior
                                </button>
                                <small className="text-muted">
                                    {currentNoteIndex + 1} de {notes.length}
                                </small>
                                <button
                                    className="btn btn-sm btn-outline-secondary"
                                    onClick={handleNext}
                                    disabled={notes.length <= 1 || currentNoteIndex === notes.length - 1}
                                >
                                    Siguiente <FaChevronRight />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
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
        </>
    );
}
