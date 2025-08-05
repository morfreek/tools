import React, { useState, useEffect } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';

export default function SaveConfigModal({ show, onHide, onSave, loading = false, defaultName = '' }) {
    const [configName, setConfigName] = useState('');

    useEffect(() => {
        if (show && defaultName) {
            setConfigName(defaultName);
        }
    }, [show, defaultName]);

    const handleSave = () => {
        onSave(configName);
        setConfigName('');
    };

    return (
        <Modal show={show} onHide={onHide} centered>
            <Modal.Header closeButton>
                <Modal.Title>Guardar Configuración</Modal.Title>
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
                <Button variant="secondary" onClick={onHide} disabled={loading} size="sm">
                    Cancelar
                </Button>
                <Button 
                    variant="primary" 
                    onClick={handleSave} 
                    disabled={!configName.trim() || loading}
                    size="sm"
                >
                    {loading ? 'Guardando...' : 'Guardar'}
                </Button>
            </Modal.Footer>
        </Modal>
    );
}
