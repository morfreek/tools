// src/pages/ProjectDetail.jsx
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaChevronLeft, FaClipboardCheck, FaStickyNote } from 'react-icons/fa';
import ProjectInfoCard from '@/components/ProjectInfoCard';
import ProjectNotesList from '@/components/ProjectNotesList';

export default function ProjectDetail() {
    const { id } = useParams();
    const navigate = useNavigate();

    return (
        <div className="container-fluid mt-4">
            <div className="d-flex align-items-center">
                <button
                    className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center me-2"
                    title="Volver a Proyectos" 
                    onClick={() => navigate(`/projects/`)}>
                    <FaChevronLeft style={{ verticalAlign: 'middle' }} />
                </button>
                <h3 className="mb-0">Detalle del Proyecto</h3>
            </div>

            <ProjectInfoCard id={id} />
            
            <ProjectNotesList projectId={id} />

            <h5>Acciones</h5>
            <div className="row g-3 mb-4">
                <div className="col-sm-12 col-md-6 col-lg-4">
                    <div
                        className="card h-100 shadow-sm border-success"
                        style={{ cursor: 'pointer', minHeight: '100px' }}
                        onClick={() => navigate(`/projects/${id}/review`)}
                    >
                        <div className="card-body d-flex gap-3 align-items-center">
                            <div
                                className="d-flex justify-content-center align-items-center bg-success text-white rounded-circle"
                                style={{ width: '48px', height: '48px', minWidth: '48px' }}
                            >
                                <FaClipboardCheck size={26} />
                            </div>
                            <div className="flex-grow-1">
                                <h6 className="mb-1">Revisión Técnica</h6>
                                <small className="text-muted">Revisar y aplicar evaluación técnica al proyecto</small>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-sm-12 col-md-6 col-lg-4">
                    <div
                        className="card h-100 shadow-sm border-success"
                        style={{ cursor: 'pointer', minHeight: '100px' }}
                        onClick={() => navigate(`/projects/${id}/notes`)}
                    >
                        <div className="card-body d-flex gap-3 align-items-center">
                            <div
                                className="d-flex justify-content-center align-items-center bg-success text-white rounded-circle"
                                style={{ width: '48px', height: '48px', minWidth: '48px' }}
                            >
                                <FaStickyNote size={26} />
                            </div>
                            <div className="flex-grow-1">
                                <h6 className="mb-1">Notas</h6>
                                <small className="text-muted">Anotaciones realicionadas al proyecto</small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}