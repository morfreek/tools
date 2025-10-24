import React, { useState, useMemo } from 'react';
import { Modal, Button, Form, Table, Badge, Alert, InputGroup } from 'react-bootstrap';
import { FaSearch, FaFilter, FaCheckSquare, FaSquare } from 'react-icons/fa';

const RoutesSelectorModal = ({ show, onHide, routes, onRoutesSelected }) => {
    const [selectedRoutes, setSelectedRoutes] = useState(new Set());
    const [searchTerm, setSearchTerm] = useState('');
    const [methodFilter, setMethodFilter] = useState('ALL');
    const [groupFilter, setGroupFilter] = useState('ALL');

    // Resetear estado al abrir modal
    React.useEffect(() => {
        if (show) {
            setSelectedRoutes(new Set());
            setSearchTerm('');
            setMethodFilter('ALL');
            setGroupFilter('ALL');
        }
    }, [show]);

    // Agrupar rutas por prefijo
    const groupRoute = (uri) => {
        const parts = uri.split('/').filter(Boolean);
        if (parts[0] === 'api') {
            return parts[1] ? `api/${parts[1]}` : 'api';
        }
        return parts[0] || 'root';
    };

    // Filtrar rutas
    const filteredRoutes = useMemo(() => {
        return routes.filter(route => {
            const matchesSearch = !searchTerm || 
                route.uri.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (route.name && route.name.toLowerCase().includes(searchTerm.toLowerCase()));
            
            const matchesMethod = methodFilter === 'ALL' || route.method === methodFilter;
            
            const matchesGroup = groupFilter === 'ALL' || groupRoute(route.uri) === groupFilter;

            return matchesSearch && matchesMethod && matchesGroup;
        });
    }, [routes, searchTerm, methodFilter, groupFilter]);

    // Obtener métodos únicos
    const uniqueMethods = useMemo(() => {
        const methods = new Set(routes.map(r => r.method));
        return Array.from(methods).sort();
    }, [routes]);

    // Obtener grupos únicos
    const uniqueGroups = useMemo(() => {
        const groups = new Set(routes.map(r => groupRoute(r.uri)));
        return Array.from(groups).sort();
    }, [routes]);

    const handleRouteToggle = (routeIndex) => {
        const newSelected = new Set(selectedRoutes);
        if (newSelected.has(routeIndex)) {
            newSelected.delete(routeIndex);
        } else {
            newSelected.add(routeIndex);
        }
        setSelectedRoutes(newSelected);
    };

    const handleSelectAll = () => {
        if (selectedRoutes.size === filteredRoutes.length) {
            setSelectedRoutes(new Set());
        } else {
            const allIndexes = new Set(filteredRoutes.map((_, index) => index));
            setSelectedRoutes(allIndexes);
        }
    };

    const handleSelectByMethod = (method) => {
        const methodRoutes = filteredRoutes
            .map((route, index) => ({ route, index }))
            .filter(({ route }) => route.method === method)
            .map(({ index }) => index);
        
        const newSelected = new Set(selectedRoutes);
        const allMethodSelected = methodRoutes.every(index => newSelected.has(index));
        
        if (allMethodSelected) {
            methodRoutes.forEach(index => newSelected.delete(index));
        } else {
            methodRoutes.forEach(index => newSelected.add(index));
        }
        
        setSelectedRoutes(newSelected);
    };

    const handleConfirm = () => {
        const selected = Array.from(selectedRoutes).map(index => filteredRoutes[index]);
        onRoutesSelected(selected);
    };

    const getMethodBadgeVariant = (method) => {
        const variants = {
            'GET': 'success',
            'POST': 'primary',
            'PUT': 'warning',
            'PATCH': 'info',
            'DELETE': 'danger',
            'HEAD': 'secondary'
        };
        return variants[method] || 'secondary';
    };

    return (
        <Modal show={show} onHide={onHide} size="xl" centered>
            <Modal.Header closeButton>
                <Modal.Title>Seleccionar Rutas de Laravel</Modal.Title>
            </Modal.Header>
            
            <Modal.Body className="p-0">
                {/* Barra de filtros */}
                <div className="p-3 border-bottom bg-light">
                    <div className="row g-3">
                        <div className="col-md-4">
                            <InputGroup size="sm">
                                <InputGroup.Text>
                                    <FaSearch />
                                </InputGroup.Text>
                                <Form.Control
                                    size="sm"
                                    placeholder="Buscar por URI o nombre..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </InputGroup>
                        </div>
                        <div className="col-md-3">
                            <Form.Select
                                size="sm"
                                value={methodFilter}
                                onChange={(e) => setMethodFilter(e.target.value)}
                            >
                                <option value="ALL">Todos los métodos</option>
                                {uniqueMethods.map(method => (
                                    <option key={method} value={method}>{method}</option>
                                ))}
                            </Form.Select>
                        </div>
                        <div className="col-md-3">
                            <Form.Select
                                size="sm"
                                value={groupFilter}
                                onChange={(e) => setGroupFilter(e.target.value)}
                            >
                                <option value="ALL">Todos los grupos</option>
                                {uniqueGroups.map(group => (
                                    <option key={group} value={group}>{group}</option>
                                ))}
                            </Form.Select>
                        </div>
                        <div className="col-md-2 d-flex gap-1">
                            <Button size="sm" variant="outline-primary" onClick={handleSelectAll}>
                                {selectedRoutes.size === filteredRoutes.length ? 'Deseleccionar' : 'Seleccionar'} Todo
                            </Button>
                        </div>
                    </div>
                    
                    {/* Botones rápidos por método */}
                    <div className="mt-2 d-flex gap-1 flex-wrap">
                        {uniqueMethods.map(method => {
                            const methodCount = filteredRoutes.filter(r => r.method === method).length;
                            const methodSelected = filteredRoutes
                                .map((route, index) => ({ route, index }))
                                .filter(({ route }) => route.method === method)
                                .every(({ index }) => selectedRoutes.has(index));
                            
                            return (
                                <Button
                                    key={method}
                                    size="sm"
                                    variant={methodSelected ? getMethodBadgeVariant(method) : `outline-${getMethodBadgeVariant(method)}`}
                                    onClick={() => handleSelectByMethod(method)}
                                    className="d-flex align-items-center gap-1"
                                >
                                    {methodSelected ? <FaCheckSquare /> : <FaSquare />}
                                    {method} ({methodCount})
                                </Button>
                            );
                        })}
                    </div>
                </div>

                {/* Resumen de selección */}
                {selectedRoutes.size > 0 && (
                    <Alert variant="info" className="m-3 mb-0">
                        <strong>{selectedRoutes.size}</strong> rutas seleccionadas de <strong>{filteredRoutes.length}</strong> mostradas
                    </Alert>
                )}

                {/* Tabla de rutas */}
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    <Table striped hover size="sm" className="mb-0">
                        <thead className="sticky-top bg-white">
                            <tr>
                                <th width="50px">
                                    <Form.Check
                                        type="checkbox"
                                        size="sm"
                                        checked={selectedRoutes.size === filteredRoutes.length && filteredRoutes.length > 0}
                                        onChange={handleSelectAll}
                                    />
                                </th>
                                <th width="80px">Método</th>
                                <th>URI</th>
                                <th>Nombre</th>
                                <th>Grupo</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRoutes.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="text-center text-muted py-4">
                                        No hay rutas que coincidan con los filtros
                                    </td>
                                </tr>
                            ) : (
                                filteredRoutes.map((route, index) => (
                                    <tr 
                                        key={index}
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => handleRouteToggle(index)}
                                        className={selectedRoutes.has(index) ? 'table-primary' : ''}
                                    >
                                        <td>
                                            <Form.Check
                                                type="checkbox"
                                                size="sm"
                                                checked={selectedRoutes.has(index)}
                                                onChange={() => handleRouteToggle(index)}
                                            />
                                        </td>
                                        <td>
                                            <Badge bg={getMethodBadgeVariant(route.method)}>
                                                {route.method}
                                            </Badge>
                                        </td>
                                        <td>
                                            <code className="small">{route.uri}</code>
                                        </td>
                                        <td>
                                            <span className="small text-muted">
                                                {route.name || '-'}
                                            </span>
                                        </td>
                                        <td>
                                            <Badge bg="light" text="dark" className="small">
                                                {groupRoute(route.uri)}
                                            </Badge>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </Table>
                </div>
            </Modal.Body>
            
            <Modal.Footer>
                <Button size="sm" variant="secondary" onClick={onHide}>
                    Cancelar
                </Button>
                <Button 
                    size="sm"
                    variant="primary" 
                    onClick={handleConfirm}
                    disabled={selectedRoutes.size === 0}
                >
                    Agregar {selectedRoutes.size} Peticiones
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default RoutesSelectorModal;
