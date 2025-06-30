import React from 'react';
import { useParams } from 'react-router-dom';
import ProjectFilesList from '@/components/ProjectFilesList';

const ProjectFiles = () => {
    const { id } = useParams();

    return (
        <div className="container-fluid py-4">
            <div className="row">
                <div className="col-12">
                    <ProjectFilesList projectId={id} />
                </div>
            </div>
        </div>
    );
};

export default ProjectFiles;
