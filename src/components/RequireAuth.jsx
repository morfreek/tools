import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSession } from '@c/SessionContext';

// Pantalla de acceso para las rutas de proyectos
export default function RequireAuth({ children }) {
    const { authenticated, login } = useSession();
    const [user, setUser] = useState('');
    const [pass, setPass] = useState('');
    const [error, setError] = useState('');

    if (authenticated) return children;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!login(user, pass)) {
            setError('Usuario o contraseña incorrectos');
            setPass('');
        }
    };

    return (
        <div className="pantalla-login">
            <form className="tarjeta-login" onSubmit={handleSubmit}>
                <h1>Herramientas</h1>
                <p className="sub">UDS · DSI — Acceso restringido a proyectos</p>

                <label htmlFor="login-usuario">Usuario</label>
                <input
                    id="login-usuario"
                    value={user}
                    onChange={(e) => setUser(e.target.value)}
                    autoComplete="username"
                    spellCheck="false"
                    autoFocus
                    required
                />

                <label htmlFor="login-clave">Contraseña</label>
                <input
                    id="login-clave"
                    type="password"
                    value={pass}
                    onChange={(e) => setPass(e.target.value)}
                    autoComplete="current-password"
                    required
                />

                {error && <div className="aviso aviso-rojo mx-0 mt-3" role="alert">{error}</div>}

                <button type="submit">Ingresar</button>
                <p className="sub text-center mt-3 mb-0"><Link to="/">Volver al inicio</Link></p>
            </form>
        </div>
    );
}
