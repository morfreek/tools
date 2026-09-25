import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Accordion, Row, Col } from 'react-bootstrap';
import Editor from 'react-simple-wysiwyg';
import { STATUS_OPTIONS } from '@u/Constants';
import { useDialog } from '@c/DialogProvider';
import CancelButton from '@c/ui/CancelButton';
import { hasText } from '@u/html';

export default function ProjectReviewModal({ visible, checklist, form, setForm, onClose, onSave }) {
    const [initialForm, setInitialForm] = useState(null);
    const [hasChanges, setHasChanges] = useState(false);
    const [triedSave, setTriedSave] = useState(false);
    const dialog = useDialog();
    const missingNote = !hasText(form.general_notes);

    // Guardar estado inicial cuando se abre el modal
    useEffect(() => {
        if (visible && form) {
            // Asegurar que guardamos una copia profunda del estado inicial
            setInitialForm(JSON.parse(JSON.stringify(form)));
            setHasChanges(false);
            setTriedSave(false);
        }
    }, [visible]);

    // Detectar cambios en el formulario
    useEffect(() => {
        if (initialForm && form && visible) {
            // Comparar cada campo específicamente
            const hasDateChanged = form.applied_at !== initialForm.applied_at;
            const hasNotesChanged = (form.general_notes || '') !== (initialForm.general_notes || '');
            const hasChecklistToggled = Boolean(form.evaluateChecklist) !== Boolean(initialForm.evaluateChecklist);

            // Comparar resultados
            const hasResultsChanged = form.results.length !== initialForm.results.length ||
                form.results.some(result => {
                    const initialResult = initialForm.results.find(r => r.point_id === result.point_id);
                    if (!initialResult) return true;
                    return result.status !== initialResult.status ||
                        result.observation !== initialResult.observation;
                });

            setHasChanges(hasDateChanged || hasNotesChanged || hasChecklistToggled || (form.evaluateChecklist && hasResultsChanged));
        }
    }, [form, initialForm, visible]);

    const handleClose = () => {
        if (hasChanges) {
            dialog.confirm({
                title: 'Descartar cambios',
                message: 'La revisión tiene cambios sin guardar. ¿Cerrar y descartarlos?',
                acceptText: 'Descartar',
                cancelText: 'Seguir editando',
                danger: true,
            }).then((ok) => {
                if (!ok) return;
                setHasChanges(false);
                onClose();
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

    // La observación general es obligatoria; el checklist, opcional
    const handleSave = () => {
        setTriedSave(true);
        if (missingNote) return;
        onSave();
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
        <Modal show={visible} onHide={handleClose} size="xl" scrollable fullscreen="xl-down">
            <Modal.Header closeButton>
                <Modal.Title>
                    Nueva revisión técnica
                    {hasChanges && <span className="text-warning ms-2">*</span>}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form>
                    <Form.Group className="mb-3">
                        <Form.Label htmlFor="revision-fecha">Fecha</Form.Label>
                        <Form.Control
                            id="revision-fecha"
                            type="date"
                            value={form.applied_at}
                            onChange={e => setForm({ ...form, applied_at: e.target.value })}
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Observación general <span className="sub fw-normal">(obligatoria)</span></Form.Label>
                        <div className={triedSave && missingNote ? 'editor-invalido' : undefined}>
                            <Editor
                                containerProps={{
                                    style: {
                                        resize: 'vertical',
                                        minHeight: '200px',
                                        border: '1px solid var(--borde)',
                                        borderRadius: '0.375rem'
                                    }
                                }}
                                value={form.general_notes || ''}
                                onChange={(e) => updateGeneralNotes(e.target.value)}
                                placeholder="Qué se revisó, hallazgos y acuerdos con el equipo"
                            />
                        </div>
                        {triedSave && missingNote
                            ? <div className="aviso aviso-rojo mx-0 mt-2" role="alert">Escribe la observación general: es el registro de la revisión.</div>
                            : <Form.Text>Es lo que se muestra en Seguimiento.</Form.Text>}
                    </Form.Group>

                    <Form.Check
                        type="switch"
                        id="revision-evaluar-checklist"
                        className="mb-1"
                        label="Evaluar checklist en esta revisión"
                        checked={Boolean(form.evaluateChecklist)}
                        onChange={(e) => setForm(prev => ({ ...prev, evaluateChecklist: e.target.checked }))}
                    />
                    <Form.Text className="d-block mb-3">
                        Opcional. Se precarga con la última revisión que evaluó el checklist; solo se guardan los puntos con estado u observación.
                    </Form.Text>

                    {form.evaluateChecklist && (
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
                    )}
                </Form>
            </Modal.Body>
            <Modal.Footer>
                {hasChanges && (
                    <small className="text-warning me-auto">
                        Hay cambios sin guardar
                    </small>
                )}
                <CancelButton onClick={handleClose} />
                <Button size="sm" onClick={handleSave}>
                    Guardar revisión
                </Button>
            </Modal.Footer>
        </Modal>
    );
}
