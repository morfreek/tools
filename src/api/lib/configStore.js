import { promises as fs } from 'fs';
import path from 'path';
import { getConfigsDir } from './paths.js';

// Configuraciones de despliegue continuo: un JSON por proyecto en data/configs/<id>.json
export const getConfigPath = (projectId) => path.join(getConfigsDir(), `${projectId}.json`);

// Leer no crea archivos: un proyecto sin JSON simplemente no tiene configuraciones
export const readConfigs = async (projectId) => {
    try {
        return JSON.parse(await fs.readFile(getConfigPath(projectId), 'utf8'));
    } catch (error) {
        if (error.code === 'ENOENT') return { configs: [] };
        throw error;
    }
};

export const writeConfigs = async (projectId, data) => {
    const configPath = getConfigPath(projectId);
    await fs.mkdir(path.dirname(configPath), { recursive: true });
    await fs.writeFile(configPath, JSON.stringify(data, null, 2));
};

export const removeConfigs = (projectId) => fs.rm(getConfigPath(projectId), { force: true });
