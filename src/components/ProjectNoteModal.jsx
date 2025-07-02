// src/components/NoteModal.jsx
import React, { useEffect, useState } from 'react';
import { Modal, Button } from 'react-bootstrap';
import Editor from 'react-simple-wysiwyg';
import { FaSave, FaBan } from 'react-icons/fa';
import { useToast } from './ToastContext'; // Importa el contexto de Toast
import { useConfirm } from './ConfirmContext'; // Importa el contexto de Confirm
import api from '@/api';

export default function ProjectNoteModal({ show, onClose, onSaved, projectId, note }) {
    const [content, setContent] = useState(note?.detail || '');
    const [loading, setLoading] = useState(false); // Nuevo estado
    const [initialContent] = useState(note?.detail || ''); // Estado inicial del contenido
    const { showToast } = useToast(); // Usa el contexto de Toast
    const { showConfirm } = useConfirm(); // Usa el contexto de Confirm

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
            await onSaved(); // Esperamos a que se complete la actualización
            onClose(); // Cerramos el modal después de que todo esté listo
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
        <Modal show={show} onHide={handleClose} size="xl" centered>
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
