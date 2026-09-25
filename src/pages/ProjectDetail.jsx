import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { FaClipboardCheck, FaStickyNote, FaRocket } from 'react-icons/fa';
import ProjectPageLayout from '@c/layout/ProjectPageLayout';
import ProjectNoteList from '@c/note/ProjectNoteList';

export default function ProjectDetail() {
    const { id } = useParams();

    const actions = [
        {
            icon: FaClipboardCheck,
            title: 'Revisión técnica',
            description: 'Revisar y aplicar evaluación técnica al proyecto',
            path: 'review'
        },
        {
            icon: FaStickyNote,
            title: 'Notas',
            description: 'Anotaciones relacionadas al proyecto',
            path: 'notes'
        },
        {
            icon: FaRocket,
            title: 'Despliegue continuo',
            description: 'Generar pipelines de despliegue continuo (CD)',
            path: 'continuous-deployment'
        }
    ];

    return (
        <ProjectPageLayout>
            <ProjectNoteList projectId={id} />

            <div className="titulo-seccion mt-3">
                <h2>Acciones</h2>
            </div>
            <div className="rejilla mb-4">
                {actions.map(({ icon: Icon, title, description, path }) => (
                    <Link key={path} to={`/projects/${id}/${path}`} className="tarjeta">
                        <Icon className="icono" size={20} aria-hidden="true" />
                        <h2>{title}</h2>
                        <p>{description}</p>
                    </Link>
                ))}
            </div>
        </ProjectPageLayout>
    );
}