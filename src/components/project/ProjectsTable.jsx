import React from 'react';
import { Link } from 'react-router-dom';
import { FaTasks, FaStop } from 'react-icons/fa';
import { Badge, Button, Spinner, Table } from 'react-bootstrap';

const COLUMNS = 6;

const formatDate = (value) => new Date(value).toLocaleDateString('es-CL', {
    day: '2-digit', month: 'short', year: 'numeric',
});

const SortableHeader = ({ title, sortKey, sort, onSort }) => (
    <th role="button" onClick={() => onSort(sortKey)} aria-sort={sort.key === sortKey ? (sort.direction === 'asc' ? 'ascending' : 'descending') : undefined}>
        {title} {sort.key === sortKey ? (sort.direction === 'asc' ? '▲' : '▼') : ''}
    </th>
);

const ProjectRow = ({ project, getUserName, onTerminate }) => (
    <tr className={project.termination_date ? 'inactivo' : undefined}>
        <td>{project.name}</td>
        <td><code>{project.code}</code></td>
        <td>{getUserName(project.coordinator_id)}</td>
        <td>{(project.developer_ids || []).map(getUserName).join(', ')}</td>
        <td>
            {project.termination_date
                ? <Badge bg="secondary" title={new Date(project.termination_date).toLocaleString('es-CL')}>Finalizado {formatDate(project.termination_date)}</Badge>
                : <Badge bg="success">Activo</Badge>}
        </td>
        <td className="text-end text-nowrap">
            <Button as={Link} to={`/projects/${project.id}/detail`} variant="link" size="sm" className="accion accion-editar" title="Ver detalle">
                <FaTasks />
            </Button>
            {!project.termination_date && (
                <Button variant="link" size="sm" className="accion accion-eliminar" title="Finalizar proyecto" onClick={() => onTerminate(project)}>
                    <FaStop />
                </Button>
            )}
        </td>
    </tr>
);

export default function ProjectsTable({ projects, loading, sort, onSort, getUserName, onTerminate }) {
    return (
        <div className="panel-tabla">
            <Table hover className="align-middle">
                <thead>
                    <tr>
                        <SortableHeader title="Nombre" sortKey="name" sort={sort} onSort={onSort} />
                        <SortableHeader title="Código" sortKey="code" sort={sort} onSort={onSort} />
                        <SortableHeader title="Coordinador" sortKey="coordinator_id" sort={sort} onSort={onSort} />
                        <th>Desarrolladores</th>
                        <th>Estado</th>
                        <th className="text-end">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {loading ? (
                        <tr><td colSpan={COLUMNS} className="text-center sub py-4"><Spinner animation="border" size="sm" className="me-2" />Cargando proyectos</td></tr>
                    ) : projects.length === 0 ? (
                        <tr><td colSpan={COLUMNS} className="text-center sub py-4">No hay proyectos que coincidan.</td></tr>
                    ) : (
                        projects.map((project) => (
                            <ProjectRow key={project.id} project={project} getUserName={getUserName} onTerminate={onTerminate} />
                        ))
                    )}
                </tbody>
            </Table>
        </div>
    );
}
