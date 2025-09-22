import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Accordion, Row, Col } from 'react-bootstrap';
import { FaSave, FaBan } from 'react-icons/fa';
import { STATUS_OPTIONS } from '@/utils/Constants';
import Editor from 'react-simple-wysiwyg';
import { useConfirm } from '@/components/ConfirmContext';

export default function ProjectReviewModal({ visible, checklist, form, setForm, onClose, onSave }) {
    const [initialForm, setInitialForm] = useState(null);
    const [hasChanges, setHasChanges] = useState(false);
    const { showConfirm } = useConfirm();

    // Guardar estado inicial cuando se abre el modal
    useEffect(() => {
        if (visible && form) {
            // Asegurar que guardamos una copia profunda del estado inicial
            setInitialForm(JSON.parse(JSON.stringify(form)));
            setHasChanges(false);
        }
    }, [visible]);

    // Detectar cambios en el formulario
    useEffect(() => {
        if (initialForm && form && visible) {
            // Comparar cada campo específicamente
            const hasDateChanged = form.applied_at !== initialForm.applied_at;
            const hasNotesChanged = (form.general_notes || '') !== (initialForm.general_notes || '');

            // Comparar resultados
            const hasResultsChanged = form.results.length !== initialForm.results.length ||
                form.results.some(result => {
                    const initialResult = initialForm.results.find(r => r.point_id === result.point_id);
                    if (!initialResult) return true;
                    return result.status !== initialResult.status ||
                        result.observation !== initialResult.observation;
                });

            setHasChanges(hasDateChanged || hasNotesChanged || hasResultsChanged);
        }
    }, [form, initialForm, visible]);

    const handleClose = () => {
        if (hasChanges) {
            showConfirm({
                title: 'Cambios sin guardar',
                message: '¿Estás seguro de que quieres cerrar? Se perderán los cambios no guardados.',
                confirmText: 'Sí, cerrar',
                cancelText: 'Cancelar',
                confirmButtonClass: 'btn-danger',
                onConfirm: () => {
                    setHasChanges(false);
                    onClose();
                }
            });
        } else {
            onClose();
        }
    };

    const updateGeneralNotes = (value) => {
        setForm(prev => ({
            ...prev,
            general_notes: value
        }));
    };

    const updateResult = (point_id, field, value) => {
        setForm(prev => ({
            ...prev,
            results: prev.results.map(r =>
                r.point_id === point_id ? { ...r, [field]: value } : r
            )
        }));
    };

    return (
        <Modal show={visible} onHide={handleClose} size="xl" scrollable>
            <Modal.Header closeButton>
                <Modal.Title>
                    Nueva Revisión Técnica
                    {hasChanges && <span className="text-warning ms-2">*</span>}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form>
                    <Form.Group className="mb-3">
                        <Form.Label>Fecha:</Form.Label>
                        <Form.Control
                            type="date"
                            value={form.applied_at}
                            onChange={e => setForm({ ...form, applied_at: e.target.value })}
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Notas Generales:</Form.Label>
                        <Editor
                            containerProps={{
                                style: {
                                    resize: 'vertical',
                                    minHeight: '200px',
                                    border: '1px solid #ced4da',
                                    borderRadius: '0.375rem'
                                }
                            }}
                            value={form.general_notes || ''}
                            onChange={(e) => updateGeneralNotes(e.target.value)}
                            placeholder="Agregue notas generales sobre la revisión..."
                        />
                    </Form.Group>

                    <Accordion defaultActiveKey="0" className="mb-3">
                        {checklist.map((aspect, index) => (
                            <Accordion.Item key={aspect.id} eventKey={index.toString()}>
                                <Accordion.Header>{aspect.name}</Accordion.Header>
                                <Accordion.Body>
                                    {aspect.points.map(point => {
                                        const result = form.results.find(r => r.point_id === point.id) || { status: '', observation: '' };
                                        return (
                                            <Form.Group key={point.id} className="mb-4 border-bottom pb-2">
                                                <Form.Label className="fw-bold">{point.name}</Form.Label>
                                                <Row className="mb-2">
                                                    <Col md={4}>
                                                        <Form.Select
                                                            value={result.status}
                                                            onChange={(e) => updateResult(point.id, 'status', e.target.value)}
                                                        >
                                                            <option value="">Seleccione estado</option>
                                                            {STATUS_OPTIONS.map((status) => (
                                                                <option key={status} value={status}>
                                                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                                                </option>
                                                            ))}
                                                        </Form.Select>
                                                    </Col>
                                                    <Col md={8}>
                                                        <Form.Control
                                                            as="textarea"
                                                            rows={2}
                                                            placeholder="Observación"
                                                            value={result.observation}
                                                            onChange={(e) => updateResult(point.id, 'observation', e.target.value)}
                                                        />
                                                    </Col>
                                                </Row>
                                            </Form.Group>
                                        );
                                    })}
                                </Accordion.Body>
                            </Accordion.Item>
                        ))}
                    </Accordion>
                </Form>
            </Modal.Body>
            <Modal.Footer>
                {hasChanges && (
                    <small className="text-warning me-auto">
                        * Hay cambios sin guardar
                    </small>
                )}
                <Button
                    variant="success"
                    size="sm"
                    className="d-inline-flex align-items-center"
                    onClick={onSave}
                >
                    <FaSave className="me-2" />
                    Guardar Revisión
                </Button>
                <Button
                    variant="danger"
                    size="sm"
                    className="d-inline-flex align-items-center"
                    onClick={handleClose}
                >
                    <FaBan className="me-2" />
                    Cancelar
                </Button>
            </Modal.Footer>
        </Modal>
    );
}
