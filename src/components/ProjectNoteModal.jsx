// src/components/NoteModal.jsx
import React, { useEffect, useState } from 'react';
import Editor from 'react-simple-wysiwyg';
import { FaSave, FaBan } from 'react-icons/fa';
import { useToast } from './ToastContext'; // Importa el contexto de Toast
import api from '@/api';

export default function ProjectNoteModal({ show, onClose, onSaved, projectId, note }) {
    const [content, setContent] = useState(note?.detail || '');
    const [loading, setLoading] = useState(false); // Nuevo estado
    const { showToast } = useToast(); // Usa el contexto de Toast

    useEffect(() => {
        setContent(note?.detail || '');
        setLoading(false); // Reset al abrir/cambiar nota
    }, [show, note]);

    const handleSave = async () => {
        if (!content.trim()) {
            showToast('error', 'El contenido no puede estar vacío.');
            return;
        }
        setLoading(true);
        try {
            if (note) {
                await api.put(`/projects/${projectId}/notes`, {
                    noteId: note.id,
                    detail: content
                });
            } else {
                await api.post(`/projects/${projectId}/notes`, {
                    detail: content,
                    created_at: new Date().toISOString()
                });
            }
            showToast('success', 'Nota guardada correctamente.');
            onSaved();
            setTimeout(() => {
                onClose();
            }, 1200);
        } catch (err) {
            console.error('Error al guardar nota', err);
            showToast('error', 'Error al guardar nota.');
            setLoading(false);
        }
    };

    return (
        <>
            <div className={`modal fade ${show ? 'show d-block' : ''}`} tabIndex="-1" style={{ backgroundColor: '#00000088' }}>
                <div className="modal-dialog modal-xl modal-dialog-centered">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">{note ? 'Editar Nota' : 'Nueva Nota'}</h5>
                            <button type="button" className="btn-close" onClick={onClose} disabled={loading}></button>
                        </div>
                        <div className="modal-body">
                            <Editor
                                containerProps={{ style: { resize: 'vertical', minHeight: '300px' } }}
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                disabled={loading}
                            />
                        </div>
                        <div className="modal-footer">
                            <button
                                type="submit"
                                className="btn btn-sm btn-success d-inline-flex align-items-center"
                                onClick={handleSave}
                                disabled={loading}
                            >
                                <FaSave className="me-2" />
                                {note ? 'Actualizar' : 'Crear'}
                            </button>
                            <button
                                type="button"
                                className="btn btn-sm btn-danger d-inline-flex align-items-center"
                                onClick={onClose}
                                disabled={loading}
                            >
                                <FaBan className="me-2" />
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
