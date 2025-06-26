import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaChevronLeft } from 'react-icons/fa';
import ProjectInfoCard from '@/components/ProjectInfoCard';
import ProjectNotesList from '@/components/ProjectNotesList';

export default function ProjectNotes() {
    const navigate = useNavigate();
    const { id } = useParams();
    const [notesRefreshKey, setNotesRefreshKey] = useState(0);

    const handleNoteAdded = () => {
        setNotesRefreshKey(prev => prev + 1);
    };

    return (
        <div className="container-fluid mt-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="d-flex align-items-center">
                    <button
                        className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center me-2"
                        title="Volver a Proyectos"
                        onClick={() => navigate(-1)}
                    >
                        <FaChevronLeft style={{ verticalAlign: 'middle' }} />
                    </button>
                    <h3 className="mb-0">Notas del Proyecto</h3>
                </div>
            </div>

            <ProjectInfoCard 
                id={id} 
                onNoteAdded={handleNoteAdded}
            />

            <div 
                className="card"
                style={{
                    height: 'calc(100vh - 245px)'
                }}
            >
                <ProjectNotesList 
                    projectId={id} 
                    show={true}
                    className="position-relative w-100 h-100"
                    containerStyle={{
                        position: 'relative',
                        width: '100%',
                        transform: 'none'
                    }}
                    refreshKey={notesRefreshKey}
                />
            </div>
        </div>
    );
}
