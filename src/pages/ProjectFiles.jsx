import React from 'react';
import { useParams } from 'react-router-dom';
import { Container, Row, Col } from 'react-bootstrap';
import ProjectInfoCard from '@/components/ProjectInfoCard';
import Breadcrumb from '@/components/Breadcrumb';
import ProjectFilesList from '@/components/ProjectFilesList';

const ProjectFiles = () => {
    const { id } = useParams();

    return (
        <Container fluid className="py-4">
            <Breadcrumb />
            <ProjectInfoCard id={id} />
            <Row>
                <Col xs={12}>
                    <ProjectFilesList projectId={id} />
                </Col>
            </Row>
        </Container>
    );
};

export default ProjectFiles;
