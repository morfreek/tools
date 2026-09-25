import express from 'express';
import { openDb } from '../db.js';
import { validateActiveProject } from '../middleware/projects.middleware.js';
import { withTransaction } from '../lib/withTransaction.js';

const router = express.Router();

// GET /projects/:id/reviews - revisiones de un proyecto con sus resultados
router.get('/projects/:id/reviews', async (req, res) => {
    const db = await openDb();
    const reviews = await db.all(`
        SELECT id, project_id, applied_at, note
        FROM project_reviews
        WHERE project_id = ?
        ORDER BY applied_at DESC
    `, [req.params.id]);

    const results = await db.all(`
        SELECT rpr.review_id, rpr.point_id, COALESCE(NULLIF(rpr.status, ''), 'No aplica') AS status, rpr.observation
        FROM review_point_results rpr
        JOIN project_reviews pr ON pr.id = rpr.review_id
        WHERE pr.project_id = ?
    `, [req.params.id]);

    for (const review of reviews) {
        review.results = results
            .filter((r) => r.review_id === review.id)
            .map(({ point_id, status, observation }) => ({ point_id, status, observation }));
    }

    res.json(reviews);
});

// POST /projects/:id/reviews - crear revisión con sus resultados por punto
router.post('/projects/:id/reviews', validateActiveProject, async (req, res) => {
    const { applied_at, results, general_notes } = req.body ?? {};
    if (!applied_at || !Array.isArray(results)) {
        return res.status(400).json({ error: 'Fecha y resultados son requeridos' });
    }

    try {
        const db = await openDb();
        await withTransaction(db, async () => {
            const result = await db.run(
                'INSERT INTO project_reviews (project_id, applied_at, note) VALUES (?, ?, ?)',
                [req.params.id, applied_at, general_notes || null]
            );
            for (const r of results) {
                await db.run(
                    `INSERT INTO review_point_results (review_id, point_id, status, observation)
                    VALUES (?, ?, ?, ?)`,
                    [result.lastID, r.point_id, r.status, r.observation]
                );
            }
        });
        res.status(201).json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Error al crear la revisión' });
    }
});

// DELETE /projects/:id/reviews - eliminar una revisión y sus resultados
router.delete('/projects/:id/reviews', validateActiveProject, async (req, res) => {
    const projectId = req.params.id;
    const { reviewId } = req.body ?? {};
    if (!reviewId) {
        return res.status(400).json({ error: 'La revisión es requerida' });
    }

    try {
        const db = await openDb();
        await withTransaction(db, async () => {
            await db.run(
                'DELETE FROM review_point_results WHERE review_id IN (SELECT id FROM project_reviews WHERE id = ? AND project_id = ?)',
                [reviewId, projectId]
            );
            await db.run('DELETE FROM project_reviews WHERE id = ? AND project_id = ?', [reviewId, projectId]);
        });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar la revisión' });
    }
});

export default router;
