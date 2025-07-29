import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Nav, Button } from 'react-bootstrap';
import {
    FaBars,
    FaChevronLeft,
    FaHome,
    FaProjectDiagram,
    FaBolt,
    FaSearch,
    FaServer
} from 'react-icons/fa';

const Sidebar = ({ collapsed, autoCollapsed, onToggle }) => {
    const location = useLocation();

    const toggleSidebar = () => {
        // Solo permitir toggle si no está auto-colapsado
        if (!autoCollapsed && onToggle) {
            onToggle(!collapsed);
        }
    };

    const menuItems = [
        { path: '/', label: 'Inicio', icon: <FaHome /> },
        { path: '/projects', label: 'Proyectos', icon: <FaProjectDiagram /> },
        { path: '/jmeter-test-generator', label: 'JMeter test generator', icon: <FaBolt /> },
        { path: '/phpstan', label: 'Visor PHPStan', icon: <FaSearch /> },
        { path: '/solicitud-maquina-virtual-upt', label: 'Solicitud de servidores', icon: <FaServer /> },
    ];

    const isActive = (path) => {
        const regex = new RegExp(`^${path}(\\/|$)`);
        return regex.test(location.pathname);
    };

    return (
        <div
            className="bg-dark text-white p-3 d-flex flex-column"
            style={{
                width: '100%',
                height: '100vh',
                overflow: 'hidden',
                zIndex: 1000
            }}
        >
            <div className="d-flex justify-content-between align-items-center mb-3">
                {!collapsed && <h4 className="mb-0">Menú</h4>}
                <Button
                    onClick={toggleSidebar}
                    variant="outline-light"
                    size="sm"
                    className={`mb-3 d-flex align-items-center justify-content-center ${
                        autoCollapsed ? 'opacity-50' : ''
                    }`}
                    disabled={autoCollapsed}
                    title={autoCollapsed ? 'Colapsado automáticamente por tamaño de pantalla' : 'Colapsar/Expandir sidebar'}
                >
                    {collapsed ? <FaBars /> : <FaChevronLeft />}
                </Button>
            </div>

            <Nav className="flex-column" defaultActiveKey="/">
                {menuItems.map((item) => (
                    <Nav.Item key={item.path}>
                        <Nav.Link
                            as={Link}
                            to={item.path}
                            className={`d-flex align-items-center gap-2 px-2 py-2 rounded ${
                                isActive(item.path)
                                    ? 'bg-primary text-white'
                                    : 'text-white hover-bg'
                            }`}
                        >
                            {item.icon}
                            {!collapsed && item.label}
                        </Nav.Link>
                    </Nav.Item>
                ))}
            </Nav>
        </div>
    );
};

export default Sidebar;
