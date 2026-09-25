import { describe, it, expect, beforeEach, beforeAll, afterAll } from '@jest/globals';
import { mockDb, resetMocks, mockProjects, setupTestServer, teardownTestServer, getHttpClient, ACTIVE_PROJECT } from './setup.js';

describe('Projects Endpoints', () => {
  let httpClient;

  beforeAll(async () => {
    await setupTestServer();
    httpClient = await getHttpClient();
  }, 30000); // Aumentar timeout para setup

  afterAll(async () => {
    await teardownTestServer();
  });

  beforeEach(() => {
    resetMocks();
  });

  describe('GET /tools/api/projects', () => {
    it('debe retornar lista de proyectos con desarrolladores', async () => {
      mockDb.all
        .mockResolvedValueOnce(mockProjects.map(({ developer_ids, developer_names, ...p }) => p))
        .mockResolvedValueOnce([{ project_id: 1, id: 2, name: 'Ana García' }]);

      const response = await httpClient.get('/tools/api/projects');

      expect(response.status).toBe(200);
      expect(response.data).toHaveLength(1);
      expect(response.data[0].developer_ids).toEqual([2]);
      expect(response.data[0].developer_names).toEqual(['Ana García']);
      // Desarrolladores de todos los proyectos en una sola consulta (sin N+1)
      expect(mockDb.all).toHaveBeenCalledTimes(2);
      // Última revisión y total de revisiones en la misma consulta del listado
      expect(mockDb.all.mock.calls[0][0]).toContain('AS last_review_at');
      expect(mockDb.all.mock.calls[0][0]).toContain('AS review_count');
    });

    it('debe solicitar proyectos finalizados cuando se indica el estado', async () => {
      const finishedProject = {
        ...mockProjects[0],
        termination_date: '2026-07-01T12:00:00.000Z'
      };

      mockDb.all
        .mockResolvedValueOnce([finishedProject])
        .mockResolvedValueOnce([{ id: 2, name: 'Ana García' }]);

      const response = await httpClient.get('/tools/api/projects?status=finished');

      expect(response.status).toBe(200);
      expect(response.data[0].termination_date).toBe(finishedProject.termination_date);
      expect(mockDb.all.mock.calls[0][0]).toContain('p.termination_date IS NOT NULL');
    });

    it('debe rechazar un estado de proyecto inválido', async () => {
      const response = await httpClient.get('/tools/api/projects?status=invalid');

      expect(response.status).toBe(400);
      expect(response.data).toEqual({ error: 'Estado de proyecto inválido' });
    });
  });

  describe('GET /tools/api/projects/:id', () => {
    it('debe retornar detalle de proyecto existente', async () => {
      const projectDetail = { id: 1, name: 'Proyecto A', code: 'PROJ-A', coordinator_id: 1, owner_account_id: 1 };
      const developers = [{ id: 2, name: 'Ana García' }];

      mockDb.get.mockResolvedValue(projectDetail);
      mockDb.all.mockResolvedValue(developers.map((d) => ({ project_id: 1, ...d })));

      const response = await httpClient.get('/tools/api/projects/1');
      
      expect(response.status).toBe(200);
      expect(response.data).toEqual({
        ...projectDetail,
        developers
      });
    });

    it('debe retornar 404 para proyecto inexistente', async () => {
      mockDb.get.mockResolvedValue(null);

      const response = await httpClient.get('/tools/api/projects/999');

      expect(response.status).toBe(404);
      expect(response.data).toEqual({ error: 'Proyecto no encontrado' });
    });
  });

  describe('POST /tools/api/projects', () => {
    it('debe crear proyecto correctamente', async () => {
      const newProject = {
        name: 'Nuevo Proyecto',
        code: 'NEW-PROJ',
        coordinator_id: 1,
        developer_ids: [2, 3]
      };

      mockDb.run
        .mockResolvedValueOnce({ lastID: 5 })
        .mockResolvedValue({ lastID: 1 });

      const response = await httpClient.post('/tools/api/projects', newProject);

      expect(response.status).toBe(201);
      expect(response.data).toEqual({
        id: 5,
        ...newProject
      });
    });

    it('debe revertir la transacción si falla la asignación de desarrolladores', async () => {
      mockDb.run
        .mockResolvedValueOnce({ lastID: 5 })
        .mockRejectedValueOnce(new Error('FOREIGN KEY constraint failed'));

      const response = await httpClient.post('/tools/api/projects', {
        name: 'Proyecto', code: 'P-1', coordinator_id: 1, developer_ids: [99]
      });

      expect(response.status).toBe(500);
      expect(response.data).toEqual({ error: 'Error al crear el proyecto' });
      expect(mockDb.exec.mock.calls.map(([sql]) => sql)).toEqual(['BEGIN', 'ROLLBACK']);
    });

    it('debe rechazar proyectos con datos incompletos', async () => {
      const response = await httpClient.post('/tools/api/projects', { 
        name: 'Proyecto Incompleto' 
      });

      expect(response.status).toBe(400);
      expect(response.data).toEqual({ error: 'Faltan datos obligatorios' });
    });
  });

  describe('PUT /tools/api/projects/:id', () => {
    it('debe actualizar proyecto correctamente', async () => {
      const updateData = {
        name: 'Proyecto Actualizado',
        code: 'UPD-PROJ',
        coordinator_id: 1,
        developer_ids: [2]
      };

      mockDb.run.mockResolvedValue({ changes: 1 });

      const response = await httpClient.put('/tools/api/projects/1', updateData);

      expect(response.status).toBe(200);
      expect(response.data).toEqual({
        id: '1',
        ...updateData
      });
    });
  });

  describe('validateActiveProject', () => {
    const updateData = { name: 'P', code: 'P-1', coordinator_id: 1, developer_ids: [] };

    it('debe rechazar modificaciones en un proyecto finalizado', async () => {
      mockDb.get.mockResolvedValueOnce({ ...ACTIVE_PROJECT, termination_date: '2026-07-01T12:00:00.000Z' });

      const response = await httpClient.put('/tools/api/projects/1', updateData);

      expect(response.status).toBe(400);
      expect(response.data).toEqual({ error: 'No se pueden realizar modificaciones en un proyecto finalizado' });
      expect(mockDb.run).not.toHaveBeenCalled();
    });

    it('debe retornar 404 si el proyecto no existe', async () => {
      mockDb.get.mockResolvedValueOnce(undefined);

      const response = await httpClient.put('/tools/api/projects/999', updateData);

      expect(response.status).toBe(404);
      expect(response.data).toEqual({ error: 'Proyecto no encontrado' });
    });
  });

  describe('PATCH /tools/api/projects/:id/terminate', () => {
    it('debe finalizar un proyecto activo', async () => {
      mockDb.get.mockResolvedValueOnce(ACTIVE_PROJECT);
      mockDb.run.mockResolvedValue({ changes: 1 });

      const response = await httpClient.patch('/tools/api/projects/1/terminate');

      expect(response.status).toBe(200);
      expect(response.data).toMatchObject({ success: true, message: 'Proyecto finalizado correctamente' });
      expect(response.data.termination_date).toEqual(expect.any(String));
    });

    it('debe rechazar un proyecto ya finalizado', async () => {
      mockDb.get.mockResolvedValueOnce({ ...ACTIVE_PROJECT, termination_date: '2026-07-01T12:00:00.000Z' });

      const response = await httpClient.patch('/tools/api/projects/1/terminate');

      expect(response.status).toBe(400);
      expect(response.data).toEqual({ error: 'El proyecto ya está finalizado' });
    });

    it('debe retornar 404 para proyecto inexistente', async () => {
      mockDb.get.mockResolvedValueOnce(undefined);

      const response = await httpClient.patch('/tools/api/projects/999/terminate');

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /tools/api/projects/:id', () => {
    it('debe eliminar proyecto correctamente', async () => {
      mockDb.run.mockResolvedValue({ changes: 1 });
      mockDb.exec.mockResolvedValue();

      const response = await httpClient.delete('/tools/api/projects/1');

      expect(response.status).toBe(200);
      expect(response.data).toEqual({ success: true, deleted: 1 });
      const statements = mockDb.run.mock.calls.map(([sql]) => sql);
      expect(statements).toContain('DELETE FROM project_files WHERE project_id = ?');
      expect(statements.at(-1)).toBe('DELETE FROM projects WHERE id = ?');
    });

    it('debe manejar errores durante eliminación', async () => {
      mockDb.exec.mockRejectedValueOnce(new Error('DB Error'));
      
      const response = await httpClient.delete('/tools/api/projects/1');
        
      expect(response.status).toBe(500);
      expect(response.data).toEqual({
        success: false,
        message: 'Error al eliminar el proyecto'
      });
    });
  });
});
