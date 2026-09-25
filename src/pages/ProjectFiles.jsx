import React from 'react';
import { useParams } from 'react-router-dom';
import ProjectPageLayout from '@c/layout/ProjectPageLayout';
import ProjectFileList from '@c/file/ProjectFileList';

export default function ProjectFiles() {
    const { id } = useParams();

    return (
        <ProjectPageLayout>
            <ProjectFileList projectId={id} />
        </ProjectPageLayout>
    );
}
