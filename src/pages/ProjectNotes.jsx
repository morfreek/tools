import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaChevronLeft, FaSave, FaEdit, FaTrash, FaBan } from 'react-icons/fa';
import ProjectInfoCard from '@/components/ProjectInfoCard';
import api from '@/api';
import moment from 'moment';

export default function ProjectNotes() {
    const navigate = useNavigate();
    const { id } = useParams(); // ID del proyecto desde la URL
    const [notes, setNotes] = useState([]);
    const [noteText, setNoteText] = useState('');
    const [loading, setLoading] = useState(true);

    const [editingNoteId, setEditingNoteId] = useState(null);
    const [editText, setEditText] = useState('');

    const fetchNotes = async () => {
        try {
            const res = await api.get(`/projects/${id}/notes`);
            setNotes(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddNote = async () => {
        if (!noteText.trim()) return;
        try {
            await api.post(`/projects/${id}/notes`, {
                detail: noteText,
                created_at: new Date().toISOString()
            });
            setNoteText('');
            fetchNotes();
        } catch (err) {
            console.error(err);
            alert('Error al guardar nota');
        }
    };

    const handleStartEdit = (note) => {
        setEditingNoteId(note.id);
        setEditText(note.detail);
    };

    const handleCancelEdit = () => {
        setEditingNoteId(null);
        setEditText('');
    };

    const handleSaveEdit = async (noteId) => {
        try {
            await api.put(`/projects/${id}/notes`, { detail: editText, noteId });
            setEditingNoteId(null);
            setEditText('');
            fetchNotes(); // o tu método para refrescar la lista
        } catch (err) {
            console.error('Error al guardar la nota editada', err);
        }
    };

    const handleDeleteNote = async (noteId) => {
        if (window.confirm('¿Estás seguro de que deseas eliminar esta nota?')) {
            try {
                await api.delete(`/projects/${id}/notes`, { data: { noteId } });
                fetchNotes(); // recarga las notas
            } catch (err) {
                console.error('Error al eliminar la nota', err);
            }
        }
    };

    useEffect(() => {
        if (id) fetchNotes();
    }, [id]);

    return (
        <div className="container-fluid mt-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="d-flex align-items-center">
                    <button
                        className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center me-2"
                        title="Volver a Proyectos"
                        onClick={() => navigate(-1)}
                    >
                        <FaChevronLeft style={{ verticalAlign: 'middle' }} />
                    </button>
                    <h3 className="mb-0">Notas del Proyecto</h3>
                </div>
            </div>

            <ProjectInfoCard id={id} />

            <div className="mb-3">
                <textarea
                    className="form-control"
                    rows="3"
                    placeholder="Escribe una nota..."
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                />
                <div className="d-flex justify-content-end mt-2">
                    <button className="btn btn-sm btn-success d-inline-flex align-items-center" onClick={handleAddNote}>
                        <FaSave className="me-2" /> Guardar
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="text-muted">Cargando notas...</div>
            ) : (
                <>
                    {notes.length === 0 && (
                        <p className="list-group-item text-muted">Sin notas registradas</p>
                    )}

                    <div className="d-flex flex-wrap gap-3 align-items-start">
                        {notes.map((note, i) => (
                            <div
                                key={i}
                                className="p-3"
                                style={{
                                    backgroundColor: '#fff475',
                                    boxShadow: '2px 2px 6px rgba(0,0,0,0.2)',
                                    borderRadius: '8px',
                                    transform: `rotate(${(i % 2 === 0 ? -1 : 1)}deg)`,
                                    whiteSpace: 'pre-wrap',
                                    height: 'auto',
                                    maxWidth: '400px', // opcional para evitar que se expandan mucho horizontalmente
                                    overflowWrap: 'break-word',
                                    wordBreak: 'break-word',
                                }}
                            >
                                <div className="small text-muted mb-2 d-flex justify-content-between" style={{ fontSize: '0.75rem' }}>
                                    <span>{moment(note.created_at).format('DD-MM-YYYY HH:mm')}</span>
                                    <div className="btn-group ms-4">
                                        {editingNoteId === note.id ? (
                                            <>
                                                <button
                                                    className="btn btn-sm btn-outline-success p-1 d-inline-flex align-items-center"
                                                    onClick={() => handleSaveEdit(note.id)}
                                                >
                                                    <FaSave />
                                                </button>
                                                <button
                                                    className="btn btn-sm btn-outline-danger p-1 d-inline-flex align-items-center"
                                                    onClick={handleCancelEdit}
                                                >
                                                    <FaBan />
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button
                                                    className="btn btn-sm btn-outline-secondary p-1 d-inline-flex align-items-center"
                                                    title="Editar"
                                                    onClick={() => handleStartEdit(note)}
                                                >
                                                    <FaEdit />
                                                </button>
                                                <button
                                                    className="btn btn-sm btn-outline-danger p-1 d-inline-flex align-items-center"
                                                    title="Eliminar"
                                                    onClick={() => handleDeleteNote(note.id)}
                                                >
                                                    <FaTrash />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                                {editingNoteId === note.id ? (
                                    <>
                                        <textarea
                                            className="form-control mb-2"
                                            rows="8"
                                            style={{ minHeight: '150px', resize: 'both' }}
                                            value={editText}
                                            onChange={(e) => setEditText(e.target.value)}
                                        />
                                    </>
                                ) : (
                                    <div dangerouslySetInnerHTML={{ __html: note.detail }} />
                                )}
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
