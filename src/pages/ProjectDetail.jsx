// src/pages/ProjectDetail.jsx
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaClipboardCheck, FaStickyNote, FaRocket } from 'react-icons/fa';
import { Container, Row, Col, Card } from 'react-bootstrap';
import ProjectInfoCard from '@/components/ProjectInfoCard';
import ProjectNotesList from '@/components/ProjectNotesList';
import Breadcrumb from '@/components/Breadcrumb';

const ActionCard = ({ icon: Icon, title, description, onClick, color }) => (
    <Card 
        className={`h-100 shadow-sm border-${color}`} 
        style={{ cursor: 'pointer', minHeight: '100px' }}
        onClick={onClick}
    >
        <Card.Body className="d-flex gap-3 align-items-center">
            <div
                className={`d-flex justify-content-center align-items-center bg-${color} text-white rounded-circle`}
                style={{ width: '48px', height: '48px', minWidth: '48px' }}
            >
                <Icon size={26} />
            </div>
            <div className="flex-grow-1">
                <Card.Title as="h6" className="mb-1">{title}</Card.Title>
                <Card.Text as="small" className="text-muted">{description}</Card.Text>
            </div>
        </Card.Body>
    </Card>
);

export default function ProjectDetail() {
    const { id } = useParams();
    const navigate = useNavigate();

    const actions = [
        {
            icon: FaClipboardCheck,
            title: 'Revisión Técnica',
            description: 'Revisar y aplicar evaluación técnica al proyecto',
            path: 'review',
            color: 'primary'
        },
        {
            icon: FaStickyNote,
            title: 'Notas',
            description: 'Anotaciones realicionadas al proyecto',
            path: 'notes',
            color: 'warning'
        },
        {
            icon: FaRocket,
            title: 'Despliegue Continuo',
            description: 'Generara pipelines para CD (continuous deployment)',
            path: 'continuous-deployment',
            color: 'danger'
        }
    ];

    return (
        <Container fluid className="mt-4">
            <Breadcrumb />
            <ProjectInfoCard id={id} />
            <ProjectNotesList projectId={id} />

            <h5>Acciones</h5>
            <Row className="g-3 mb-4">
                {actions.map((action, index) => (
                    <Col key={index} sm={12} md={6} lg={4}>
                        <ActionCard
                            {...action}
                            onClick={() => navigate(`/projects/${id}/${action.path}`)}
                        />
                    </Col>
                ))}
            </Row>
        </Container>
    );
}