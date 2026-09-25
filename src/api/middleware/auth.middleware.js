import { findSessionAccount, SESSION_COOKIE } from '../lib/sessions.js';

export const readCookie = (req, name) => {
    for (const part of (req.headers.cookie || '').split(';')) {
        const [key, ...value] = part.trim().split('=');
        if (key === name) return decodeURIComponent(value.join('='));
    }
    return null;
};

const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];

// Exige una sesión vigente y deja la cuenta en req.account.
// Las escrituras además deben traer X-Requested-With (lo agrega el cliente axios): un
// formulario de otro sitio no puede enviarlo, y un fetch con esa cabecera requiere CORS.
export const authenticate = async (req, res, next) => {
    if (!SAFE_METHODS.includes(req.method) && req.get('X-Requested-With') !== 'tools') {
        return res.status(403).json({ error: 'Solicitud no permitida' });
    }

    const account = await findSessionAccount(readCookie(req, SESSION_COOKIE));
    if (!account) {
        return res.status(401).json({ error: 'Debe iniciar sesión' });
    }
    req.account = account;

    // Con contraseña temporal solo se permite cambiarla (rutas /auth)
    if (account.must_change_password && !req.path.startsWith('/auth/')) {
        return res.status(403).json({ error: 'Debe cambiar su contraseña antes de continuar' });
    }
    next();
};

export const requireAdmin = (req, res, next) => {
    if (req.account?.role !== 'admin') {
        return res.status(403).json({ error: 'Requiere una cuenta de administrador' });
    }
    next();
};
