import React from 'react';
import { Modal, Button, ListGroup, Badge } from 'react-bootstrap';
import { FaCopy } from 'react-icons/fa';

export default function UrlsPreviewModal({ 
    show, 
    onHide, 
    params, 
    generatedUrls, 
    onCopyToExcel 
}) {
    return (
        <Modal
            show={show}
            onHide={onHide}
            size="lg"
            scrollable
        >
            <Modal.Header closeButton className="bg-light">
                <Modal.Title>URLs que serán testeadas</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <div className="mb-3 p-3 bg-light rounded">
                    <h6 className="text-primary mb-2">Configuración del test:</h6>
                    <small className="text-muted">
                        • Usuarios concurrentes: <strong>{params.threads}</strong><br/>
                        • Duración: <strong>{params.duration} segundos</strong><br/>
                        • Throughput: <strong>{params.throughput} requests/minuto</strong><br/>
                        • Servidor: <strong>{params.protocol}://{params.server}{params.port ? ':' + params.port : ''}</strong><br/>
                        • Endpoints: <strong>{generatedUrls.length} requests HTTP</strong>
                    </small>
                </div>
                
                <div className="mb-3">
                    <small className="text-muted">
                        Lista de endpoints que serán testeados:
                    </small>
                </div>
                
                <ListGroup>
                    {generatedUrls.map(({method, path, fullUrl, originalUri}, index) => (
                        <ListGroup.Item key={index} className="py-2">
                            <div className="d-flex align-items-center">
                                <Badge 
                                    bg={
                                        method === 'GET' ? 'success' : 
                                        method === 'POST' ? 'primary' : 
                                        method === 'PUT' ? 'warning' : 
                                        method === 'DELETE' ? 'danger' : 'secondary'
                                    }
                                    className="me-2"
                                    style={{ minWidth: '60px' }}
                                >
                                    {method}
                                </Badge>
                                <div className="flex-grow-1">
                                    <div className="fw-bold small">{method} {path}</div>
                                    <div className="text-muted small">{fullUrl}</div>
                                    {originalUri !== path.replace(params.prefix || '', '') && (
                                        <div className="text-muted small">
                                            Ruta original: {originalUri}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </ListGroup.Item>
                    ))}
                </ListGroup>
            </Modal.Body>
            <Modal.Footer className="bg-light">
                <div className="me-auto">
                    <Button
                        size="sm"
                        variant="outline-secondary"
                        onClick={onCopyToExcel}
                        className="d-inline-flex align-items-center"
                    >
                        <FaCopy className="me-1" /> Copiar para Excel
                    </Button>
                </div>
                <Button size="sm" variant="secondary" onClick={onHide}>
                    Cerrar
                </Button>
            </Modal.Footer>
        </Modal>
    );
}
