import { openDb } from '../db.js';

// Toda ruta /projects/:id/... pasa por aquí: el proyecto debe existir y pertenecer a la
// cuenta de la sesión. Un proyecto ajeno responde 404, igual que uno inexistente, para
// no revelar qué proyectos existen. Deja el proyecto en req.project.
export const requireProjectAccess = async (req, res, next) => {
    const db = await openDb();
    const project = await db.get(
        'SELECT id, termination_date, owner_account_id FROM projects WHERE id = ?',
        [req.params.id]
    );

    if (!project || project.owner_account_id !== req.account.id) {
        return res.status(404).json({ error: 'Proyecto no encontrado' });
    }
    req.project = project;
    next();
};

// Bloquea modificaciones en proyectos finalizados (termination_date no nulo).
// Usa el proyecto que cargó requireProjectAccess.
export const validateActiveProject = (req, res, next) => {
    if (!req.project) {
        return res.status(404).json({ error: 'Proyecto no encontrado' });
    }
    if (req.project.termination_date !== null && req.project.termination_date !== undefined) {
        return res.status(400).json({ error: 'No se pueden realizar modificaciones en un proyecto finalizado' });
    }
    next();
};
