import React, { useEffect, useRef, useState } from 'react';
import { Modal } from 'bootstrap';
import { Dropdown } from 'react-bootstrap';
import { FaSave, FaBan, FaChevronDown } from 'react-icons/fa';
import api from '@/api';

export default function ProjectModal({ show, onClose, formData: initialData }) {
    const [users, setUsers] = useState([]);
    const modalRef = useRef(null);
    const bsModal = useRef(null);

    const [formData, setFormData] = useState({
        id: null,
        name: '',
        code: '',
        coordinator_id: '',
        developer_ids: [],
    });

    const editing = formData.id !== null;

    const fetchAlls = async () => {
        try {
            const [usersRes] = await Promise.all([
                api.get(`/users`)
            ]);
            setUsers(usersRes.data);
        } catch (err) {
            console.error(err);
            alert('Error al cargar datos del proyecto');
        }
    };

    useEffect(() => {
        // Bootstrap modal init
        if (modalRef.current && !bsModal.current) {
            bsModal.current = new Modal(modalRef.current, { backdrop: 'static' });
            modalRef.current.addEventListener('hidden.bs.modal', () => {
                onClose();
                setFormData({
                    id: null,
                    name: '',
                    code: '',
                    coordinator_id: '',
                    developer_ids: [],
                });
            });
        }
    }, [onClose]);

    useEffect(() => {
        if (show) {
            setFormData(initialData || {
                id: null,
                name: '',
                code: '',
                coordinator_id: '',
                developer_ids: [],
            });
            fetchAlls()
            bsModal.current?.show();
        } else {
            bsModal.current?.hide();
        }
    }, [show, initialData]);

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
                alert('Proyecto actualizado');
            } else {
                await api.post(`/projects`, formData);
                alert('Proyecto creado');
            }

            bsModal.current.hide();
        } catch (err) {
            console.error('Error al guardar proyecto:', err);
        }
    };

    return (
        <div className="modal fade" tabIndex="-1" aria-hidden="true" ref={modalRef}>
            <div className="modal-dialog">
                <form onSubmit={handleSubmit} className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">{editing ? 'Editar Proyecto' : 'Crear Proyecto'}</h5>
                        <button
                            type="button"
                            className="btn-close"
                            aria-label="Cerrar"
                            onClick={() => bsModal.current.hide()}
                        ></button>
                    </div>

                    <div className="modal-body">
                        <div className="mb-3">
                            <label className="form-label">Nombre</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                className="form-control"
                            />
                        </div>

                        <div className="mb-3">
                            <label className="form-label">Código</label>
                            <input
                                type="text"
                                name="code"
                                value={formData.code}
                                onChange={handleChange}
                                required
                                className="form-control"
                            />
                        </div>

                        <div className="mb-3">
                            <label className="form-label">Coordinador</label>
                            <select
                                name="coordinator_id"
                                value={formData.coordinator_id}
                                onChange={handleChange}
                                required
                                className="form-select"
                            >
                                <option value="">Seleccione coordinador</option>
                                {users.map(user => (
                                    <option key={user.id} value={user.id}>{user.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="mb-3">
                            <label className="form-label">Desarrolladores</label>
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
                                        <FaChevronDown
                                            style={{
                                                fontSize: '0.75rem',
                                                position: 'relative',
                                                top: '-1px',
                                            }}
                                        />
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
                                            <input
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
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="submit" className="btn btn-sm btn-success d-inline-flex align-items-center">
                            <FaSave className="me-2" />
                            {editing ? 'Actualizar' : 'Crear'}
                        </button>
                        <button
                            type="button"
                            className="btn btn-sm btn-danger d-inline-flex align-items-center"
                            onClick={() => bsModal.current.hide()}
                        >
                            <FaBan className="me-2" />
                            Cancelar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
