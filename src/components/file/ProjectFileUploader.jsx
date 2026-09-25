import React, { useRef, useState } from 'react';
import { Modal, Button, Form, ListGroup } from 'react-bootstrap';
import { uploadFiles } from '@/services/files.service';
import { useToast } from '@c/ToastContext';
import CancelButton from '@c/ui/CancelButton';

const ProjectFileUploader = ({ projectId, show, onClose, onUploadComplete }) => {
    const fileInput = useRef(null);
    const { showToast } = useToast();
    const [selectedFiles, setSelectedFiles] = useState([]);

    const handleFileSelect = (event) => {
        setSelectedFiles(Array.from(event.target.files));
    };

    const formatFileSize = (bytes) => {
        if (bytes >= 1024 * 1024) {
            return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
        }
        return `${(bytes / 1024).toFixed(2)} KB`;
    };

    const handleUpload = async () => {
        if (!selectedFiles.length) return;

        try {
            await uploadFiles(projectId, selectedFiles);
            showToast('success', 'Archivos subidos correctamente');
            setSelectedFiles([]);
            if (fileInput.current) fileInput.current.value = '';
            onUploadComplete?.();
            onClose();
        } catch (error) {
            showToast('error', 'Error al subir archivos');
        }
    };

    const handleClose = () => {
        setSelectedFiles([]);
        if (fileInput.current) fileInput.current.value = '';
        onClose();
    };

    return (
        <Modal show={show} onHide={handleClose} fullscreen="xl-down">
            <Modal.Header closeButton>
                <Modal.Title>Subir archivos</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form.Control
                    type="file"
                    ref={fileInput}
                    onChange={handleFileSelect}
                    multiple
                    className="mb-3"
                />
                {selectedFiles.length > 0 && (
                    <div className="mt-3">
                        <h6>Archivos seleccionados:</h6>
                        <ListGroup>
                            {selectedFiles.map((file, index) => (
                                <ListGroup.Item key={index}>
                                    <div className="d-flex justify-content-between align-items-center">
                                        <span>{file.name}</span>
                                        <small className="text-muted">
                                            {formatFileSize(file.size)}
                                        </small>
                                    </div>
                                    <small className="text-muted d-block">
                                        Tipo: {file.type || 'Desconocido'}
                                    </small>
                                </ListGroup.Item>
                            ))}
                        </ListGroup>
                    </div>
                )}
            </Modal.Body>
            <Modal.Footer>
                <CancelButton onClick={handleClose} />
                <Button size="sm" onClick={handleUpload} disabled={selectedFiles.length === 0}>
                    Subir archivos
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default ProjectFileUploader;
