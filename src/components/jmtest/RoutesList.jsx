import React from 'react';
import { Row, Col, Form, ListGroup } from 'react-bootstrap';

export default function RoutesList({ 
    routes, 
    selectedRoutes, 
    filter, 
    groupedRoutes,
    onFilterChange, 
    onSelectAllToggle, 
    onGroupToggle, 
    onRouteToggle 
}) {
    const groupRoute = (uri) => {
        const parts = uri.split('/').filter(Boolean);
        if (parts[0] === 'api') {
            return `/api/${parts[1] || ''}`;
        }
        return `/${parts[0] || ''}`;
    };

    if (routes.length === 0) return null;

    return (
        <>
            <Row className="align-items-center mb-3">
                <Col>
                    <Form.Control
                        size="sm"
                        type="text"
                        placeholder="Buscar rutas..."
                        value={filter}
                        onChange={(e) => onFilterChange(e.target.value.toLowerCase())}
                    />
                </Col>
                <Col xs="auto">
                    <Form.Switch
                        id="select-all-routes"
                        label="Seleccionar todas"
                        checked={routes.length > 0 && routes.every((_, index) => selectedRoutes[index])}
                        onChange={onSelectAllToggle}
                        className="mb-0"
                    />
                </Col>
            </Row>

            {Object.entries(groupedRoutes).map(([group, groupRoutes]) => {
                const filteredGroup = groupRoutes.filter((r) =>
                    `${r.method}${r.uri}`.toLowerCase().includes(filter)
                );

                if (!filteredGroup.length) return null;

                const allSelected = groupRoutes.every(route => selectedRoutes[route.index]);

                return (
                    <div key={group} className="mb-3">
                        <div className="d-flex align-items-center mb-2">
                            <h5 className="h6 mb-0 me-2">{group}</h5>
                            <Form.Switch
                                size="sm"
                                className="mb-0 small"
                                checked={allSelected}
                                onChange={() => onGroupToggle(group)}
                                label="Seleccionar todo"
                                reverse
                            />
                        </div>
                        <ListGroup size="sm">
                            {filteredGroup.map((route) => (
                                <ListGroup.Item key={route.index} className="small py-2">
                                    <Form.Check
                                        type="checkbox"
                                        size="sm"
                                        className="d-inline-block me-2"
                                        checked={selectedRoutes[route.index] || false}
                                        onChange={() => onRouteToggle(route.index)}
                                    />
                                    <code>{route.method}</code> {route.uri}
                                </ListGroup.Item>
                            ))}
                        </ListGroup>
                    </div>
                );
            })}
        </>
    );
}
