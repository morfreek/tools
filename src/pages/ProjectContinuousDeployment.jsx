import React from 'react';
import { useParams } from 'react-router-dom';
import ProjectPageLayout from '@c/layout/ProjectPageLayout';
import ContinuousDeploymentForm from '@c/cd/ContinuousDeploymentForm';

export default function ProjectContinuousDeployment() {
    const { id } = useParams();

    return (
        <ProjectPageLayout>
            <ContinuousDeploymentForm projectId={id} />
        </ProjectPageLayout>
    );
}
