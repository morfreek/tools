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

// Sesión simulada: authenticate recibe siempre esta cuenta salvo que un test cambie
// mockSessions.findSessionAccount (por ejemplo, a null para probar el 401)
export const TEST_ACCOUNT = { id: 1, username: 'admin', name: 'Administrador', role: 'admin', must_change_password: 0 };

export const mockSessions = {
  SESSION_COOKIE: 'tools_sesion',
  SESSION_HOURS: 12,
  createSession: jest.fn(),
  findSessionAccount: jest.fn(),
  deleteSession: jest.fn(),
  deleteAccountSessions: jest.fn(),
};

jest.unstable_mockModule('../src/api/lib/sessions.js', () => mockSessions);

// Proyecto activo de la cuenta de prueba: respuesta por defecto de requireProjectAccess
export const ACTIVE_PROJECT = { id: 1, termination_date: null, owner_account_id: TEST_ACCOUNT.id };

// Helper para resetear mocks. mockReset descarta también las implementaciones,
// para que un mockRejectedValue de un test no se filtre al siguiente.
// db.get responde por defecto un proyecto activo; cada test puede sobrescribirlo.
export const resetMocks = () => {
  mockDb.all.mockReset();
  mockDb.get.mockReset().mockResolvedValue(ACTIVE_PROJECT);
  mockDb.run.mockReset();
  mockDb.exec.mockReset();
  mockSessions.createSession.mockReset().mockResolvedValue('token-de-prueba');
  mockSessions.findSessionAccount.mockReset().mockResolvedValue(TEST_ACCOUNT);
  mockSessions.deleteSession.mockReset();
  mockSessions.deleteAccountSessions.mockReset();
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
  // Misma cookie y cabecera que envía el frontend (authenticate las exige)
  httpClient = axios.create({
    baseURL,
    timeout: 10000,
    validateStatus: () => true,
    headers: { Cookie: 'tools_sesion=token-de-prueba', 'X-Requested-With': 'tools' },
  });
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
