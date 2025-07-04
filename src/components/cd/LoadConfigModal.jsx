import React from 'react';
import { Modal, Button, ListGroup } from 'react-bootstrap';

const LoadConfigModal = ({ show, onHide, configs, onLoad, onDelete }) => (
    <Modal show={show} onHide={onHide}>
        <Modal.Header closeButton>
            <Modal.Title>Cargar Configuración</Modal.Title>
        </Modal.Header>
        <Modal.Body>
            <ListGroup>
                {configs.map((saved, index) => (
                    <ListGroup.Item
                        key={index}
                        className="d-flex justify-content-between align-items-center"
                    >
                        <span>{saved.name}</span>
                        <div>
                            <Button
                                size="sm"
                                variant="primary"
                                className="me-2"
                                onClick={() => onLoad(saved.config)}
                            >
                                Cargar
                            </Button>
                            <Button
                                size="sm"
                                variant="danger"
                                onClick={() => onDelete(index)}
                            >
                                Eliminar
                            </Button>
                        </div>
                    </ListGroup.Item>
                ))}
            </ListGroup>
            {configs.length === 0 && (
                <p className="text-center text-muted my-3">No hay configuraciones guardadas</p>
            )}
        </Modal.Body>
    </Modal>
);

export default LoadConfigModal;
