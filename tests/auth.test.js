import { describe, it, expect, beforeEach, beforeAll, afterAll } from '@jest/globals';
import { mockDb, mockSessions, resetMocks, setupTestServer, teardownTestServer, getHttpClient, TEST_ACCOUNT, ACTIVE_PROJECT } from './setup.js';
import { hashPassword } from '../src/api/lib/passwords.js';

describe('Autenticación y acceso por cuenta', () => {
  let httpClient;
  let storedHash;

  beforeAll(async () => {
    await setupTestServer();
    httpClient = await getHttpClient();
    storedHash = await hashPassword('clave-segura');
  });

  afterAll(async () => {
    await teardownTestServer();
  });

  beforeEach(() => {
    resetMocks();
  });

  describe('sesión', () => {
    it('debe responder 401 sin una sesión vigente', async () => {
      mockSessions.findSessionAccount.mockResolvedValueOnce(null);

      const response = await httpClient.get('/tools/api/projects');

      expect(response.status).toBe(401);
      expect(response.data).toEqual({ error: 'Debe iniciar sesión' });
    });

    it('debe rechazar escrituras sin la cabecera X-Requested-With', async () => {
      const response = await httpClient.post('/tools/api/users', { name: 'Ana' }, { headers: { 'X-Requested-With': '' } });

      expect(response.status).toBe(403);
      expect(mockDb.run).not.toHaveBeenCalled();
    });

    it('con contraseña temporal solo debe permitir las rutas /auth', async () => {
      mockSessions.findSessionAccount.mockResolvedValue({ ...TEST_ACCOUNT, must_change_password: 1 });

      const blocked = await httpClient.get('/tools/api/projects');
      const me = await httpClient.get('/tools/api/auth/me');

      expect(blocked.status).toBe(403);
      expect(me.status).toBe(200);
      expect(me.data.must_change_password).toBe(true);
    });
  });

  describe('proyectos por cuenta', () => {
    it('debe listar solo los proyectos de la cuenta de la sesión', async () => {
      mockDb.all.mockResolvedValueOnce([]);

      const response = await httpClient.get('/tools/api/projects');

      expect(response.status).toBe(200);
      expect(mockDb.all.mock.calls[0][0]).toContain('p.owner_account_id = ?');
      expect(mockDb.all.mock.calls[0][1]).toEqual([TEST_ACCOUNT.id]);
    });

    it('debe responder 404 ante un proyecto de otra cuenta', async () => {
      mockDb.get.mockResolvedValueOnce({ ...ACTIVE_PROJECT, owner_account_id: 99 });

      const response = await httpClient.get('/tools/api/projects/1/notes');

      expect(response.status).toBe(404);
      expect(response.data).toEqual({ error: 'Proyecto no encontrado' });
      expect(mockDb.all).not.toHaveBeenCalled();
    });

    it('debe asignar el proyecto creado a la cuenta de la sesión', async () => {
      mockDb.exec.mockResolvedValue();
      mockDb.run.mockResolvedValue({ lastID: 7, changes: 1 });

      const response = await httpClient.post('/tools/api/projects', { name: 'P', code: 'C', coordinator_id: 1, developer_ids: [] });

      expect(response.status).toBe(201);
      const insert = mockDb.run.mock.calls.find(([sql]) => sql.startsWith('INSERT INTO projects'));
      expect(insert[1]).toEqual(['P', 'C', 1, TEST_ACCOUNT.id]);
    });

    it('debe transferir el proyecto a otra cuenta activa', async () => {
      mockDb.get.mockResolvedValueOnce(ACTIVE_PROJECT).mockResolvedValueOnce({ id: 2, name: 'Ana' });
      mockDb.run.mockResolvedValue({ changes: 1 });

      const response = await httpClient.patch('/tools/api/projects/1/owner', { account_id: 2 });

      expect(response.status).toBe(200);
      expect(mockDb.run.mock.calls[0][1]).toEqual([2, '1']);
    });

    it.each([
      ['la propia cuenta', { account_id: TEST_ACCOUNT.id }, undefined],
      ['una cuenta inexistente o desactivada', { account_id: 5 }, undefined],
    ])('debe rechazar transferir a %s', async (_, body, target) => {
      mockDb.get.mockResolvedValueOnce(ACTIVE_PROJECT).mockResolvedValueOnce(target);

      const response = await httpClient.patch('/tools/api/projects/1/owner', body);

      expect(response.status).toBe(400);
      expect(mockDb.run).not.toHaveBeenCalled();
    });
  });

  describe('POST /tools/api/auth/login', () => {
    it('debe iniciar sesión y entregar la cookie httpOnly', async () => {
      mockDb.get.mockResolvedValueOnce({ id: 3, username: 'ana', name: 'Ana', role: 'usuario', password_hash: storedHash, must_change_password: 0 });

      const response = await httpClient.post('/tools/api/auth/login', { username: 'ana', password: 'clave-segura' });

      expect(response.status).toBe(200);
      expect(response.data).toEqual({ id: 3, username: 'ana', name: 'Ana', role: 'usuario', must_change_password: false });
      expect(response.data).not.toHaveProperty('password_hash');
      expect(mockSessions.createSession).toHaveBeenCalledWith(3);
      expect(response.headers['set-cookie'][0]).toMatch(/^tools_sesion=token-de-prueba;.*HttpOnly/);
    });

    it('debe rechazar una contraseña incorrecta con un mensaje genérico', async () => {
      mockDb.get.mockResolvedValueOnce({ id: 3, username: 'ana', password_hash: storedHash });

      const response = await httpClient.post('/tools/api/auth/login', { username: 'ana', password: 'otra-clave' });

      expect(response.status).toBe(401);
      expect(response.data).toEqual({ error: 'Usuario o contraseña incorrectos' });
      expect(mockSessions.createSession).not.toHaveBeenCalled();
    });

    it('debe bloquear tras 5 intentos fallidos', async () => {
      mockDb.get.mockResolvedValue(undefined);
      for (let i = 0; i < 5; i += 1) {
        await httpClient.post('/tools/api/auth/login', { username: 'bloqueado', password: 'x' });
      }

      const response = await httpClient.post('/tools/api/auth/login', { username: 'bloqueado', password: 'x' });

      expect(response.status).toBe(429);
    });
  });

  it('POST /auth/logout debe cerrar la sesión actual', async () => {
    const response = await httpClient.post('/tools/api/auth/logout');

    expect(response.status).toBe(200);
    expect(mockSessions.deleteSession).toHaveBeenCalledWith('token-de-prueba');
  });

  describe('PUT /tools/api/auth/password', () => {
    it('debe cambiar la contraseña y renovar la sesión', async () => {
      mockDb.get.mockResolvedValueOnce({ password_hash: storedHash });
      mockDb.run.mockResolvedValue({ changes: 1 });

      const response = await httpClient.put('/tools/api/auth/password', { current_password: 'clave-segura', new_password: 'nueva-clave-1' });

      expect(response.status).toBe(200);
      expect(mockDb.run.mock.calls[0][0]).toContain('must_change_password = 0');
      expect(mockSessions.deleteAccountSessions).toHaveBeenCalledWith(TEST_ACCOUNT.id);
      expect(mockSessions.createSession).toHaveBeenCalledWith(TEST_ACCOUNT.id);
    });

    it.each([
      ['una contraseña actual incorrecta', { current_password: 'mala', new_password: 'nueva-clave-1' }],
      ['una contraseña nueva corta', { current_password: 'clave-segura', new_password: 'corta' }],
      ['la misma contraseña', { current_password: 'clave-segura', new_password: 'clave-segura' }],
    ])('debe rechazar %s', async (_, body) => {
      mockDb.get.mockResolvedValueOnce({ password_hash: storedHash });

      const response = await httpClient.put('/tools/api/auth/password', body);

      expect(response.status).toBe(400);
      expect(mockDb.run).not.toHaveBeenCalled();
    });
  });
});
