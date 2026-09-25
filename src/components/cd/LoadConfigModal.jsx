import React from 'react';
import { useDialog } from '@c/DialogProvider';
import { Modal, Button, ListGroup, Spinner } from 'react-bootstrap';
import { FaTrash } from 'react-icons/fa';

export default function LoadConfigModal({ show, onHide, configs, onLoad, onDelete, loading = false }) {
    const dialog = useDialog();

    const handleDeleteClick = async (configName) => {
        const ok = await dialog.confirm({
            title: 'Eliminar configuración',
            message: `¿Eliminar la configuración "${configName}"? Esta acción no se puede deshacer.`,
            acceptText: 'Eliminar',
            danger: true,
        });
        if (ok) onDelete(configName);
    };

    return (
        <>
            <Modal show={show} onHide={onHide} centered size="xl" fullscreen="xl-down">
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

        </>
    );
}
