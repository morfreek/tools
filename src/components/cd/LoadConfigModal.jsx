import React from 'react';
import { Modal, Button, ListGroup, Spinner } from 'react-bootstrap';
import { FaTrash } from 'react-icons/fa';

export default function LoadConfigModal({ show, onHide, configs, onLoad, onDelete, loading = false }) {
    return (
        <Modal show={show} onHide={onHide} centered>
            <Modal.Header closeButton>
                <Modal.Title>Cargar Configuración</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {loading ? (
                    <div className="text-center p-4">
                        <Spinner animation="border" />
                        <p className="mt-2">Cargando configuraciones...</p>
                    </div>
                ) : configs.length === 0 ? (
                    <p className="text-center">No hay configuraciones guardadas</p>
                ) : (
                    <ListGroup>
                        {configs.map((config, index) => (
                            <ListGroup.Item
                                key={index}
                                className="d-flex justify-content-between align-items-center"
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
                                        onDelete(config.id || index);
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
                <Button variant="secondary" onClick={onHide}>
                    Cerrar
                </Button>
            </Modal.Footer>
        </Modal>
    );
}
