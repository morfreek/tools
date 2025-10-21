// src/components/note/NoteModal.jsx
import React, { useEffect, useState } from 'react';
import { Modal, Button } from 'react-bootstrap';
import Editor from 'react-simple-wysiwyg';
import { FaSave, FaBan } from 'react-icons/fa';
import { useToast } from '@c/ToastContext';
import { useConfirm } from '@c/ConfirmContext';
import api from '@/api';

export default function ProjectNoteModal({ show, onClose, onSaved, projectId, note }) {
    const [content, setContent] = useState(note?.detail || '');
    const [loading, setLoading] = useState(false);
    const [initialContent] = useState(note?.detail || '');
    const { showToast } = useToast();
    const { showConfirm } = useConfirm();

    useEffect(() => {
        setContent(note?.detail || '');
        setLoading(false);
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
            await onSaved();
            onClose();
        } catch (err) {
            console.error('Error al guardar nota', err);
            showToast('error', 'Error al guardar nota.');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        const hasUnsavedChanges = content !== initialContent && content.trim() !== '';
        
        if (hasUnsavedChanges) {
            showConfirm({
                title: "Confirmar cierre",
                message: "Hay cambios sin guardar. ¿Desea cerrar y perder los cambios?",
                confirmText: "Aceptar",
                cancelText: "Cerrar",
                confirmButtonClass: "btn-danger",
                onConfirm: () => onClose()
            });
        } else {
            onClose();
        }
    };

    return (
        <Modal show={show} onHide={handleClose} size="xl" centered fullscreen="xl-down">
            <Modal.Header closeButton>
                <Modal.Title>{note ? 'Editar Nota' : 'Nueva Nota'}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Editor
                    containerProps={{ style: { resize: 'vertical', minHeight: '300px' } }}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    disabled={loading}
                />
            </Modal.Body>
            <Modal.Footer>
                <Button
                    variant="success"
                    size="sm"
                    className="d-inline-flex align-items-center"
                    onClick={handleSave}
                    disabled={loading}
                >
                    <FaSave className="me-2" />
                    {note ? 'Actualizar' : 'Crear'}
                </Button>
                <Button
                    variant="danger"
                    size="sm"
                    className="d-inline-flex align-items-center"
                    onClick={handleClose}
                    disabled={loading}
                >
                    <FaBan className="me-2" />
                    Cancelar
                </Button>
            </Modal.Footer>
        </Modal>
    );
}
