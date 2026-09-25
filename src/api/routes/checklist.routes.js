import express from 'express';
import { openDb } from '../db.js';

const router = express.Router();

// GET /checklist - aspectos con sus puntos de evaluación
router.get('/checklist', async (req, res) => {
    const db = await openDb();
    const aspects = await db.all('SELECT id, name FROM checklist_aspects ORDER BY id');
    const points = await db.all('SELECT * FROM checklist_points ORDER BY id');

    res.json(aspects.map((aspect) => ({
        id: aspect.id,
        name: aspect.name,
        points: points.filter((point) => point.aspect_id === aspect.id),
    })));
});

export default router;
