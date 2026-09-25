import express from 'express';
import { openDb } from '../db.js';
import { hashPassword, verifyPassword, isValidPassword, MIN_PASSWORD_LENGTH } from '../lib/passwords.js';
import { createSession, deleteSession, deleteAccountSessions, SESSION_COOKIE, SESSION_HOURS } from '../lib/sessions.js';
import { authenticate, readCookie } from '../middleware/auth.middleware.js';

const router = express.Router();

// Intentos fallidos por IP y usuario: tras MAX_ATTEMPTS se bloquea durante LOCK_MINUTES
const MAX_ATTEMPTS = 5;
const LOCK_MINUTES = 10;
const failures = new Map();

const attemptKey = (req, username) => `${req.ip}|${username.toLowerCase()}`;

const isLocked = (key) => {
    const entry = failures.get(key);
    if (!entry) return false;
    if (entry.until && entry.until > Date.now()) return true;
    if (entry.until) failures.delete(key);
    return false;
};

const registerFailure = (key) => {
    const entry = failures.get(key) ?? { count: 0, until: null };
    entry.count += 1;
    if (entry.count >= MAX_ATTEMPTS) entry.until = Date.now() + LOCK_MINUTES * 60 * 1000;
    failures.set(key, entry);
};

const setSessionCookie = (req, res, token) => {
    res.cookie(SESSION_COOKIE, token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: req.secure,
        path: '/tools',
        maxAge: SESSION_HOURS * 60 * 60 * 1000,
    });
};

const publicAccount = ({ id, username, name, role, must_change_password }) =>
    ({ id, username, name, role, must_change_password: Boolean(must_change_password) });

// POST /auth/login - inicia sesión con usuario y contraseña
router.post('/auth/login', async (req, res) => {
    const username = typeof req.body?.username === 'string' ? req.body.username.trim() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    if (!username || !password) {
        return res.status(400).json({ error: 'Usuario y contraseña son obligatorios' });
    }

    const key = attemptKey(req, username);
    if (isLocked(key)) {
        return res.status(429).json({ error: `Demasiados intentos fallidos. Intente de nuevo en ${LOCK_MINUTES} minutos` });
    }

    const db = await openDb();
    const account = await db.get(
        'SELECT id, username, name, role, password_hash, must_change_password FROM accounts WHERE username = ? COLLATE NOCASE AND active = 1',
        [username]
    );
    if (!account || !(await verifyPassword(password, account.password_hash))) {
        registerFailure(key);
        return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    }

    failures.delete(key);
    setSessionCookie(req, res, await createSession(account.id));
    res.json(publicAccount(account));
});

// POST /auth/logout - cierra la sesión actual (sin sesión también responde bien)
router.post('/auth/logout', async (req, res) => {
    await deleteSession(readCookie(req, SESSION_COOKIE));
    res.clearCookie(SESSION_COOKIE, { path: '/tools' });
    res.json({ message: 'Sesión cerrada' });
});

// GET /auth/me - cuenta de la sesión actual
router.get('/auth/me', authenticate, (req, res) => {
    res.json(publicAccount(req.account));
});

// PUT /auth/password - cambia la contraseña propia; cierra las demás sesiones
router.put('/auth/password', authenticate, async (req, res) => {
    const { current_password: current, new_password: next } = req.body ?? {};
    if (!isValidPassword(next)) {
        return res.status(400).json({ error: `La nueva contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres` });
    }
    if (next === current) {
        return res.status(400).json({ error: 'La nueva contraseña debe ser distinta de la actual' });
    }

    const db = await openDb();
    const account = await db.get('SELECT password_hash FROM accounts WHERE id = ?', [req.account.id]);
    if (!account || !(await verifyPassword(current ?? '', account.password_hash))) {
        return res.status(400).json({ error: 'La contraseña actual no es correcta' });
    }

    await db.run(
        'UPDATE accounts SET password_hash = ?, must_change_password = 0 WHERE id = ?',
        [await hashPassword(next), req.account.id]
    );
    await deleteAccountSessions(req.account.id);
    setSessionCookie(req, res, await createSession(req.account.id));
    res.json(publicAccount({ ...req.account, must_change_password: 0 }));
});

export default router;
