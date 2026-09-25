import express from 'express';
import { openDb } from '../db.js';
import { validateActiveProject } from '../middleware/projects.middleware.js';

const router = express.Router();

// Obtener notas de un proyecto
router.get('/projects/:id/notes', async (req, res) => {
    const projectId = req.params.id;
    try {
        const db = await openDb();
        const notes = await db.all('SELECT * FROM project_notes WHERE project_id = ? ORDER BY created_at DESC', [projectId]);
        res.json(notes);
    } catch {
        res.status(500).json({ error: 'Error al obtener notas' });
    }
});

// Crear una nueva nota
router.post('/projects/:id/notes', validateActiveProject, async (req, res) => {
    const projectId = req.params.id;
    const { detail, created_at } = req.body;

    if (!detail) {
        return res.status(400).json({ error: 'La nota es requerida' });
    }

    try {
        const db = await openDb();
        await db.run(
            'INSERT INTO project_notes (project_id, detail, created_at) VALUES (?, ?, ?)',
            [projectId, detail, created_at || new Date().toISOString()]
        );
        res.status(201).json({ message: 'Nota creada' });
    } catch {
        res.status(500).json({ error: 'Error al guardar la nota' });
    }
});

// Edita una nota
router.put('/projects/:id/notes', validateActiveProject, async (req, res) => {
    const projectId = req.params.id;
    const { noteId, detail } = req.body;
    try {
        const db = await openDb();
        await db.run(
            'UPDATE project_notes SET detail = ? WHERE id = ? and project_id = ?',
            [detail, noteId, projectId]
        );
        const notes = await db.all('SELECT * FROM project_notes WHERE project_id = ? ORDER BY created_at DESC', [projectId]);
        res.json(notes);
    } catch {
        res.status(500).json({ error: 'Error actualizando nota' });
    }
});

// Elimina una nota
router.delete('/projects/:id/notes', validateActiveProject, async (req, res) => {
    const projectId = req.params.id;
    const { noteId } = req.body;
    try {
        const db = await openDb();
        await db.run('DELETE FROM project_notes WHERE id = ? and project_id = ?', [noteId, projectId]);
        res.json({ success: true });
    } catch {
        res.status(500).json({ error: 'Error eliminando nota' });
    }
});

export default router;
