import express from 'express';
import { openDb } from '../db.js';

const router = express.Router();

router.get('/checklist', async (req, res) => {
    const db = await openDb();
    const aspects = await db.all(`SELECT * FROM checklist_aspects`);
    const checklist = [];

    for (const aspect of aspects) {
        const points = await db.all(`SELECT * FROM checklist_points WHERE aspect_id = ?`, [aspect.id]);
        checklist.push({ id: aspect.id, name: aspect.name, points });
    }

    res.json(checklist);
});

export default router;
