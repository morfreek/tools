import React, { useState } from 'react';
import { Modal, Button, ListGroup, Spinner } from 'react-bootstrap';
import { FaTrash } from 'react-icons/fa';

export default function LoadConfigModal({ show, onHide, configs, onLoad, onDelete, loading = false }) {
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);
    const [configToDelete, setConfigToDelete] = useState(null);

    const handleDeleteClick = (configName) => {
        setConfigToDelete(configName);
        setShowConfirmDelete(true);
    };

    const handleConfirmDelete = () => {
        if (configToDelete) {
            onDelete(configToDelete);
        }
        setShowConfirmDelete(false);
        setConfigToDelete(null);
    };

    const handleCancelDelete = () => {
        setShowConfirmDelete(false);
        setConfigToDelete(null);
    };

    return (
        <>
            <Modal show={show} onHide={onHide} centered size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Cargar Configuración</Modal.Title>
                </Modal.Header>
                <Modal.Body style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    {loading ? (
                        <div className="text-center p-4">
                            <Spinner animation="border" />
                            <p className="mt-2">Cargando configuraciones...</p>
                        </div>
                    ) : configs.length === 0 ? (
                        <p className="text-center">No hay configuraciones guardadas</p>
                    ) : (
                        <ListGroup>
                            {configs
                                .sort((a, b) => a.name.localeCompare(b.name))
                                .map((config, index) => (
                                <ListGroup.Item
                                    key={index}
                                    className="d-flex justify-content-between align-items-center list-group-item-action"
                                >
                                    <div 
                                        className="flex-grow-1 cursor-pointer"
                                        onClick={() => onLoad(config.config)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <div>{config.name}</div>
                                        <small className="text-muted">
                                            {/* {new Date(config.savedAt).toLocaleString()} */}
                                        </small>
                                    </div>
                                    <Button
                                        variant="outline-danger"
                                        size="sm"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteClick(config.name);
                                        }}
                                        disabled={loading}
                                    >
                                        <FaTrash />
                                    </Button>
                                </ListGroup.Item>
                            ))}
                        </ListGroup>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={onHide} size="sm">
                        Cerrar
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Modal de confirmación de eliminación */}
            <Modal show={showConfirmDelete} onHide={handleCancelDelete} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Confirmar Eliminación</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>¿Estás seguro de que deseas eliminar la configuración "{configToDelete}"?</p>
                    <p className="text-muted">Esta acción no se puede deshacer.</p>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCancelDelete} size="sm">
                        Cancelar
                    </Button>
                    <Button variant="danger" onClick={handleConfirmDelete} size="sm">
                        Eliminar
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
}
