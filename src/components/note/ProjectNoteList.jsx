import React, { useEffect, useState, useRef } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { FaEdit, FaTrash, FaChevronLeft, FaChevronRight, FaPlus } from 'react-icons/fa';
import {
    Button,
    Placeholder,
    Container,
    Card,
    CloseButton
} from 'react-bootstrap';
import { useToast } from '@c/ToastContext';
import { useDialog } from '@c/DialogProvider';
import { listNotes, deleteNote } from '@/services/notes.service';
import ProjectNoteModal from './ProjectNoteModal';

export default function ProjectNoteList({
    projectId,
    show,
    onClose,
    className = '',
    containerStyle = {},
    refreshKey
}) {
    const { showToast } = useToast();
    const dialog = useDialog();
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedNote, setSelectedNote] = useState(null);
    const [currentNoteIndex, setCurrentNoteIndex] = useState(0);
    const sidebarRef = useRef(null);

    const fetchNotes = async () => {
        setLoading(true);
        try {
            const response = await listNotes(projectId);
            setNotes(response.sort((a, b) =>
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

    const handleEdit = (note) => {
        setSelectedNote(note);
        setShowEditModal(true);
    };

    const handleDelete = async (noteId) => {
        const ok = await dialog.confirm({
            title: 'Eliminar nota',
            message: `¿Eliminar la nota ${currentNoteIndex + 1} de ${notes.length}? Esta acción no se puede deshacer.`,
            acceptText: 'Eliminar',
            danger: true,
        });
        if (!ok) return;

        try {
            await deleteNote(projectId, noteId);
            showToast('success', 'Nota eliminada');
            fetchNotes();
        } catch {
            showToast('error', 'Error al eliminar la nota');
        }
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

    const isModal = defaultContainerStyle.position === 'fixed';

    if (!show) return null;

    return (
        <>
            {isModal && (
                <div
                    className="velo position-fixed top-0 start-0 w-100 h-100"
                    onClick={onClose}
                />
            )}
            <Card
                className={`h-100 border-0 ${className} ${isModal && 'rounded-0'}`}
                style={defaultContainerStyle}
                ref={sidebarRef}
            >
                <Card.Header>
                    <div className="d-flex justify-content-between align-items-center">
                        <Card.Title className="h5 mb-0">Notas del proyecto</Card.Title>
                        <div className="d-flex align-items-center gap-2">
                            <Button
                                size="sm"
                                className="d-inline-flex align-items-center"
                                onClick={() => setShowCreateModal(true)}
                            >
                                <FaPlus className="me-1" /> Nueva nota
                            </Button>
                            {typeof onClose === 'function' && (
                                <CloseButton onClick={onClose} />
                            )}
                        </div>
                    </div>
                    {!loading && notes.length > 0 && (
                        <Container fluid className="px-0 mt-3">
                            <div className="d-flex justify-content-between align-items-start">
                                <small className="text-muted">
                                    {format(new Date(notes[currentNoteIndex].created_at),
                                        "d 'de' MMMM 'de' yyyy, HH:mm",
                                        { locale: es })}
                                </small>
                                <div className="text-nowrap">
                                    <Button
                                        variant="link"
                                        size="sm"
                                        className="accion accion-editar"
                                        title="Editar nota"
                                        onClick={() => handleEdit(notes[currentNoteIndex])}
                                    >
                                        <FaEdit />
                                    </Button>
                                    <Button
                                        variant="link"
                                        size="sm"
                                        className="accion accion-eliminar"
                                        title="Eliminar nota"
                                        onClick={() => handleDelete(notes[currentNoteIndex].id)}
                                    >
                                        <FaTrash />
                                    </Button>
                                </div>
                            </div>
                        </Container>
                    )}
                </Card.Header>

                <Card.Body className="overflow-auto p-0">
                    {loading ? (
                        <Container fluid className="p-3">
                            <Placeholder animation="glow">
                                <Placeholder xs={12} className="mb-2" />
                                <Placeholder xs={12} className="mb-2" />
                            </Placeholder>
                        </Container>
                    ) : notes.length === 0 ? (
                        <Container fluid className="p-3 text-muted text-center">
                            No hay notas registradas
                        </Container>
                    ) : (
                        <Container fluid className="p-3">
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
                        </Container>
                    )}
                </Card.Body>

                {!loading && notes.length > 0 && (
                    <Card.Footer>
                        <Container fluid className="px-0">
                            <div className="d-flex justify-content-between align-items-center">
                                <Button
                                    className="d-inline-flex align-items-center"
                                    variant="outline-secondary"
                                    size="sm"
                                    onClick={handlePrev}
                                    disabled={notes.length <= 1 || currentNoteIndex === 0}
                                >
                                    <FaChevronLeft /> Anterior
                                </Button>
                                <small className="text-muted">
                                    {currentNoteIndex + 1} de {notes.length}
                                </small>
                                <Button
                                    className="d-inline-flex align-items-center"
                                    variant="outline-secondary"
                                    size="sm"
                                    onClick={handleNext}
                                    disabled={notes.length <= 1 || currentNoteIndex === notes.length - 1}
                                >
                                    Siguiente <FaChevronRight />
                                </Button>
                            </div>
                        </Container>
                    </Card.Footer>
                )}
            </Card>
            <ProjectNoteModal
                show={showEditModal || showCreateModal}
                onClose={() => {
                    setShowEditModal(false);
                    setShowCreateModal(false);
                    setSelectedNote(null);
                }}
                onSaved={fetchNotes}
                projectId={projectId}
                note={selectedNote}
            />
        </>
    );
}
