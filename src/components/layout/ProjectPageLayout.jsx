import React from 'react';
import { useParams } from 'react-router-dom';
import ProjectHeader from '@c/project/ProjectHeader';

// Estructura común de las páginas /projects/:id/*: cabecera del proyecto (migas,
// ficha, acciones y pestañas) y el contenido de la sección
export default function ProjectPageLayout({ actions, children }) {
    const { id } = useParams();

    return (
        <>
            <ProjectHeader projectId={id} actions={actions} />
            {children}
        </>
    );
}
