import express from 'express';
import { openDb } from '../db.js';
import { hashPassword, isValidPassword, MIN_PASSWORD_LENGTH } from '../lib/passwords.js';
import { deleteAccountSessions } from '../lib/sessions.js';
import { requireAdmin } from '../middleware/auth.middleware.js';

const router = express.Router();

export const ROLES = ['admin', 'usuario'];
const USERNAME = /^[a-z0-9._-]{3,32}$/i;
const text = (value) => (typeof value === 'string' ? value.trim() : '');

// GET /accounts/options - cuentas activas para elegir destino al transferir un proyecto
router.get('/accounts/options', async (req, res) => {
    const db = await openDb();
    res.json(await db.all('SELECT id, name, username FROM accounts WHERE active = 1 ORDER BY name'));
});

// El resto de /accounts es solo para administradores
router.use('/accounts', requireAdmin);

// GET /accounts - cuentas con su cantidad de proyectos
router.get('/accounts', async (req, res) => {
    const db = await openDb();
    const accounts = await db.all(`
        SELECT a.id, a.username, a.name, a.role, a.active, a.must_change_password, a.created_at,
            (SELECT COUNT(*) FROM projects p WHERE p.owner_account_id = a.id) AS project_count
        FROM accounts a
        ORDER BY a.name
    `);
    res.json(accounts.map((a) => ({ ...a, active: Boolean(a.active), must_change_password: Boolean(a.must_change_password) })));
});

// POST /accounts - crea una cuenta con contraseña temporal (se cambia en el primer ingreso)
router.post('/accounts', async (req, res) => {
    const username = text(req.body?.username);
    const name = text(req.body?.name);
    const role = req.body?.role ?? 'usuario';
    const { password } = req.body ?? {};

    if (!USERNAME.test(username)) {
        return res.status(400).json({ error: 'El usuario debe tener entre 3 y 32 caracteres: letras, números, punto, guion o guion bajo' });
    }
    if (!name) return res.status(400).json({ error: 'El nombre es obligatorio' });
    if (!ROLES.includes(role)) return res.status(400).json({ error: 'Rol inválido' });
    if (!isValidPassword(password)) {
        return res.status(400).json({ error: `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres` });
    }

    const db = await openDb();
    const existing = await db.get('SELECT id FROM accounts WHERE username = ? COLLATE NOCASE', [username]);
    if (existing) return res.status(409).json({ error: 'Ya existe una cuenta con ese usuario' });

    const result = await db.run(
        'INSERT INTO accounts (username, name, password_hash, role, must_change_password) VALUES (?, ?, ?, ?, 1)',
        [username, name, await hashPassword(password), role]
    );
    res.status(201).json({ id: result.lastID, username, name, role, active: true, must_change_password: true, project_count: 0 });
});

// PUT /accounts/:id - edita nombre, rol y estado. Nadie puede quitarse el rol ni desactivarse.
router.put('/accounts/:id', async (req, res) => {
    const id = Number(req.params.id);
    const name = text(req.body?.name);
    const { role, active } = req.body ?? {};

    if (!name) return res.status(400).json({ error: 'El nombre es obligatorio' });
    if (!ROLES.includes(role)) return res.status(400).json({ error: 'Rol inválido' });
    if (typeof active !== 'boolean') return res.status(400).json({ error: 'El estado es obligatorio' });
    if (id === req.account.id && (role !== 'admin' || !active)) {
        return res.status(400).json({ error: 'No puede quitarse el rol de administrador ni desactivar su propia cuenta' });
    }

    const db = await openDb();
    const result = await db.run(
        'UPDATE accounts SET name = ?, role = ?, active = ? WHERE id = ?',
        [name, role, active ? 1 : 0, id]
    );
    if (result.changes === 0) return res.status(404).json({ error: 'Cuenta no encontrada' });
    if (!active) await deleteAccountSessions(id);
    res.json({ id, name, role, active });
});

// PUT /accounts/:id/password - asigna una contraseña temporal y cierra sus sesiones
router.put('/accounts/:id/password', async (req, res) => {
    const id = Number(req.params.id);
    const { password } = req.body ?? {};
    if (!isValidPassword(password)) {
        return res.status(400).json({ error: `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres` });
    }

    const db = await openDb();
    const result = await db.run(
        'UPDATE accounts SET password_hash = ?, must_change_password = 1 WHERE id = ?',
        [await hashPassword(password), id]
    );
    if (result.changes === 0) return res.status(404).json({ error: 'Cuenta no encontrada' });
    await deleteAccountSessions(id);
    res.json({ message: 'Contraseña restablecida' });
});

// POST /accounts/:id/transfer - traspasa todos los proyectos de la cuenta a otra activa
router.post('/accounts/:id/transfer', async (req, res) => {
    const id = Number(req.params.id);
    const targetId = Number(req.body?.account_id);
    if (!targetId || targetId === id) {
        return res.status(400).json({ error: 'Debe indicar otra cuenta de destino' });
    }

    const db = await openDb();
    const source = await db.get('SELECT id FROM accounts WHERE id = ?', [id]);
    if (!source) return res.status(404).json({ error: 'Cuenta no encontrada' });
    const target = await db.get('SELECT id FROM accounts WHERE id = ? AND active = 1', [targetId]);
    if (!target) return res.status(400).json({ error: 'La cuenta de destino no existe o está desactivada' });

    const result = await db.run('UPDATE projects SET owner_account_id = ? WHERE owner_account_id = ?', [targetId, id]);
    res.json({ message: 'Proyectos transferidos', transferred: result.changes });
});

export default router;
