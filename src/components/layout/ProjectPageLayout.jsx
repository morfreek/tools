import React from 'react';
import { useParams } from 'react-router-dom';
import ProjectHeader from '@c/project/ProjectHeader';

// Estructura común de las páginas /projects/:id/*: cabecera del proyecto (migas,
// ficha y pestañas) y el contenido de la sección, que trae sus propias acciones
export default function ProjectPageLayout({ children }) {
    const { id } = useParams();

    return (
        <>
            <ProjectHeader projectId={id} />
            {children}
        </>
    );
}
