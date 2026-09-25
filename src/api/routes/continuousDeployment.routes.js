import express from 'express';
import { readConfigs, writeConfigs } from '../lib/configStore.js';

const router = express.Router();

// GET /projects/:id/configs - Obtener configuraciones
router.get('/projects/:id/configs', async (req, res) => {
    try {
        const data = await readConfigs(req.params.id);
        res.json(data.configs);
    } catch {
        res.status(500).json({ error: 'Error al leer las configuraciones' });
    }
});

// POST /projects/:id/configs - Crear/Actualizar configuración
router.post('/projects/:id/configs', async (req, res) => {
    const { name, config } = req.body ?? {};
    if (!name || !config) {
        return res.status(400).json({ error: 'Nombre y configuración son requeridos' });
    }

    try {
        const projectId = req.params.id;
        const data = await readConfigs(projectId);

        const configIndex = data.configs.findIndex(c => c.name === name);
        if (configIndex >= 0) {
            data.configs[configIndex] = { name, config };
        } else {
            data.configs.push({ name, config });
        }

        await writeConfigs(projectId, data);
        res.json(data);
    } catch {
        res.status(500).json({ error: 'Error al guardar la configuración' });
    }
});

// DELETE /projects/:id/configs - Eliminar configuración
router.delete('/projects/:id/configs', async (req, res) => {
    const { name } = req.body ?? {};
    if (!name) {
        return res.status(400).json({ error: 'Nombre de configuración requerido' });
    }

    try {
        const projectId = req.params.id;
        const data = await readConfigs(projectId);
        data.configs = data.configs.filter(c => c.name !== name);

        await writeConfigs(projectId, data);
        res.json(data);
    } catch {
        res.status(500).json({ error: 'Error al eliminar la configuración' });
    }
});

export default router;
