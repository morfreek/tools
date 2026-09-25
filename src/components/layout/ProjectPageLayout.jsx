import React from 'react';
import { useParams } from 'react-router-dom';
import Breadcrumb from '@c/Breadcrumb';
import ProjectInfoCard from '@c/info/ProjectInfoCard';

// Estructura común de las páginas /projects/:id/*: migas + acciones, ficha del proyecto y contenido
export default function ProjectPageLayout({ actions, onNoteAdded, children }) {
    const { id } = useParams();

    return (
        <>
            <div className="d-flex justify-content-between align-items-center gap-2 mb-3">
                <Breadcrumb />
                {actions}
            </div>
            <ProjectInfoCard id={id} onNoteAdded={onNoteAdded} />
            {children}
        </>
    );
}
