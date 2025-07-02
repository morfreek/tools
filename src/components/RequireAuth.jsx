import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSave, FaBan } from 'react-icons/fa';
import { Modal, Form, Button } from 'react-bootstrap';

const USER = 'admin';
const PASS = '1234';

export default function RequireAuth({ children }) {
    const [authenticated, setAuthenticated] = useState(() => {
        return sessionStorage.getItem('authenticated') === 'true';
    });
    const [user, setUser] = useState('');
    const [pass, setPass] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();
        if (user === USER && pass === PASS) {
            setAuthenticated(true);
            sessionStorage.setItem('authenticated', 'true');
            setError('');
        } else {
            setError('Credenciales incorrectas');
        }
    };

    const handleCancel = () => {
        navigate('/');
    };

    if (!authenticated) {
        return (
            <Modal
                show={true}
                onHide={handleCancel}
                fullscreen
                backdrop="static"
                keyboard={false}
                className="bg-light bg-gradient"
            >
                <Modal.Header closeButton className="border-0 bg-transparent">
                    <Modal.Title>Autenticación requerida</Modal.Title>
                </Modal.Header>
                <Modal.Body className="d-flex align-items-center justify-content-center">
                    <Form 
                        onSubmit={handleSubmit} 
                        className="bg-white p-4 rounded-3 shadow-lg"
                        style={{ maxWidth: '400px', width: '100%' }}
                    >
                        <h4 className="text-center mb-4">Iniciar Sesión</h4>
                        <Form.Group className="mb-3">
                            <Form.Control
                                className="border-secondary"
                                placeholder="Usuario"
                                value={user}
                                onChange={e => setUser(e.target.value)}
                                autoFocus
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Control
                                className="border-secondary"
                                type="password"
                                placeholder="Contraseña"
                                value={pass}
                                onChange={e => setPass(e.target.value)}
                            />
                        </Form.Group>
                        {error && <div className="text-danger fw-bold">{error}</div>}
                        <div className="d-flex justify-content-end gap-2 mt-4">
                            <Button variant="success" size="sm" type="submit" className="d-inline-flex align-items-center px-4">
                                <FaSave className="me-2" />Ingresar
                            </Button>
                            <Button variant="danger" size="sm" onClick={handleCancel} className="d-inline-flex align-items-center px-4">
                                <FaBan className="me-2" />Cancelar
                            </Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>
        );
    }

    return children;
}
