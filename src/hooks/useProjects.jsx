import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { listProjects } from '@/services/projects.service';
import { listUsers } from '@/services/users.service';
import { matchesSearch } from '@u/text';

const PAGE_SIZE = 10;

// Listado de proyectos con usuarios, búsqueda, orden y paginación en el cliente
export function useProjects({ onError } = {}) {
    const [projects, setProjects] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [status, setStatusState] = useState('active');
    const [search, setSearchState] = useState('');
    const [sort, setSort] = useState({ key: 'name', direction: 'asc' });
    const [page, setPage] = useState(1);

    // onError en una ref: un callback nuevo en cada render no debe volver a cargar datos
    const onErrorRef = useRef(onError);
    onErrorRef.current = onError;

    const loadUsers = useCallback(async () => {
        try {
            setUsers(await listUsers());
        } catch {
            onErrorRef.current?.('Error cargando usuarios');
        }
    }, []);

    const loadProjects = useCallback(async () => {
        setLoading(true);
        try {
            setProjects(await listProjects(status));
        } catch {
            onErrorRef.current?.('Error cargando proyectos');
        } finally {
            setLoading(false);
        }
    }, [status]);

    useEffect(() => { loadUsers(); }, [loadUsers]);
    useEffect(() => { loadProjects(); }, [loadProjects]);

    const getUserName = useCallback(
        (id) => users.find((u) => u.id === Number(id))?.name || 'N/A',
        [users]
    );

    const filtered = useMemo(() => projects.filter((p) => matchesSearch(search, [
        p.name,
        p.code,
        getUserName(p.coordinator_id),
        ...(p.developer_ids || []).map(getUserName),
    ])), [projects, search, getUserName]);

    const sorted = useMemo(() => {
        const value = (p) => (sort.key === 'coordinator_id' ? getUserName(p.coordinator_id) : p[sort.key])
            ?.toString().toLowerCase() || '';
        const dir = sort.direction === 'asc' ? 1 : -1;
        return [...filtered].sort((a, b) => value(a).localeCompare(value(b), 'es') * dir);
    }, [filtered, sort, getUserName]);

    const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
    const pageItems = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    // Cambiar filtros vuelve a la primera página
    const setStatus = (value) => { setStatusState(value); setPage(1); };
    const setSearch = (value) => { setSearchState(value); setPage(1); };
    const toggleSort = (key) => setSort((prev) => ({
        key,
        direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));

    return {
        users, loading, getUserName,
        status, setStatus, search, setSearch, sort, toggleSort,
        page, setPage, totalPages, total: filtered.length, pageItems,
        reloadProjects: loadProjects, reloadUsers: loadUsers,
    };
}
