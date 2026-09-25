import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Form } from 'react-bootstrap';
import { useSession } from '@c/SessionContext';
import { apiErrorMessage } from '@u/apiError';
import PasswordFields, { validatePasswordChange } from '@c/account/PasswordFields';

function LoginForm() {
    const { login } = useSession();
    const [user, setUser] = useState('');
    const [pass, setPass] = useState('');
    const [error, setError] = useState('');
    const [sending, setSending] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSending(true);
        setError('');
        try {
            await login(user.trim(), pass);
        } catch (err) {
            setError(apiErrorMessage(err, 'No se pudo iniciar sesión'));
            setPass('');
        } finally {
            setSending(false);
        }
    };

    return (
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

            <button type="submit" disabled={sending}>{sending ? 'Ingresando…' : 'Ingresar'}</button>
            <p className="sub text-center mt-3 mb-0"><Link to="/">Volver al inicio</Link></p>
        </form>
    );
}

// Primer ingreso o contraseña restablecida: la API no permite nada más hasta cambiarla
function ForcedPasswordChange() {
    const { account, changePassword, logout } = useSession();
    const [values, setValues] = useState({ current: '', next: '', confirm: '' });
    const [error, setError] = useState('');
    const [sending, setSending] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const invalid = validatePasswordChange(values);
        if (invalid) return setError(invalid);
        setSending(true);
        try {
            await changePassword(values.current, values.next);
        } catch (err) {
            setError(apiErrorMessage(err, 'No se pudo cambiar la contraseña'));
        } finally {
            setSending(false);
        }
    };

    return (
        <Form className="tarjeta-login" onSubmit={handleSubmit} noValidate>
            <h1>Cambiar contraseña</h1>
            <p className="sub">Hola, {account.name}. Su contraseña es temporal: defina una nueva para continuar.</p>
            <PasswordFields values={values} onChange={setValues} idPrefix="forzada" currentLabel="Contraseña temporal" />
            {error && <div className="aviso aviso-rojo mx-0" role="alert">{error}</div>}
            <button type="submit" disabled={sending}>{sending ? 'Guardando…' : 'Guardar contraseña'}</button>
            <p className="sub text-center mt-3 mb-0">
                <button type="button" className="enlace" onClick={logout}>Salir</button>
            </p>
        </Form>
    );
}

// Rutas de proyectos: exige sesión (y rol administrador si admin=true)
export default function RequireAuth({ children, admin = false }) {
    const { account, loading, authenticated, isAdmin } = useSession();

    if (loading) return null;
    if (!account) return <div className="pantalla-login"><LoginForm /></div>;
    if (!authenticated) return <div className="pantalla-login"><ForcedPasswordChange /></div>;
    if (admin && !isAdmin) {
        return <div className="aviso aviso-ambar">Esta sección requiere una cuenta de administrador.</div>;
    }
    return children;
}
