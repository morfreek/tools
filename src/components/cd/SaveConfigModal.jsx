import React, { useState, useEffect } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import CancelButton from '@c/ui/CancelButton';

export default function SaveConfigModal({ show, onHide, onSave, loading = false, defaultName = '', title = 'Guardar configuración' }) {
    const [configName, setConfigName] = useState('');

    // Cada apertura parte del nombre sugerido, sin arrastrar lo escrito antes
    useEffect(() => {
        if (show) setConfigName(defaultName);
    }, [show, defaultName]);

    const handleSave = () => onSave(configName);

    return (
        <Modal show={show} onHide={onHide} centered>
            <Modal.Header closeButton>
                <Modal.Title>{title}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form.Group>
                    <Form.Label>Nombre de la configuración</Form.Label>
                    <Form.Control
                        type="text"
                        value={configName}
                        onChange={(e) => setConfigName(e.target.value)}
                        placeholder="Ej: Configuración de Producción"
                        disabled={loading}
                    />
                </Form.Group>
            </Modal.Body>
            <Modal.Footer>
                <CancelButton onClick={onHide} disabled={loading} />
                <Button size="sm" onClick={handleSave} disabled={!configName.trim() || loading}>
                    {loading ? 'Guardando…' : 'Guardar configuración'}
                </Button>
            </Modal.Footer>
        </Modal>
    );
}
