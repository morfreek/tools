import React, { useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';

export default function SaveConfigModal({ show, onHide, onSave, loading = false }) {
    const [configName, setConfigName] = useState('');

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
                <Button variant="secondary" onClick={onHide} disabled={loading}>
                    Cancelar
                </Button>
                <Button 
                    variant="primary" 
                    onClick={handleSave} 
                    disabled={!configName.trim() || loading}
                >
                    {loading ? 'Guardando...' : 'Guardar'}
                </Button>
            </Modal.Footer>
        </Modal>
    );
}
