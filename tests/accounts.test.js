import { describe, it, expect, beforeEach, beforeAll, afterAll } from '@jest/globals';
import { mockDb, mockSessions, resetMocks, setupTestServer, teardownTestServer, getHttpClient, TEST_ACCOUNT } from './setup.js';

describe('Cuentas', () => {
  let httpClient;

  beforeAll(async () => {
    await setupTestServer();
    httpClient = await getHttpClient();
  });

  afterAll(async () => {
    await teardownTestServer();
  });

  beforeEach(() => {
    resetMocks();
  });

  const newAccount = { username: 'ana.perez', name: 'Ana Pérez', password: 'temporal-123', role: 'usuario' };

  it('una cuenta sin rol admin no debe gestionar cuentas, pero sí listar opciones de destino', async () => {
    mockSessions.findSessionAccount.mockResolvedValue({ ...TEST_ACCOUNT, role: 'usuario' });
    mockDb.all.mockResolvedValue([{ id: 1, name: 'Administrador', username: 'admin' }]);

    const list = await httpClient.get('/tools/api/accounts');
    const options = await httpClient.get('/tools/api/accounts/options');

    expect(list.status).toBe(403);
    expect(options.status).toBe(200);
  });

  it('debe listar cuentas con su cantidad de proyectos, sin hashes', async () => {
    mockDb.all.mockResolvedValue([{ id: 1, username: 'admin', name: 'Administrador', role: 'admin', active: 1, must_change_password: 0, project_count: 5 }]);

    const response = await httpClient.get('/tools/api/accounts');

    expect(response.status).toBe(200);
    expect(response.data[0]).toMatchObject({ active: true, must_change_password: false, project_count: 5 });
    expect(mockDb.all.mock.calls[0][0]).not.toContain('password_hash');
  });

  describe('POST /tools/api/accounts', () => {
    it('debe crear una cuenta con contraseña temporal', async () => {
      mockDb.get.mockResolvedValueOnce(undefined);
      mockDb.run.mockResolvedValue({ lastID: 4 });

      const response = await httpClient.post('/tools/api/accounts', newAccount);

      expect(response.status).toBe(201);
      expect(response.data).toMatchObject({ id: 4, username: 'ana.perez', must_change_password: true });
      const [sql, params] = mockDb.run.mock.calls[0];
      expect(sql).toContain('must_change_password) VALUES (?, ?, ?, ?, 1)');
      expect(params[2]).toMatch(/^scrypt\$/);
    });

    it('debe responder 409 si el usuario ya existe', async () => {
      mockDb.get.mockResolvedValueOnce({ id: 2 });

      const response = await httpClient.post('/tools/api/accounts', newAccount);

      expect(response.status).toBe(409);
      expect(mockDb.run).not.toHaveBeenCalled();
    });

    it.each([
      ['un usuario inválido', { username: 'a b' }],
      ['sin nombre', { name: ' ' }],
      ['un rol inválido', { role: 'root' }],
      ['una contraseña corta', { password: '123' }],
    ])('debe rechazar %s', async (_, override) => {
      const response = await httpClient.post('/tools/api/accounts', { ...newAccount, ...override });

      expect(response.status).toBe(400);
      expect(mockDb.run).not.toHaveBeenCalled();
    });
  });

  describe('PUT /tools/api/accounts/:id', () => {
    it('debe desactivar una cuenta y cerrar sus sesiones', async () => {
      mockDb.run.mockResolvedValue({ changes: 1 });

      const response = await httpClient.put('/tools/api/accounts/3', { name: 'Ana', role: 'usuario', active: false });

      expect(response.status).toBe(200);
      expect(mockSessions.deleteAccountSessions).toHaveBeenCalledWith(3);
    });

    it.each([
      ['quitarse el rol de administrador', { role: 'usuario', active: true }],
      ['desactivar su propia cuenta', { role: 'admin', active: false }],
    ])('no debe permitir %s', async (_, body) => {
      const response = await httpClient.put(`/tools/api/accounts/${TEST_ACCOUNT.id}`, { name: 'Admin', ...body });

      expect(response.status).toBe(400);
      expect(mockDb.run).not.toHaveBeenCalled();
    });
  });

  it('PUT /accounts/:id/password debe asignar una contraseña temporal y cerrar sesiones', async () => {
    mockDb.run.mockResolvedValue({ changes: 1 });

    const response = await httpClient.put('/tools/api/accounts/3/password', { password: 'temporal-456' });

    expect(response.status).toBe(200);
    expect(mockDb.run.mock.calls[0][0]).toContain('must_change_password = 1');
    expect(mockSessions.deleteAccountSessions).toHaveBeenCalledWith(3);
  });

  describe('POST /tools/api/accounts/:id/transfer', () => {
    it('debe traspasar todos los proyectos a otra cuenta activa', async () => {
      mockDb.get.mockResolvedValueOnce({ id: 3 }).mockResolvedValueOnce({ id: 1 });
      mockDb.run.mockResolvedValue({ changes: 4 });

      const response = await httpClient.post('/tools/api/accounts/3/transfer', { account_id: 1 });

      expect(response.status).toBe(200);
      expect(response.data.transferred).toBe(4);
      expect(mockDb.run.mock.calls[0][1]).toEqual([1, 3]);
    });

    it('debe rechazar una cuenta de destino desactivada', async () => {
      mockDb.get.mockResolvedValueOnce({ id: 3 }).mockResolvedValueOnce(undefined);

      const response = await httpClient.post('/tools/api/accounts/3/transfer', { account_id: 9 });

      expect(response.status).toBe(400);
      expect(mockDb.run).not.toHaveBeenCalled();
    });
  });
});
