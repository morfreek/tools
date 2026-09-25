import React from 'react';
import { useParams } from 'react-router-dom';
import ProjectPageLayout from '@c/layout/ProjectPageLayout';
import ProjectNoteList from '@c/note/ProjectNoteList';

export default function ProjectNotes() {
    const { id } = useParams();

    return (
        <ProjectPageLayout>
            <ProjectNoteList projectId={id} />
        </ProjectPageLayout>
    );
}
