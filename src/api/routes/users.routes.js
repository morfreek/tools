import express from 'express';
import { openDb } from '../db.js';

const router = express.Router();

const readName = (body) => (typeof body?.name === 'string' ? body.name.trim() : '');

// GET /users - listar todos los usuarios
router.get('/users', async (req, res) => {
    const db = await openDb();
    const users = await db.all('SELECT id, name FROM users ORDER BY name');
    res.json(users);
});

// POST /users - crear usuario
router.post('/users', async (req, res) => {
    const name = readName(req.body);
    if (!name) return res.status(400).json({ error: 'El nombre es obligatorio' });
    const db = await openDb();
    const result = await db.run('INSERT INTO users (name) VALUES (?)', [name]);
    res.status(201).json({ id: result.lastID, name });
});

// PUT /users/:id - renombrar usuario
router.put('/users/:id', async (req, res) => {
    const name = readName(req.body);
    if (!name) return res.status(400).json({ error: 'El nombre es obligatorio' });
    const db = await openDb();
    const result = await db.run('UPDATE users SET name = ? WHERE id = ?', [name, req.params.id]);
    if (result.changes === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json({ id: Number(req.params.id), name });
});

export default router;
