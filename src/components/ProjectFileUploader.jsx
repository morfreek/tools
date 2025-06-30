import React, { useRef, useState } from 'react';
import { Modal, Button } from 'react-bootstrap';
import { FaSave, FaBan } from 'react-icons/fa';
import api from '@/api';
import { useToast } from './ToastContext';

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

        const formData = new FormData();
        selectedFiles.forEach(file => {
            formData.append('files[]', file);
        });

        try {
            await api.post(`/projects/${projectId}/files`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
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
        <Modal show={show} onHide={handleClose}>
            <Modal.Header closeButton>
                <Modal.Title>Subir archivos</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <input
                    type="file"
                    ref={fileInput}
                    onChange={handleFileSelect}
                    multiple
                    className="form-control mb-3"
                />
                {selectedFiles.length > 0 && (
                    <div className="mt-3">
                        <h6>Archivos seleccionados:</h6>
                        <ul className="list-group">
                            {selectedFiles.map((file, index) => (
                                <li key={index} className="list-group-item">
                                    <div className="d-flex justify-content-between align-items-center">
                                        <span>{file.name}</span>
                                        <small className="text-muted">
                                            {formatFileSize(file.size)}
                                        </small>
                                    </div>
                                    <small className="text-muted d-block">
                                        Tipo: {file.type || 'Desconocido'}
                                    </small>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </Modal.Body>
            <Modal.Footer>
                <Button
                    variant="primary"
                    onClick={handleUpload}
                    disabled={selectedFiles.length === 0}
                    className="btn btn-sm btn-success d-inline-flex align-items-center"
                >
                    <FaSave className="me-2" />
                    Subir archivos
                </Button>
                <Button
                    variant="secondary"
                    onClick={handleClose}
                    className="btn btn-sm btn-danger d-inline-flex align-items-center"
                >
                    <FaBan className="me-2" />
                    Cancelar
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default ProjectFileUploader;
