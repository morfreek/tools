import { openDb } from '../db.js';

// Middleware para validar que el proyecto esté activo (termination_date null)
export const validateActiveProject = async (req, res, next) => {
    const projectId = req.params.id;
    if (!projectId) return next(); // Skip si no hay ID de proyecto
    
    const db = await openDb();
    try {
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
        
        next();
    } catch (error) {
        res.status(500).json({ error: 'Error al validar el proyecto' });
    }
};