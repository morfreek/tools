import { openDb } from '../db.js';

// Bloquea modificaciones en proyectos finalizados (termination_date no nulo)
export const validateActiveProject = async (req, res, next) => {
    const projectId = req.params.id;
    if (!projectId) return next();

    try {
        const db = await openDb();
        const project = await db.get(
            'SELECT termination_date FROM projects WHERE id = ?',
            [projectId]
        );

        if (!project) {
            return res.status(404).json({ error: 'Proyecto no encontrado' });
        }

        if (project.termination_date !== null) {
            return res.status(400).json({ error: 'No se pueden realizar modificaciones en un proyecto finalizado' });
        }
    } catch {
        return res.status(500).json({ error: 'Error al validar el proyecto' });
    }

    next();
};
