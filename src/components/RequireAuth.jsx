import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSave, FaBan } from 'react-icons/fa';

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
        // Si cancela o cierra el modal, redirige a home
        navigate('/');
    };

    if (!authenticated) {
        return (
            <>
                {/* Overlay / fade */}
                <div
                    className="modal-backdrop fade show"
                    style={{ zIndex: 1040 }}
                    onClick={handleCancel}
                ></div>

                {/* Modal */}
                <div
                    className="modal fade show d-block"
                    tabIndex="-1"
                    role="dialog"
                    style={{ zIndex: 1050 }}
                    aria-modal="true"
                >
                    <div className="modal-dialog modal-dialog-centered" role="document" onClick={e => e.stopPropagation()}>
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Autenticación requerida</h5>
                                <button type="button" className="btn-close" aria-label="Close" onClick={handleCancel}></button>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="modal-body">
                                    <input
                                        className="form-control mb-3"
                                        placeholder="Usuario"
                                        value={user}
                                        onChange={e => setUser(e.target.value)}
                                        autoFocus
                                    />
                                    <input
                                        className="form-control mb-3"
                                        type="password"
                                        placeholder="Contraseña"
                                        value={pass}
                                        onChange={e => setPass(e.target.value)}
                                    />
                                    {error && <div className="text-danger">{error}</div>}
                                </div>
                                <div className="modal-footer">
                                    <button type="submit" className="btn btn-sm btn-success d-inline-flex align-items-center">
                                        <FaSave className="me-2" />Ingresar
                                    </button>
                                    <button type="button" className="btn btn-sm btn-danger d-inline-flex align-items-center" onClick={handleCancel}>
                                        <FaBan className="me-2" />Cancelar
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    return children;
}
