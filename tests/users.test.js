import { describe, it, expect, beforeEach, beforeAll, afterAll } from '@jest/globals';
import { mockDb, resetMocks, mockUsers, setupTestServer, teardownTestServer, getHttpClient } from './setup.js';

describe('Users Endpoints', () => {
  let httpClient;

  beforeAll(async () => {
    await setupTestServer();
    httpClient = await getHttpClient();
  }, 30000);

  afterAll(async () => {
    await teardownTestServer();
  });

  beforeEach(() => {
    resetMocks();
  });

  describe('GET /tools/api/users', () => {
    it('debe retornar lista de usuarios', async () => {
      mockDb.all.mockResolvedValue(mockUsers);

      const response = await httpClient.get('/tools/api/users');

      expect(response.status).toBe(200);
      expect(response.data).toEqual(mockUsers);
      expect(mockDb.all).toHaveBeenCalledWith('SELECT id, name FROM users ORDER BY name');
    });

    it('debe manejar errores de base de datos', async () => {
      mockDb.all.mockRejectedValue(new Error('DB Error'));

      const response = await httpClient.get('/tools/api/users');

      expect(response.status).toBe(500);
    });
  });

  describe('POST /tools/api/users', () => {
    it('debe crear un usuario correctamente', async () => {
      const newUser = { name: 'Carlos López' };
      mockDb.run.mockResolvedValue({ lastID: 3 });

      const response = await httpClient.post('/tools/api/users', newUser);

      expect(response.status).toBe(201);
      expect(response.data).toEqual({ id: 3, name: 'Carlos López' });
      expect(mockDb.run).toHaveBeenCalledWith(
        'INSERT INTO users (name) VALUES (?)',
        ['Carlos López']
      );
    });

    it('debe rechazar usuarios sin nombre', async () => {
      const response = await httpClient.post('/tools/api/users', {});

      expect(response.status).toBe(400);
      expect(response.data).toEqual({ error: 'El nombre es obligatorio' });
    });
  });

  describe('PUT /tools/api/users/:id', () => {
    it('debe actualizar el nombre del usuario', async () => {
      mockDb.run.mockResolvedValue({ changes: 1 });

      const response = await httpClient.put('/tools/api/users/1', { name: '  Juan Pérez Soto ' });

      expect(response.status).toBe(200);
      expect(response.data).toEqual({ id: 1, name: 'Juan Pérez Soto' });
      expect(mockDb.run).toHaveBeenCalledWith('UPDATE users SET name = ? WHERE id = ?', ['Juan Pérez Soto', '1']);
    });

    it('debe rechazar un nombre vacío', async () => {
      const response = await httpClient.put('/tools/api/users/1', { name: '   ' });

      expect(response.status).toBe(400);
      expect(mockDb.run).not.toHaveBeenCalled();
    });

    it('debe retornar 404 para usuario inexistente', async () => {
      mockDb.run.mockResolvedValue({ changes: 0 });

      const response = await httpClient.put('/tools/api/users/999', { name: 'Nadie' });

      expect(response.status).toBe(404);
      expect(response.data).toEqual({ error: 'Usuario no encontrado' });
    });
  });

  describe('Manejo central de errores', () => {
    it('debe responder JSON genérico sin detalles internos', async () => {
      mockDb.all.mockRejectedValue(new Error('SQLITE_BUSY: detalle interno'));

      const response = await httpClient.get('/tools/api/users');

      expect(response.status).toBe(500);
      expect(response.data).toEqual({ error: 'Error interno del servidor' });
    });

    it('debe responder 400 ante JSON mal formado', async () => {
      const response = await httpClient.post('/tools/api/users', '{"name":', {
        headers: { 'Content-Type': 'application/json' },
        transformRequest: [(data) => data]
      });

      expect(response.status).toBe(400);
      expect(response.data).toEqual({ error: 'El cuerpo de la solicitud no es JSON válido' });
    });

    it('debe responder 404 JSON para rutas inexistentes', async () => {
      const response = await httpClient.get('/tools/api/no-existe');

      expect(response.status).toBe(404);
      expect(response.data).toEqual({ error: 'Ruta no encontrada' });
    });
  });
});
