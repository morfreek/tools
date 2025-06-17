import React, { useEffect, useRef, useState } from 'react';
import { Modal } from 'bootstrap';
import { FaSave, FaBan } from 'react-icons/fa';

export default function UserModal({
    show,
    onClose,
    onSubmit,
    editing = false,
    userData = {},
    setUserData
}) {
    const modalRef = useRef(null);
    const bsModal = useRef(null);

    useEffect(() => {
        if (modalRef.current && !bsModal.current) {
            bsModal.current = new Modal(modalRef.current, { backdrop: 'static' });
            modalRef.current.addEventListener('hidden.bs.modal', () => {
                onClose();
            });
        }
    }, [onClose]);

    useEffect(() => {
        if (bsModal.current) {
            if (show) {
                bsModal.current.show();
            } else {
                bsModal.current.hide();
            }
        }
    }, [show]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setUserData(data => ({ ...data, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit();
    };

    return (
        <div
            className="modal fade"
            tabIndex="-1"
            aria-hidden="true"
            ref={modalRef}
        >
            <div className="modal-dialog">
                <form onSubmit={handleSubmit} className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">{editing ? 'Editar Usuario' : 'Crear Usuario'}</h5>
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
                                value={userData.name || ''}
                                onChange={handleChange}
                                required
                                className="form-control"
                            />
                        </div>

                        {/* Agrega aquí más campos que necesites para usuarios */}
                    </div>
                    <div className="modal-footer">
                        <button type="submit" className="btn btn-sm btn-success d-inline-flex align-items-center">
                            <FaSave className="me-2"/>
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
