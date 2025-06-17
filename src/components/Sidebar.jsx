import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    FaBars,
    FaChevronLeft,
    FaHome,
    FaProjectDiagram,
    FaBolt,
    FaSearch
} from 'react-icons/fa';

const Sidebar = () => {
    const location = useLocation();
    const [collapsed, setCollapsed] = useState(() => {
        return localStorage.getItem('sidebar-collapsed') === 'true';
    });

    useEffect(() => {
        localStorage.setItem('sidebar-collapsed', collapsed);
    }, [collapsed]);

    const toggleSidebar = () => {
        setCollapsed(prev => !prev);
    };

    const menuItems = [
        { path: '/', label: 'Inicio', icon: <FaHome /> },
        { path: '/projects', label: 'Proyectos', icon: <FaProjectDiagram /> },
        { path: '/jmeter-test-generator', label: 'JMeter test generator', icon: <FaBolt /> },
        { path: '/phpstan', label: 'Visor PHPStan', icon: <FaSearch /> },
    ];

    const isActive = (path) => {
        const regex = new RegExp(`^${path}(\\/|$)`);
        return regex.test(location.pathname);
    };

    return (
        <div
            className="bg-dark text-white p-3 d-flex flex-column"
            style={{
                width: collapsed ? '60px' : '250px',
                transition: 'width 0.3s',
                position: 'sticky',
                top: 0,
                height: '100vh',
                overflow: 'hidden',
                zIndex: 1000
            }}
        >
            <div className="d-flex justify-content-between align-items-center mb-3">
                {!collapsed && <h4 className="mb-0">Menú</h4>}
                <button
                    onClick={toggleSidebar}
                    className="btn btn-sm btn-outline-light mb-3 d-flex align-items-center justify-content-center"
                >
                    {collapsed ? <FaBars /> : <FaChevronLeft />}
                </button>
            </div>

            <ul className="nav flex-column">
                {menuItems.map((item) => (
                    <li className="nav-item" key={item.path}>
                        <Link
                            to={item.path}
                            className={`nav-link d-flex align-items-center gap-2 px-2 py-2 rounded ${isActive(item.path)
                                ? 'bg-primary text-white'
                                : 'text-white hover-bg'
                                }`}
                            style={{ textDecoration: 'none' }}
                        >
                            {item.icon}
                            {!collapsed && item.label}
                        </Link>
                    </li>
                ))}
            </ul>

            {/* Hover styles */}
            <style>{`
                .hover-bg:hover {
                    background-color: #495057;
                    color: white;
                }
            `}</style>
        </div>
    );
};

export default Sidebar;
