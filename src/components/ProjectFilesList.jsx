import React, { useEffect, useState, useRef } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { FaDownload, FaTrash, FaPlus, FaFile, FaImage, FaRegFilePdf, FaFileWord, FaFileExcel } from 'react-icons/fa';
import { ListGroup, Button, Placeholder, ButtonGroup, Image, Offcanvas } from 'react-bootstrap';
import { useToast } from '@/components/ToastContext';
import { useConfirm } from '@/components/ConfirmContext';
import ProjectFileUploader from '@/components/ProjectFileUploader';
import api from '@/api';

// Función auxiliar para formatear el tamaño del archivo
const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Función para obtener el icono según el tipo de archivo
const getFileIcon = (mimeType) => {
    if (mimeType.startsWith('image/')) return FaImage;
    if (mimeType === 'application/pdf') return FaRegFilePdf;
    if (mimeType === 'application/msword' || mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return FaFileWord;
    if (mimeType === 'application/vnd.ms-excel' || mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') return FaFileExcel;
    return FaFile;
};

export default function ProjectFilesList({
    projectId,
    show,
    onClose,
    className = '',
    containerStyle = {},
    refreshKey
}) {
    const { showToast } = useToast();
    const { showConfirm } = useConfirm();
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showUploader, setShowUploader] = useState(false);

    const fetchFiles = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/projects/${projectId}/files`);
            setFiles(response.data.sort((a, b) =>
                new Date(b.created_at) - new Date(a.created_at)
            ));
        } catch (err) {
            console.error(err);
            showToast('error', 'Error al cargar los archivos');
        } finally {
            setLoading(false);
        }
    };

    const handleUploadSuccess = () => {
        fetchFiles();
        setShowUploader(false);
    };

    useEffect(() => {
        if (projectId) fetchFiles();
    }, [projectId]);

    useEffect(() => {
        if (projectId) fetchFiles();
    }, [projectId, refreshKey]);

    const handleDownload = async (fileId, fileName) => {
        try {
            const response = await api.get(`/projects/${projectId}/files/${fileId}/download`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error(err);
            showToast('error', 'Error al descargar el archivo');
        }
    };

    const handleDelete = (fileId) => {
        showConfirm({
            title: "Eliminar Archivo",
            message: "¿Estás seguro de eliminar este archivo? Esta acción no se puede deshacer.",
            confirmText: "Eliminar",
            cancelText: "Cancelar",
            onConfirm: async () => {
                try {
                    await api.delete(`/projects/${projectId}/files/${fileId}`);
                    showToast('success', 'Archivo eliminado correctamente');
                    fetchFiles();
                } catch (err) {
                    console.error(err);
                    showToast('error', 'Error al eliminar el archivo');
                }
            }
        });
    };

    if (!show) return null;

    return (
        <>
            <Offcanvas 
                show={show} 
                onHide={onClose} 
                placement="end" 
                backdrop={true}
                className={className}
            >
                <Offcanvas.Header closeButton>
                    <Offcanvas.Title className="flex-grow-1">Archivos del Proyecto</Offcanvas.Title>
                    <Button
                        variant="outline-success"
                        size="sm"
                        className="d-inline-flex align-items-center me-2"
                        onClick={() => setShowUploader(true)}
                    >
                        <FaPlus className="me-1" /> 
                        Subir
                    </Button>
                </Offcanvas.Header>
                <Offcanvas.Body>
                    {loading ? (
                        <div className="p-3">
                            <Placeholder animation="glow">
                                <Placeholder xs={12} className="mb-2" />
                                <Placeholder xs={12} className="mb-2" />
                            </Placeholder>
                        </div>
                    ) : files.length === 0 ? (
                        <div className="p-3 text-muted text-center">
                            No hay archivos cargados
                        </div>
                    ) : (
                        <ListGroup variant="flush">
                            {files.map(file => {
                                const FileIcon = getFileIcon(file.mime_type);
                                return (
                                    <ListGroup.Item key={file.id} className="hover-actions">
                                        <div className="d-flex align-items-center mb-2">
                                            <FileIcon className="me-2 text-muted" size={20} />
                                            <div className="flex-grow-1 text-break">
                                                <div className="fw-bold">{file.filename}</div>
                                            </div>
                                        </div>
                                        <div className="d-flex justify-content-between align-items-center">
                                            <div className="small text-muted">
                                                <div>{formatFileSize(file.file_size)}</div>
                                                <div>
                                                    {format(new Date(file.created_at),
                                                        "d 'de' MMMM 'de' yyyy, HH:mm",
                                                        { locale: es })}
                                                </div>
                                                {file.uploaded_by && (
                                                    <div>Subido por: {file.uploaded_by}</div>
                                                )}
                                            </div>
                                            <ButtonGroup>
                                                <Button
                                                    variant="outline-primary"
                                                    size="sm"
                                                    className="p-1 d-inline-flex align-items-center"
                                                    onClick={() => handleDownload(file.id, file.name)}
                                                    title="Descargar archivo"
                                                >
                                                    <FaDownload />
                                                </Button>
                                                <Button
                                                    variant="outline-danger"
                                                    size="sm"
                                                    className="p-1 d-inline-flex align-items-center"
                                                    onClick={() => handleDelete(file.id)}
                                                    title="Eliminar archivo"
                                                >
                                                    <FaTrash />
                                                </Button>
                                            </ButtonGroup>
                                        </div>
                                        {file.mime_type.startsWith('image/') && (
                                            <div className="mt-2">
                                                <Image
                                                    src={`${import.meta.env.VITE_API_URL}/projects/${projectId}/files/${file.id}/preview`}
                                                    alt={file.name}
                                                    thumbnail
                                                    style={{ maxHeight: '100px' }}
                                                />
                                            </div>
                                        )}
                                    </ListGroup.Item>
                                );
                            })}
                        </ListGroup>
                    )}
                </Offcanvas.Body>
            </Offcanvas>

            <ProjectFileUploader
                show={showUploader}
                onClose={() => setShowUploader(false)}
                projectId={projectId}
                onUploadComplete={handleUploadSuccess}
            />
        </>
    );
}
