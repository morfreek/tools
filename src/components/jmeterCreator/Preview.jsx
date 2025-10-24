import React from 'react';
import { Modal, Button, Form } from 'react-bootstrap';

const Preview = ({ show, onClose, jmx, onDownload, onCopyXml }) => (
    <Modal show={show} onHide={onClose} fullscreen scrollable>
        <Modal.Header closeButton>
            <Modal.Title>Previsualización .jmx</Modal.Title>
        </Modal.Header>
        <Modal.Body className="d-flex flex-column">
            <Form.Control
                as="textarea"
                readOnly
                value={jmx}
                size="sm"
                className="flex-grow-1"
                style={{ minHeight: 0, resize: 'none', fontFamily: 'monospace' }}
            />
        </Modal.Body>
        <Modal.Footer>
            <Button variant="secondary" size="sm" onClick={onClose}>
                Cerrar
            </Button>
            <Button variant="outline-secondary" size="sm" onClick={onCopyXml}>
                Copiar XML
            </Button>
            <Button variant="success" size="sm" onClick={onDownload}>
                Descargar .jmx
            </Button>
        </Modal.Footer>
    </Modal>
);

export default Preview;
