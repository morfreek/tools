import React from 'react';
import { useDialog } from '@c/DialogProvider';
import { Modal, Button, ListGroup, Spinner, Badge } from 'react-bootstrap';
import { FaTrash } from 'react-icons/fa';
import CancelButton from '@c/ui/CancelButton';

export default function LoadConfigModal({ show, onHide, configs, onLoad, onDelete, currentName = null, loading = false }) {
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
                                        onClick={() => onLoad(config)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        {config.name}
                                        {config.name === currentName && <Badge bg="info" className="ms-2">En edición</Badge>}
                                    </div>
                                    <Button
                                        variant="link"
                                        size="sm"
                                        className="accion accion-eliminar"
                                        title="Eliminar configuración"
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
                    <CancelButton onClick={onHide}>Cerrar</CancelButton>
                </Modal.Footer>
            </Modal>

        </>
    );
}
