import { jest } from '@jest/globals';
import axios from 'axios';
import { startTestServer, stopTestServer } from './test-server.js';

// Mock de la base de datos
export const mockDb = {
  all: jest.fn(),
  get: jest.fn(),
  run: jest.fn(),
  exec: jest.fn()
};

// Mock del módulo de base de datos
jest.unstable_mockModule('../src/api/db.js', () => ({
  openDb: jest.fn(() => Promise.resolve(mockDb))
}));

// Proyecto activo: respuesta por defecto de la consulta de validateActiveProject
export const ACTIVE_PROJECT = { termination_date: null };

// Helper para resetear mocks. mockReset descarta también las implementaciones,
// para que un mockRejectedValue de un test no se filtre al siguiente.
// db.get responde por defecto un proyecto activo; cada test puede sobrescribirlo.
export const resetMocks = () => {
  mockDb.all.mockReset();
  mockDb.get.mockReset().mockResolvedValue(ACTIVE_PROJECT);
  mockDb.run.mockReset();
  mockDb.exec.mockReset();
};

// Helper para resetear mocks del sistema de archivos
export const resetFsMocks = (mockFs) => {
  if (mockFs.readFile) mockFs.readFile.mockClear();
  if (mockFs.writeFile) mockFs.writeFile.mockClear();
  if (mockFs.mkdir) mockFs.mkdir.mockClear();
  if (mockFs.access) mockFs.access.mockClear();
};

// Cliente HTTP para tests. validateStatus acepta cualquier código para
// que cada test verifique el status esperado.
export let httpClient = null;

// Cada suite levanta su servidor en beforeAll y lo cierra en afterAll
export const setupTestServer = async () => {
  const baseURL = await startTestServer();
  httpClient = axios.create({ baseURL, timeout: 10000, validateStatus: () => true });
};

export const teardownTestServer = async () => {
  await stopTestServer();
  httpClient = null;
};

export const getHttpClient = async () => {
  if (!httpClient) await setupTestServer();
  return httpClient;
};

// Mock data común
export const mockUsers = [
  { id: 1, name: 'Juan Pérez' },
  { id: 2, name: 'Ana García' }
];

export const mockProjects = [
  {
    id: 1,
    name: 'Proyecto A',
    code: 'PROJ-A',
    coordinator_id: 1,
    developer_ids: [2],
    developer_names: ['Ana García']
  }
];
