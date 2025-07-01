import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import ProjectInfoCard from '@/components/ProjectInfoCard';
import ProjectNotesList from '@/components/ProjectNotesList';
import Breadcrumb from '@/components/Breadcrumb';

export default function ProjectNotes() {
    const { id } = useParams();
    const [notesRefreshKey, setNotesRefreshKey] = useState(0);

    const handleNoteAdded = () => {
        setNotesRefreshKey(prev => prev + 1);
    };

    return (
        <div className="container-fluid mt-4">
            
            <Breadcrumb />

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
