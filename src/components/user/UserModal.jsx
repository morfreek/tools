import React from 'react';
import { Modal, Button, Form } from 'react-bootstrap';

export default function UserModal({
    show,
    onClose,
    onSubmit,
    editing = false,
    userData = {},
    setUserData
}) {
    const handleChange = (e) => {
        const { name, value } = e.target;
        setUserData(data => ({ ...data, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit();
    };

    return (
        <Modal show={show} onHide={onClose} backdrop="static" centered>
            <Form onSubmit={handleSubmit}>
                <Modal.Header closeButton>
                    <Modal.Title>{editing ? 'Editar usuario' : 'Nuevo usuario'}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form.Group className="mb-3">
                        <Form.Label>Nombre</Form.Label>
                        <Form.Control
                            type="text"
                            name="name"
                            value={userData.name || ''}
                            onChange={handleChange}
                            required
                        />
                    </Form.Group>

                </Modal.Body>
                <Modal.Footer>
                    <Button variant="link" className="text-secondary" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button type="submit">
                        {editing ? 'Actualizar' : 'Crear'}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
}
