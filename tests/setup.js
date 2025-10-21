import { jest } from '@jest/globals';
import axios from 'axios';
import { startTestServer, stopTestServer, getServerUrl } from './test-server.js';

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

// Helper para resetear mocks
export const resetMocks = () => {
  mockDb.all.mockClear();
  mockDb.get.mockClear();
  mockDb.run.mockClear();
  mockDb.exec.mockClear();
};

// Helper para resetear mocks del sistema de archivos
export const resetFsMocks = (mockFs) => {
  if (mockFs.readFile) mockFs.readFile.mockClear();
  if (mockFs.writeFile) mockFs.writeFile.mockClear();
  if (mockFs.mkdir) mockFs.mkdir.mockClear();
  if (mockFs.access) mockFs.access.mockClear();
};

// Cliente HTTP para tests
export let httpClient;

// Variable global para controlar el servidor
let serverInstance = null;
let serverStartPromise = null;
let setupCount = 0;

// Setup global para todos los tests
export const setupTestServer = async () => {
  setupCount++;
  
  // Si ya hay un servidor iniciándose, esperar a que termine
  if (serverStartPromise) {
    await serverStartPromise;
    return;
  }

  // Si ya hay un servidor activo, solo crear el cliente
  if (serverInstance) {
    if (!httpClient) {
      httpClient = axios.create({
        baseURL: serverInstance,
        timeout: 10000,
        validateStatus: () => true
      });
    }
    return;
  }

  // Iniciar servidor solo si no existe
  serverStartPromise = startTestServer();
  try {
    serverInstance = await serverStartPromise;
    httpClient = axios.create({
      baseURL: serverInstance,
      timeout: 10000,
      validateStatus: () => true
    });
  } finally {
    serverStartPromise = null;
  }
};

export const teardownTestServer = async () => {
  setupCount--;
  // Solo cerrar cuando no haya más test suites activos
  if (setupCount <= 0 && serverInstance) {
    await stopTestServer();
    serverInstance = null;
    httpClient = null;
    setupCount = 0;
  }
};

// Función para obtener el cliente HTTP (crear si no existe)
export const getHttpClient = async () => {
  if (!httpClient) {
    await setupTestServer();
  }
  return httpClient;
};

// Global teardown para Jest
export const globalTeardown = async () => {
  if (serverInstance) {
    await stopTestServer();
    serverInstance = null;
    httpClient = null;
  }
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

export const mockChecklist = [
  {
    id: 1,
    name: 'Aspecto 1',
    points: [
      { id: 1, aspect_id: 1, description: 'Punto 1' }
    ]
  }
];

// Mock data para notas
export const mockNotes = [
  {
    id: 1,
    project_id: 1,
    detail: 'Nota de prueba',
    created_at: '2024-01-01T10:00:00Z'
  }
];

// Mock data para configuraciones
export const mockConfigs = [
  {
    name: 'desarrollo',
    config: { database_url: 'localhost', debug: true }
  },
  {
    name: 'produccion',
    config: { database_url: 'prod.server.com', debug: false }
  }
];
