import express from 'express';
import { openDb } from '../db.js';
import { validateActiveProject } from '../middleware/projects.middleware.js';
import { withTransaction } from '../lib/withTransaction.js';
import { removeConfigs } from '../lib/configStore.js';

const router = express.Router();

const STATUS_CONDITIONS = {
    active: 'p.termination_date IS NULL',
    finished: 'p.termination_date IS NOT NULL'
};

// Desarrolladores de varios proyectos en una sola consulta, agrupados por proyecto
const getDevelopersByProject = async (db, projectIds) => {
    const byProject = new Map(projectIds.map((id) => [id, []]));
    if (projectIds.length === 0) return byProject;

    const rows = await db.all(`
        SELECT pd.project_id, u.id, u.name
        FROM project_developers pd
        JOIN users u ON pd.user_id = u.id
        WHERE pd.project_id IN (${projectIds.map(() => '?').join(', ')})
        ORDER BY u.name
    `, projectIds);

    for (const { project_id, id, name } of rows) {
        byProject.get(project_id)?.push({ id, name });
    }
    return byProject;
};

const replaceDevelopers = async (db, projectId, developerIds) => {
    await db.run('DELETE FROM project_developers WHERE project_id = ?', [projectId]);
    for (const userId of developerIds) {
        await db.run(
            'INSERT INTO project_developers (project_id, user_id) VALUES (?, ?)',
            [projectId, userId]
        );
    }
};

const readProjectBody = (body) => {
    const { name, code, coordinator_id, developer_ids } = body ?? {};
    if (!name || !code || !coordinator_id || !Array.isArray(developer_ids)) return null;
    return { name, code, coordinator_id, developer_ids };
};

// GET /projects - listar proyectos activos (por defecto) o finalizados
router.get('/projects', async (req, res) => {
    const { status = 'active' } = req.query;
    const condition = STATUS_CONDITIONS[status];

    if (!condition) {
        return res.status(400).json({ error: 'Estado de proyecto inválido' });
    }

    const db = await openDb();
    // last_review_at y review_count alimentan el panel de trabajo del Inicio
    const projects = await db.all(`
        SELECT p.id, p.name, p.code, p.coordinator_id, p.termination_date,
            (SELECT MAX(r.applied_at) FROM project_reviews r WHERE r.project_id = p.id) AS last_review_at,
            (SELECT COUNT(*) FROM project_reviews r WHERE r.project_id = p.id) AS review_count
        FROM projects p
        JOIN users u ON p.coordinator_id = u.id
        WHERE ${condition}
        ORDER BY p.name
    `);

    const developers = await getDevelopersByProject(db, projects.map((p) => p.id));
    for (const project of projects) {
        const devs = developers.get(project.id) ?? [];
        project.developer_ids = devs.map((d) => d.id);
        project.developer_names = devs.map((d) => d.name);
    }

    res.json(projects);
});

// GET /projects/:id - detalle de un proyecto
router.get('/projects/:id', async (req, res) => {
    const db = await openDb();
    const projectId = parseInt(req.params.id, 10);
    const project = await db.get(`
        SELECT p.id, p.name, p.code, p.coordinator_id, p.termination_date
        FROM projects p
        WHERE p.id = ?`,
        [projectId]
    );

    if (!project) {
        return res.status(404).json({ error: 'Proyecto no encontrado' });
    }

    const developers = await getDevelopersByProject(db, [project.id]);
    project.developers = developers.get(project.id) ?? [];

    res.json(project);
});

// POST /projects - crear proyecto con sus desarrolladores
router.post('/projects', async (req, res) => {
    const data = readProjectBody(req.body);
    if (!data) {
        return res.status(400).json({ error: 'Faltan datos obligatorios' });
    }

    const db = await openDb();
    try {
        const projectId = await withTransaction(db, async () => {
            const result = await db.run(
                'INSERT INTO projects (name, code, coordinator_id) VALUES (?, ?, ?)',
                [data.name, data.code, data.coordinator_id]
            );
            await replaceDevelopers(db, result.lastID, data.developer_ids);
            return result.lastID;
        });
        res.status(201).json({ id: projectId, ...data });
    } catch (error) {
        res.status(500).json({ error: 'Error al crear el proyecto' });
    }
});

// PUT /projects/:id - actualizar proyecto y reemplazar sus desarrolladores
router.put('/projects/:id', validateActiveProject, async (req, res) => {
    const projectId = req.params.id;
    const data = readProjectBody(req.body);
    if (!data) {
        return res.status(400).json({ error: 'Faltan datos obligatorios' });
    }

    const db = await openDb();
    try {
        await withTransaction(db, async () => {
            await db.run(
                'UPDATE projects SET name = ?, code = ?, coordinator_id = ? WHERE id = ?',
                [data.name, data.code, data.coordinator_id, projectId]
            );
            await replaceDevelopers(db, projectId, data.developer_ids);
        });
        res.json({ id: projectId, ...data });
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar el proyecto' });
    }
});

// PATCH /projects/:id/terminate - finalizar proyecto
router.patch('/projects/:id/terminate', async (req, res) => {
    const projectId = req.params.id;

    try {
        const db = await openDb();
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

// DELETE /projects/:id - eliminar proyecto con todo su contenido
router.delete('/projects/:id', validateActiveProject, async (req, res) => {
    const projectId = req.params.id;

    try {
        const db = await openDb();
        const deleted = await withTransaction(db, async () => {
            await db.run(
                'DELETE FROM review_point_results WHERE review_id IN (SELECT id FROM project_reviews WHERE project_id = ?)',
                [projectId]
            );
            await db.run('DELETE FROM project_reviews WHERE project_id = ?', [projectId]);
            await db.run('DELETE FROM project_notes WHERE project_id = ?', [projectId]);
            await db.run('DELETE FROM project_files WHERE project_id = ?', [projectId]);
            await db.run('DELETE FROM project_developers WHERE project_id = ?', [projectId]);
            const result = await db.run('DELETE FROM projects WHERE id = ?', [projectId]);
            return result.changes;
        });

        // Fuera de la transacción: si falla, el proyecto ya no existe y el JSON queda huérfano sin efecto
        await removeConfigs(projectId).catch(() => {});

        res.json({ success: true, deleted });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al eliminar el proyecto' });
    }
});

export default router;
