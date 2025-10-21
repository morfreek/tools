import React from 'react';
import { useParams } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import ProjectInfoCard from '@c/info/ProjectInfoCard';
import Breadcrumb from '@c/Breadcrumb';
import ContinuousDeploymentForm from '@c/cd/ContinuousDeploymentForm';

export default function ProjectContinuousDeployment() {
    const { id } = useParams();

    return (
        <Container fluid className="mt-4">
            <Breadcrumb />
            <ProjectInfoCard id={id} />
            <ContinuousDeploymentForm projectId={id} />
        </Container>
    );
}
