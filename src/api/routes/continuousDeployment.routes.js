import express from 'express';
import { promises as fs } from 'fs';
import path from 'path';

const router = express.Router();

// Utility function to manage config files
const getConfigPath = (projectId) => {
    const configDir = path.join(process.cwd(), 'data', 'configs');
    return path.join(configDir, `${projectId}.json`);
};

const ensureConfigFile = async (projectId) => {
    const configPath = getConfigPath(projectId);
    try {
        await fs.mkdir(path.dirname(configPath), { recursive: true });
        try {
            await fs.access(configPath);
        } catch {
            await fs.writeFile(configPath, JSON.stringify({ configs: [] }));
        }
    } catch (err) {
        // console.error('Error ensuring config file:', err);
        throw err;
    }
};

// GET /projects/:id/configs - Obtener configuraciones
router.get('/projects/:id/configs', async (req, res) => {
    try {
        const projectId = req.params.id;
        await ensureConfigFile(projectId);
        const configPath = getConfigPath(projectId);
        const configData = await fs.readFile(configPath, 'utf8');
        res.json(JSON.parse(configData).configs);
    } catch (err) {
        // console.error('Error reading configs:', err);
        res.status(500).json({ error: 'Error al leer las configuraciones', err });
    }
});

// POST /projects/:id/configs - Crear/Actualizar configuración
router.post('/projects/:id/configs', async (req, res) => {
    try {
        const projectId = req.params.id;
        const { name, config } = req.body;

        if (!name || !config) {
            return res.status(400).json({ error: 'Nombre y configuración son requeridos' });
        }

        await ensureConfigFile(projectId);
        const configPath = getConfigPath(projectId);
        const configData = JSON.parse(await fs.readFile(configPath, 'utf8'));
        
        const configIndex = configData.configs.findIndex(c => c.name === name);
        if (configIndex >= 0) {
            configData.configs[configIndex] = { name, config };
        } else {
            configData.configs.push({ name, config });
        }

        await fs.writeFile(configPath, JSON.stringify(configData, null, 2));
        res.json(configData);
    } catch (err) {
        // console.error('Error saving config:', err);
        res.status(500).json({ error: 'Error al guardar la configuración' });
    }
});

// DELETE /projects/:id/configs - Eliminar configuración
router.delete('/projects/:id/configs', async (req, res) => {
    try {
        const projectId = req.params.id;
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Nombre de configuración requerido' });
        }

        const configPath = getConfigPath(projectId);
        const configData = JSON.parse(await fs.readFile(configPath, 'utf8'));
        
        configData.configs = configData.configs.filter(c => c.name !== name);
        
        await fs.writeFile(configPath, JSON.stringify(configData, null, 2));
        res.json(configData);
    } catch (err) {
        // console.error('Error deleting config:', err);
        res.status(500).json({ error: 'Error al eliminar la configuración' });
    }
});

export default router;
