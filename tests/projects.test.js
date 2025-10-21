import { describe, it, expect, beforeEach, beforeAll } from '@jest/globals';
import { mockDb, resetMocks, mockProjects, setupTestServer, getHttpClient } from './setup.js';

describe('Projects Endpoints', () => {
  let httpClient;

  beforeAll(async () => {
    await setupTestServer();
    httpClient = await getHttpClient();
  }, 30000); // Aumentar timeout para setup

  beforeEach(() => {
    resetMocks();
  });

  describe('GET /tools/api/projects', () => {
    it('debe retornar lista de proyectos con desarrolladores', async () => {
      mockDb.all
        .mockResolvedValueOnce(mockProjects)
        .mockResolvedValueOnce([{ id: 2, name: 'Ana García' }]);

      const response = await httpClient.get('/tools/api/projects');

      expect(response.status).toBe(200);
      expect(response.data).toHaveLength(1);
      expect(response.data[0]).toHaveProperty('developer_ids');
      expect(response.data[0]).toHaveProperty('developer_names');
    });
  });

  describe('GET /tools/api/projects/:id', () => {
    it('debe retornar detalle de proyecto existente', async () => {
      const projectDetail = { id: 1, name: 'Proyecto A', code: 'PROJ-A', coordinator_id: 1 };
      const developers = [{ id: 2, name: 'Ana García' }];

      mockDb.get.mockResolvedValue(projectDetail);
      mockDb.all.mockResolvedValue(developers);

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

  describe('DELETE /tools/api/projects/:id', () => {
    it('debe eliminar proyecto correctamente', async () => {
      mockDb.run.mockResolvedValue({ changes: 1 });
      mockDb.exec.mockResolvedValue();

      const response = await httpClient.delete('/tools/api/projects/1');

      expect(response.status).toBe(200);
      expect(response.data).toEqual({ success: true, deleted: 1 });
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
