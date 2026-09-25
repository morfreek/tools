// src/components/note/NoteModal.jsx
import React, { useEffect, useState } from 'react';
import { Modal, Button } from 'react-bootstrap';
import Editor from 'react-simple-wysiwyg';
import { useToast } from '@c/ToastContext';
import { useDialog } from '@c/DialogProvider';
import { createNote, updateNote } from '@/services/notes.service';
import CancelButton from '@c/ui/CancelButton';

export default function ProjectNoteModal({ show, onClose, onSaved, projectId, note }) {
    const [content, setContent] = useState(note?.detail || '');
    const [loading, setLoading] = useState(false);
    const [initialContent] = useState(note?.detail || '');
    const { showToast } = useToast();
    const dialog = useDialog();

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
                await updateNote(projectId, note.id, content);
            } else {
                await createNote(projectId, content);
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
            dialog.confirm({
                title: 'Descartar cambios',
                message: 'La nota tiene cambios sin guardar. ¿Cerrar y descartarlos?',
                acceptText: 'Descartar',
                cancelText: 'Seguir editando',
                danger: true,
            }).then((ok) => ok && onClose());
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
                <CancelButton onClick={handleClose} disabled={loading} />
                <Button size="sm" onClick={handleSave} disabled={loading}>
                    {loading ? 'Guardando…' : note ? 'Actualizar nota' : 'Crear nota'}
                </Button>
            </Modal.Footer>
        </Modal>
    );
}
