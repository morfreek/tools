import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Button, Dropdown, Nav } from 'react-bootstrap';
import { FaChevronDown } from 'react-icons/fa';
import ChangePasswordModal from '@c/account/ChangePasswordModal';
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
    const { account, authenticated, isAdmin, logout } = useSession();
    const navigate = useNavigate();
    const [changingPassword, setChangingPassword] = useState(false);

    const handleLogout = async () => {
        await logout();
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
                    <Dropdown align="end">
                        <Dropdown.Toggle variant="link" size="sm" className="usuario d-inline-flex align-items-center gap-1" id="menu-cuenta">
                            {account.name} <FaChevronDown size={10} aria-hidden="true" />
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                            <Dropdown.Header>{account.username} · {isAdmin ? 'Administrador' : 'Usuario'}</Dropdown.Header>
                            <Dropdown.Item onClick={() => setChangingPassword(true)}>Cambiar contraseña</Dropdown.Item>
                            {isAdmin && <Dropdown.Item as={Link} to="/cuentas">Gestionar cuentas</Dropdown.Item>}
                            <Dropdown.Divider />
                            <Dropdown.Item onClick={handleLogout}>Salir</Dropdown.Item>
                        </Dropdown.Menu>
                    </Dropdown>
                )}
            </div>
            <ChangePasswordModal show={changingPassword} onClose={() => setChangingPassword(false)} />
        </header>
    );
}
