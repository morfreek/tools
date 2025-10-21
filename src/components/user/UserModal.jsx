import React from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { FaSave, FaBan } from 'react-icons/fa';

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
        <Modal show={show} onHide={onClose} backdrop="static" fullscreen="xl-down">
            <Form onSubmit={handleSubmit}>
                <Modal.Header closeButton>
                    <Modal.Title>{editing ? 'Editar Usuario' : 'Crear Usuario'}</Modal.Title>
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

                    {/* Agrega aquí más campos que necesites para usuarios */}
                </Modal.Body>
                <Modal.Footer>
                    <Button 
                        type="submit" 
                        variant="success" 
                        size="sm" 
                        className="d-inline-flex align-items-center"
                    >
                        <FaSave className="me-2"/>
                        {editing ? 'Actualizar' : 'Crear'}
                    </Button>
                    <Button
                        variant="danger"
                        size="sm"
                        className="d-inline-flex align-items-center"
                        onClick={onClose}
                    >
                        <FaBan className="me-2" />
                        Cancelar
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
}
