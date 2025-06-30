import React, { useEffect, useState, useRef } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { FaDownload, FaTrash, FaTimes, FaFile, FaImage, FaRegFilePdf, FaFileWord, FaFileExcel } from 'react-icons/fa';
import { useToast } from '@/components/ToastContext';
import { useConfirm } from '@/components/ConfirmContext';
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
    const sidebarRef = useRef(null);

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

    useEffect(() => {
        if (projectId) fetchFiles();
    }, [projectId]);

    useEffect(() => {
        if (projectId) fetchFiles();
    }, [projectId, refreshKey]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (sidebarRef.current && 
                !sidebarRef.current.contains(event.target) && 
                show && 
                typeof onClose === 'function') {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [show, onClose]);

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

    const defaultContainerStyle = !Object.keys(containerStyle).length ? {
        position: 'fixed',
        top: 0,
        right: 0,
        height: '100%',
        width: '400px',
        zIndex: 1040,
        transform: `translateX(${show ? '0' : '100%'})`,
        transition: 'transform 0.3s ease-in-out'
    } : containerStyle;

    if (!show) return null;

    return (
        <div 
            className={`bg-white shadow-lg ${className}`}
            style={defaultContainerStyle}
            ref={sidebarRef}
        >
            <div className="d-flex flex-column h-100">
                <div className="border-bottom">
                    <div className="d-flex justify-content-between align-items-center p-3">
                        <h5 className="mb-0">Archivos del Proyecto</h5>
                        {typeof onClose === 'function' && (
                            <button
                                className="btn btn-sm btn-link text-dark"
                                onClick={onClose}
                                style={{ fontSize: '1.2rem' }}
                            >
                                <FaTimes />
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex-grow-1 overflow-auto">
                    {loading ? (
                        <div className="p-3">
                            <div className="placeholder-glow">
                                <div className="placeholder col-12 mb-2"></div>
                                <div className="placeholder col-12 mb-2"></div>
                            </div>
                        </div>
                    ) : files.length === 0 ? (
                        <div className="p-3">
                            <p className="text-muted text-center">No hay archivos cargados</p>
                        </div>
                    ) : (
                        <div className="list-group list-group-flush">
                            {files.map(file => {
                                const FileIcon = getFileIcon(file.mime_type);
                                return (
                                    <div key={file.id} className="list-group-item hover-actions">
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
                                            <div className="btn-group">
                                                <button
                                                    className="btn btn-sm btn-outline-primary p-1 d-inline-flex align-items-center"
                                                    onClick={() => handleDownload(file.id, file.name)}
                                                    title="Descargar archivo"
                                                >
                                                    <FaDownload />
                                                </button>
                                                <button
                                                    className="btn btn-sm btn-outline-danger p-1 d-inline-flex align-items-center"
                                                    onClick={() => handleDelete(file.id)}
                                                    title="Eliminar archivo"
                                                >
                                                    <FaTrash />
                                                </button>
                                            </div>
                                        </div>
                                        {file.mime_type.startsWith('image/') && (
                                            <div className="mt-2">
                                                <img 
                                                    src={`${import.meta.env.VITE_API_URL}/projects/${projectId}/files/${file.id}/preview`}
                                                    alt={file.name}
                                                    className="img-thumbnail"
                                                    style={{ maxHeight: '100px' }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
