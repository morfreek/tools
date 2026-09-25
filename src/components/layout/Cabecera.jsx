import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Button, Nav } from 'react-bootstrap';
import { useTheme, THEME_LABELS } from '@hk/useTheme';
import { useSession } from '@c/SessionContext';

const SECCIONES = [
    { to: '/', label: 'Inicio', end: true },
    { to: '/projects', label: 'Proyectos' },
    { to: '/jmeter-test-creator', label: 'JMeter' },
    { to: '/phpstan', label: 'PHPStan' },
    { to: '/solicitud-maquina-virtual-upt', label: 'Solicitud de servidores' },
];

export default function Cabecera() {
    const { theme, cycle } = useTheme();
    const { authenticated, logout } = useSession();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <header className="cabecera">
            <div className="marca">
                <strong>Herramientas</strong>
                <span className="sub">UDS · DSI — Administración y soporte técnico</span>
            </div>

            <Nav variant="underline" as="nav" aria-label="Secciones">
                {SECCIONES.map(({ to, label, end }) => (
                    <Nav.Link key={to} as={NavLink} to={to} end={end}>{label}</Nav.Link>
                ))}
            </Nav>

            <div className="acciones ms-auto">
                <Button variant="outline-secondary" size="sm" onClick={cycle} title={`Tema: ${THEME_LABELS[theme]} (automático / claro / oscuro)`}>
                    Tema
                </Button>
                {authenticated && (
                    <>
                        <span className="usuario d-none d-md-inline">admin</span>
                        <Button variant="link" size="sm" onClick={handleLogout}>Salir</Button>
                    </>
                )}
            </div>
        </header>
    );
}
