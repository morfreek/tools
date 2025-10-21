import React, { useEffect, useState } from 'react';
import { Modal, Button, Form, Dropdown } from 'react-bootstrap';
import { FaSave, FaBan, FaChevronDown } from 'react-icons/fa';
import { useToast } from '@c/ToastContext';
import api from '@/api';

export default function ProjectModal({ show, onClose, formData: initialData }) {
    const { showToast } = useToast();
    const [users, setUsers] = useState([]);
    const [formData, setFormData] = useState({
        id: null,
        name: '',
        code: '',
        coordinator_id: '',
        developer_ids: [],
    });

    const editing = formData.id !== null;

    useEffect(() => {
        if (show) {
            setFormData(initialData || {
                id: null,
                name: '',
                code: '',
                coordinator_id: '',
                developer_ids: [],
            });
            fetchUsers();
        }
    }, [show, initialData]);

    const fetchUsers = async () => {
        try {
            const usersRes = await api.get(`/users`);
            setUsers(usersRes.data);
        } catch (err) {
            console.error(err);
            showToast('error', 'Error al cargar usuarios');
        }
    };

    const handleChange = (e) => {
        const { name, value, type, options } = e.target;
        if (type === 'select-multiple') {
            const selected = Array.from(options).filter(o => o.selected).map(o => o.value);
            setFormData(prev => ({ ...prev, [name]: selected }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editing) {
                await api.put(`/projects/${formData.id}`, formData);
                showToast('success', 'Proyecto actualizado');
            } else {
                await api.post(`/projects`, formData);
                showToast('success', 'Proyecto creado');
            }
            onClose();
        } catch (err) {
            console.error('Error al guardar proyecto:', err);
            showToast('error', 'Error al guardar proyecto');
        }
    };

    return (
        <Modal show={show} onHide={onClose} backdrop="static" fullscreen="xl-down">
            <Form onSubmit={handleSubmit}>
                <Modal.Header closeButton>
                    <Modal.Title>{editing ? 'Editar Proyecto' : 'Crear Proyecto'}</Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    <Form.Group className="mb-3">
                        <Form.Label>Nombre</Form.Label>
                        <Form.Control
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Código</Form.Label>
                        <Form.Control
                            type="text"
                            name="code"
                            value={formData.code}
                            onChange={handleChange}
                            required
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Coordinador</Form.Label>
                        <Form.Select
                            name="coordinator_id"
                            value={formData.coordinator_id}
                            onChange={handleChange}
                            required
                        >
                            <option value="">Seleccione coordinador</option>
                            {users.map(user => (
                                <option key={user.id} value={user.id}>{user.name}</option>
                            ))}
                        </Form.Select>
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Desarrolladores</Form.Label>
                        <Dropdown className="w-100">
                            <Dropdown.Toggle className="w-100 text-start bg-white border" variant="light">
                                <div className="d-flex justify-content-between align-items-center w-100">
                                    <span>
                                        {formData.developer_ids.length > 0
                                            ? users
                                                .filter(u => formData.developer_ids.includes(u.id))
                                                .map(u => u.name)
                                                .join(', ')
                                            : 'Seleccione desarrolladores'}
                                    </span>
                                    <FaChevronDown style={{ fontSize: '0.75rem', position: 'relative', top: '-1px' }} />
                                </div>
                            </Dropdown.Toggle>
                            <Dropdown.Menu style={{ maxHeight: '200px', overflowY: 'auto' }} className="w-100">
                                {users.map(user => (
                                    <Dropdown.Item
                                        key={user.id}
                                        as="button"
                                        className="d-flex align-items-center"
                                        onClick={() => {
                                            const selected = formData.developer_ids.includes(user.id)
                                                ? formData.developer_ids.filter(id => id !== user.id)
                                                : [...formData.developer_ids, user.id];
                                            setFormData({ ...formData, developer_ids: selected });
                                        }}
                                    >
                                        <Form.Check
                                            type="checkbox"
                                            className="me-2"
                                            checked={formData.developer_ids.includes(user.id)}
                                            readOnly
                                        />
                                        {user.name}
                                    </Dropdown.Item>
                                ))}
                            </Dropdown.Menu>
                        </Dropdown>
                    </Form.Group>
                </Modal.Body>

                <Modal.Footer>
                    <Button type="submit" variant="success" size="sm" className="d-inline-flex align-items-center">
                        <FaSave className="me-2" />
                        {editing ? 'Actualizar' : 'Crear'}
                    </Button>
                    <Button variant="danger" size="sm" className="d-inline-flex align-items-center" onClick={onClose}>
                        <FaBan className="me-2" />
                        Cancelar
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
}
