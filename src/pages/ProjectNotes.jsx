import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card } from 'react-bootstrap';
import ProjectPageLayout from '@c/layout/ProjectPageLayout';
import ProjectNoteList from '@c/note/ProjectNoteList';

export default function ProjectNotes() {
    const { id } = useParams();
    const [notesRefreshKey, setNotesRefreshKey] = useState(0);

    const handleNoteAdded = () => {
        setNotesRefreshKey(prev => prev + 1);
    };

    return (
        <ProjectPageLayout onNoteAdded={handleNoteAdded}>
            <Card
                style={{
                    height: 'calc(100vh - 245px)'
                }}
            >
                <ProjectNoteList
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
            </Card>
        </ProjectPageLayout>
    );
}
