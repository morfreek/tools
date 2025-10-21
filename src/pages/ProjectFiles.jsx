import React from 'react';
import { useParams } from 'react-router-dom';
import { Container, Row, Col } from 'react-bootstrap';
import ProjectInfoCard from '@c/info/ProjectInfoCard';
import Breadcrumb from '@c/Breadcrumb';
import ProjectFileList from '@c/file/ProjectFileList';

const ProjectFiles = () => {
    const { id } = useParams();

    return (
        <Container fluid className="py-4">
            <Breadcrumb />
            <ProjectInfoCard id={id} />
            <Row>
                <Col xs={12}>
                    <ProjectFileList projectId={id} />
                </Col>
            </Row>
        </Container>
    );
};

export default ProjectFiles;
