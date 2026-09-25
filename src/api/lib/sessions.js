import { createHash, randomBytes } from 'crypto';
import { openDb } from '../db.js';

// Sesiones en servidor: el navegador guarda un token opaco en una cookie httpOnly
// y la base solo su hash, así que una copia de la base no permite suplantar a nadie.
export const SESSION_COOKIE = 'tools_sesion';
export const SESSION_HOURS = 12;

const hashToken = (token) => createHash('sha256').update(token).digest('hex');

export const createSession = async (accountId) => {
    const db = await openDb();
    const token = randomBytes(32).toString('base64url');
    const now = Date.now();
    await db.run('DELETE FROM sessions WHERE expires_at <= ?', [now]);
    await db.run(
        'INSERT INTO sessions (token_hash, account_id, expires_at) VALUES (?, ?, ?)',
        [hashToken(token), accountId, now + SESSION_HOURS * 60 * 60 * 1000]
    );
    return token;
};

// Cuenta activa dueña de una sesión vigente, o null
export const findSessionAccount = async (token) => {
    if (!token) return null;
    const db = await openDb();
    const account = await db.get(`
        SELECT a.id, a.username, a.name, a.role, a.must_change_password
        FROM sessions s
        JOIN accounts a ON a.id = s.account_id
        WHERE s.token_hash = ? AND s.expires_at > ? AND a.active = 1
    `, [hashToken(token), Date.now()]);
    return account ?? null;
};

export const deleteSession = async (token) => {
    if (!token) return;
    const db = await openDb();
    await db.run('DELETE FROM sessions WHERE token_hash = ?', [hashToken(token)]);
};

// Cierra todas las sesiones de una cuenta (cambio de contraseña, desactivación)
export const deleteAccountSessions = async (accountId) => {
    const db = await openDb();
    await db.run('DELETE FROM sessions WHERE account_id = ?', [accountId]);
};
