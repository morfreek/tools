import { describe, it, expect, beforeEach, beforeAll } from '@jest/globals';
import { mockDb, resetMocks, mockUsers, setupTestServer, getHttpClient } from './setup.js';

describe('Users Endpoints', () => {
  let httpClient;

  beforeAll(async () => {
    await setupTestServer();
    httpClient = await getHttpClient();
  }, 30000);

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
});
