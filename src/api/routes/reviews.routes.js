import express from 'express';
import { openDb } from '../db.js';
import { validateActiveProject } from '../middleware/projects.middleware.js';

const router = express.Router();

// GET /projects/:id/reviews - listado de reviews de un proyecto
router.get('/projects/:id/reviews', async (req, res) => {
    const db = await openDb();
    const reviews = await db.all(`
        SELECT id, project_id, applied_at, note
        FROM project_reviews
        WHERE project_id = ?
        ORDER BY applied_at DESC
    `,
    [req.params.id]);

    for (const review of reviews) {
        const results = await db.all(`
            SELECT rpr.point_id, COALESCE(NULLIF(rpr.status, ''), 'No aplica') AS status, rpr.observation
            FROM review_point_results rpr
            WHERE rpr.review_id = ?
        `, [review.id]);

        review.results = results;
    }

    res.json(reviews);
});

// POST /projects/:id/reviews - crea review de un proyecto
router.post('/projects/:id/reviews', validateActiveProject, async (req, res) => {
    const db = await openDb();
    const { applied_at, results, general_notes } = req.body;

    try {
        const result = await db.run(
            `INSERT INTO project_reviews (project_id, applied_at, note) VALUES (?, ?, ?)`,
            [req.params.id, applied_at, general_notes || null]
        );

        const reviewId = result.lastID;

        for (const r of results) {
            await db.run(
                `INSERT INTO review_point_results (review_id, point_id, status, observation)
                VALUES (?, ?, ?, ?)`,
                [reviewId, r.point_id, r.status, r.observation]
            );
        }

        res.status(201).json({ success: true });
    } catch (error) {
        // console.error('Error al crear revisión:', error);
        res.status(500).json({ error: 'Error al crear la revisión' });
    }
});

// DELETE /projects/:id/reviews - elimina review de un proyecto
router.delete('/projects/:id/reviews', validateActiveProject, async (req, res) => {
    const db = await openDb();
    const projectId = req.params.id;
    const { reviewId } = req.body;
    try {
        await db.run('DELETE FROM project_reviews WHERE id = ? and project_id = ?', [reviewId, projectId]);
        res.json({ success: true });
    } catch (err) {
        // console.error(err);
        res.status(500).json({ error: 'Error eliminando nota', err });
    }
});

export default router;
