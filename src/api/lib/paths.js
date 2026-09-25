import path from 'path';
import { fileURLToPath } from 'url';

// Raíz del repositorio, independiente del directorio desde el que se lance el proceso
export const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');

// Se leen en cada llamada para que las pruebas puedan redefinirlas por entorno
export const getDbPath = () => process.env.DB_PATH || path.join(ROOT_DIR, 'projects.sqlite');
export const getConfigsDir = () => process.env.CONFIGS_DIR || path.join(ROOT_DIR, 'data', 'configs');
