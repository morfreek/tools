import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Dropdown, Form, Spinner } from 'react-bootstrap';
import { FaChevronDown } from 'react-icons/fa';
import { listProjects } from '@/services/projects.service';
import { matchesSearch } from '@u/text';

const MAX_VISIBLE = 50;

// Última miga: nombre del proyecto actual; al abrirla, lista los demás proyectos
// activos con buscador y lleva a la misma sección en el proyecto elegido.
export default function ProjectSwitcher({ projectId, name, section }) {
    const [projects, setProjects] = useState(null);
    const [error, setError] = useState(false);
    const [search, setSearch] = useState('');

    const handleToggle = async (open) => {
        if (!open) return setSearch('');
        if (projects) return;
        try {
            setProjects(await listProjects());
        } catch {
            setError(true);
        }
    };

    const others = (projects || [])
        .filter((p) => String(p.id) !== String(projectId))
        .filter((p) => matchesSearch(search, [p.name, p.code, ...(p.developer_names || [])]));

    return (
        <Dropdown onToggle={handleToggle} className="d-inline-block">
            <Dropdown.Toggle as="button" type="button" className="migas-selector" title="Cambiar de proyecto">
                {name} <FaChevronDown size={10} aria-hidden="true" />
            </Dropdown.Toggle>
            <Dropdown.Menu className="migas-menu">
                <div className="px-2 pb-2">
                    <Form.Control
                        type="search"
                        size="sm"
                        placeholder="Buscar proyecto"
                        aria-label="Buscar proyecto"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        autoFocus
                    />
                </div>
                {error ? (
                    <div className="px-3 py-2 sub">No se pudo cargar el listado de proyectos.</div>
                ) : !projects ? (
                    <div className="px-3 py-2 sub"><Spinner size="sm" className="me-2" />Cargando proyectos</div>
                ) : others.length === 0 ? (
                    <div className="px-3 py-2 sub">{search ? 'Ningún proyecto coincide.' : 'No hay otros proyectos activos.'}</div>
                ) : (
                    <div className="migas-lista">
                        {others.slice(0, MAX_VISIBLE).map((p) => (
                            <Dropdown.Item key={p.id} as={Link} to={`/projects/${p.id}/${section}`}>
                                <span className="d-block text-truncate">{p.name}</span>
                                <code className="sub">{p.code}</code>
                            </Dropdown.Item>
                        ))}
                        {others.length > MAX_VISIBLE && (
                            <div className="px-3 py-2 sub">Se muestran {MAX_VISIBLE} de {others.length}; afina la búsqueda.</div>
                        )}
                    </div>
                )}
            </Dropdown.Menu>
        </Dropdown>
    );
}
