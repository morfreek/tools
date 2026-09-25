import { promises as fs } from 'fs';
import path from 'path';
import { getConfigsDir } from './paths.js';

// Configuraciones de despliegue continuo: un JSON por proyecto en data/configs/<id>.json
export const getConfigPath = (projectId) => path.join(getConfigsDir(), `${projectId}.json`);

const ensureConfigFile = async (projectId) => {
    const configPath = getConfigPath(projectId);
    await fs.mkdir(path.dirname(configPath), { recursive: true });
    try {
        await fs.access(configPath);
    } catch {
        await fs.writeFile(configPath, JSON.stringify({ configs: [] }));
    }
    return configPath;
};

export const readConfigs = async (projectId) => {
    const configPath = await ensureConfigFile(projectId);
    return JSON.parse(await fs.readFile(configPath, 'utf8'));
};

export const writeConfigs = (projectId, data) =>
    fs.writeFile(getConfigPath(projectId), JSON.stringify(data, null, 2));

export const removeConfigs = (projectId) => fs.rm(getConfigPath(projectId), { force: true });
