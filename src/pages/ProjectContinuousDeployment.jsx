import React from 'react';
import { useParams } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import ProjectInfoCard from '@/components/ProjectInfoCard';
import Breadcrumb from '@/components/Breadcrumb';
import ContinuousDeploymentForm from '@/components/cd/ContinuousDeploymentForm';

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
