import React, { useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';

const SaveConfigModal = ({ show, onHide, onSave, initialName = '' }) => {
    const [name, setName] = useState(initialName);

    const handleSave = () => {
        onSave(name);
        setName('');
    };

    return (
        <Modal show={show} onHide={onHide}>
            <Modal.Header closeButton>
                <Modal.Title>Guardar Configuración</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form.Group>
                    <Form.Label>Nombre de la configuración</Form.Label>
                    <Form.Control
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ej: Proyecto Laravel"
                        autoFocus
                    />
                </Form.Group>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide}>
                    Cancelar
                </Button>
                <Button variant="primary" onClick={handleSave}>
                    Guardar
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default SaveConfigModal;
