import React from 'react';
import { Link } from 'react-router-dom';
import { FaTasks, FaStop } from 'react-icons/fa';
import { Button, ButtonGroup, Spinner, Table } from 'react-bootstrap';

const COLUMNS = 6;

const formatDate = (value) => new Date(value).toLocaleString('es-CL', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
});

const SortableHeader = ({ title, sortKey, sort, onSort }) => (
    <th onClick={() => onSort(sortKey)} style={{ cursor: 'pointer' }}>
        {title} {sort.key === sortKey ? (sort.direction === 'asc' ? '▲' : '▼') : ''}
    </th>
);

const ProjectRow = ({ project, getUserName, onTerminate }) => (
    <tr>
        <td>{project.name}</td>
        <td>{project.code}</td>
        <td>{getUserName(project.coordinator_id)}</td>
        <td>{(project.developer_ids || []).map(getUserName).join(', ')}</td>
        <td>{project.termination_date ? formatDate(project.termination_date) : 'Activo'}</td>
        <td className="text-center">
            <ButtonGroup size="sm">
                <Button as={Link} to={`/projects/${project.id}/detail`} variant="primary" className="d-inline-flex align-items-center" title="Ver detalle">
                    <FaTasks />
                </Button>
                {!project.termination_date && (
                    <Button variant="outline-secondary" className="d-inline-flex align-items-center" onClick={() => onTerminate(project)}>
                        <FaStop className="me-1" />
                        Finalizar
                    </Button>
                )}
            </ButtonGroup>
        </td>
    </tr>
);

export default function ProjectsTable({ projects, loading, sort, onSort, getUserName, onTerminate }) {
    return (
        <Table striped bordered hover>
            <thead>
                <tr>
                    <SortableHeader title="Nombre" sortKey="name" sort={sort} onSort={onSort} />
                    <SortableHeader title="Código" sortKey="code" sort={sort} onSort={onSort} />
                    <SortableHeader title="Coordinador" sortKey="coordinator_id" sort={sort} onSort={onSort} />
                    <th>Desarrolladores</th>
                    <th>Estado / finalización</th>
                    <th className="text-center">Acciones</th>
                </tr>
            </thead>
            <tbody>
                {loading ? (
                    <tr><td colSpan={COLUMNS} className="text-center"><Spinner animation="border" size="sm" /> Cargando...</td></tr>
                ) : projects.length === 0 ? (
                    <tr><td colSpan={COLUMNS} className="text-center text-muted">No existen datos</td></tr>
                ) : (
                    projects.map((project) => (
                        <ProjectRow key={project.id} project={project} getUserName={getUserName} onTerminate={onTerminate} />
                    ))
                )}
            </tbody>
        </Table>
    );
}
