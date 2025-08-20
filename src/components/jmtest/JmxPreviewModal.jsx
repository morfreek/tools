import React from 'react';
import { Modal, Button } from 'react-bootstrap';
import { FaCopy } from 'react-icons/fa';
import { CodePreview } from '@/utils/CodePreview';

export default function JmxPreviewModal({ 
    show, 
    onHide, 
    jmxXml, 
    onCopyToClipboard, 
    onDownload 
}) {
    return (
        <Modal
            show={show}
            onHide={onHide}
            size="lg"
            dialogClassName="modal-90w"
            fullscreen="lg-down"
        >
            <div style={{ height: '90vh', display: 'flex', flexDirection: 'column' }}>
                <Modal.Header closeButton className="bg-light">
                    <Modal.Title>Vista Previa del Archivo JMX</Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-0" style={{ flex: 1, overflow: 'auto' }}>
                    <CodePreview content={jmxXml} />
                </Modal.Body>
                <Modal.Footer className="bg-light border-top">
                    <div className="me-auto">
                        <Button
                            size="sm"
                            variant="outline-secondary"
                            onClick={onCopyToClipboard}
                            className="d-inline-flex align-items-center"
                        >
                            <FaCopy className="me-1" /> Copiar al Portapapeles
                        </Button>
                    </div>
                    <Button size="sm" variant="primary" onClick={onDownload}>
                        Descargar
                    </Button>
                    <Button size="sm" variant="secondary" onClick={onHide}>
                        Cerrar
                    </Button>
                </Modal.Footer>
            </div>
        </Modal>
    );
}
