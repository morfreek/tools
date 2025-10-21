import express from 'express';
import { openDb } from '../db.js';
import { validateActiveProject } from '../middleware/projects.middleware.js';

const router = express.Router();

// GET /projects - listar proyectos con coordinador y desarrolladores
router.get('/projects', async (req, res) => {
    const db = await openDb();
    // Obtener proyectos con coordinador
    const projects = await db.all(`
        SELECT p.id, p.name, p.code, p.coordinator_id, p.termination_date
        FROM projects p
        JOIN users u ON p.coordinator_id = u.id
        WHERE p.termination_date IS NULL
        ORDER BY p.name
    `);

    // Para cada proyecto obtener desarrolladores
    for (const project of projects) {
        const devs = await db.all(`
            SELECT u.id, u.name
            FROM project_developers pd
            JOIN users u ON pd.user_id = u.id
            WHERE pd.project_id = ?
            `,
            [project.id]
        );
        project.developer_ids = devs.map(d => d.id);
        project.developer_names = devs.map(d => d.name);
    }

    res.json(projects);
});

// GET /projects/:id - Obtener detalle de un proyecto
router.get('/projects/:id', async (req, res) => {
    const db = await openDb();
    const projectId = parseInt(req.params.id, 10);
    const project = await db.get(`
        SELECT p.id, p.name, p.code, p.coordinator_id, p.termination_date, null as developers
        FROM projects p
        WHERE p.id = ?`,
        [projectId]
    );

    if (!project) {
        return res.status(404).json({ error: 'Proyecto no encontrado' });
    }

    project.developers = await db.all(`
        SELECT u.id, u.name
        FROM project_developers pd
        JOIN users u ON pd.user_id = u.id
        WHERE pd.project_id = ?
        `,
        [project.id]
    );

    res.json(project);
});

// POST /projects - crear proyecto
router.post('/projects', async (req, res) => {
    const { name, code, coordinator_id, developer_ids } = req.body;
    if (!name || !code || !coordinator_id || !Array.isArray(developer_ids)) {
        return res.status(400).json({ error: 'Faltan datos obligatorios' });
    }
    const db = await openDb();
    const result = await db.run(
        'INSERT INTO projects (name, code, coordinator_id) VALUES (?, ?, ?)',
        [name, code, coordinator_id]
    );
    const projectId = result.lastID;

    // Insertar desarrolladores
    for (const userId of developer_ids) {
        await db.run(
            'INSERT INTO project_developers (project_id, user_id) VALUES (?, ?)',
            [projectId, userId]
        );
    }

    res.status(201).json({ id: projectId, name, code, coordinator_id, developer_ids });
});

// PUT /projects/:id - actualizar proyecto
router.put('/projects/:id', validateActiveProject, async (req, res) => {
    const projectId = req.params.id;
    const { name, code, coordinator_id, developer_ids } = req.body;
    if (!name || !code || !coordinator_id || !Array.isArray(developer_ids)) {
        return res.status(400).json({ error: 'Faltan datos obligatorios' });
    }
    const db = await openDb();

    // Actualizar datos proyecto
    await db.run(
        'UPDATE projects SET name = ?, code = ?, coordinator_id = ? WHERE id = ?',
        [name, code, coordinator_id, projectId]
    );

    // Borrar desarrolladores existentes
    await db.run('DELETE FROM project_developers WHERE project_id = ?', [projectId]);

    // Insertar nuevos desarrolladores
    for (const userId of developer_ids) {
        await db.run(
            'INSERT INTO project_developers (project_id, user_id) VALUES (?, ?)',
            [projectId, userId]
        );
    }

    res.json({ id: projectId, name, code, coordinator_id, developer_ids });
});

// PATCH /projects/:id/terminate - finalizar proyecto
router.patch('/projects/:id/terminate', async (req, res) => {
    const projectId = req.params.id;
    const db = await openDb();

    try {
        // Verificar que el proyecto existe y no está terminado
        const project = await db.get(
            'SELECT id, name, termination_date FROM projects WHERE id = ?',
            [projectId]
        );

        if (!project) {
            return res.status(404).json({ error: 'Proyecto no encontrado' });
        }

        if (project.termination_date !== null) {
            return res.status(400).json({ error: 'El proyecto ya está finalizado' });
        }

        // Actualizar termination_date con fecha actual
        const now = new Date().toISOString();
        const result = await db.run(
            'UPDATE projects SET termination_date = ? WHERE id = ?',
            [now, projectId]
        );

        if (result.changes === 0) {
            return res.status(500).json({ error: 'No se pudo finalizar el proyecto' });
        }

        res.json({ 
            success: true, 
            message: 'Proyecto finalizado correctamente',
            termination_date: now
        });
    } catch (error) {
        res.status(500).json({ error: 'Error al finalizar el proyecto' });
    }
});

// DELETE /projects/:id - actualizar proyecto
router.delete('/projects/:id', validateActiveProject, async (req, res) => {
    const projectId = req.params.id;
    const db = await openDb();

    try {
        await db.exec('BEGIN');

        // Eliminar relaciones
        // Eliminar resultados de puntos por revisión
        await db.run(
            'DELETE FROM review_point_results WHERE review_id IN (SELECT id FROM project_reviews WHERE project_id = ?)',
            [projectId]
        );
        await db.run('DELETE FROM project_reviews WHERE project_id = ?', [projectId]);
        await db.run('DELETE FROM project_notes WHERE project_id = ?', [projectId]);
        await db.run('DELETE FROM project_developers WHERE project_id = ?', [projectId]);

        // Eliminar el proyecto
        const result = await db.run('DELETE FROM projects WHERE id = ?', [projectId]);

        await db.exec('COMMIT');
        res.json({ success: true, deleted: result.changes });
    } catch (error) {
        await db.exec('ROLLBACK');
        // console.error('Error al eliminar proyecto:', error);
        res.status(500).json({ success: false, message: 'Error al eliminar el proyecto' });
    }
});

export default router;
