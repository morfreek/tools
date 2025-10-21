import { describe, it, expect, beforeEach, beforeAll } from '@jest/globals';
import { mockDb, resetMocks, setupTestServer, getHttpClient } from './setup.js';

describe('Notes Endpoints', () => {
  let httpClient;

  beforeAll(async () => {
    await setupTestServer();
    httpClient = await getHttpClient();
  }, 30000);

  beforeEach(() => {
    resetMocks();
  });

  describe('GET /tools/api/projects/:id/notes', () => {
    it('debe retornar lista de notas del proyecto', async () => {
      const mockNotes = [
        {
          id: 1,
          project_id: 1,
          detail: 'Primera nota del proyecto',
          created_at: '2024-01-01T10:00:00Z'
        },
        {
          id: 2,
          project_id: 1,
          detail: 'Segunda nota del proyecto',
          created_at: '2024-01-02T15:30:00Z'
        }
      ];

      mockDb.all.mockResolvedValue(mockNotes);

      const response = await httpClient.get('/tools/api/projects/1/notes');

      expect(response.status).toBe(200);
      expect(response.data).toEqual(mockNotes);
      expect(mockDb.all).toHaveBeenCalledWith(
        'SELECT * FROM project_notes WHERE project_id = ? ORDER BY created_at DESC',
        ["1"]
      );
    });

    it('debe manejar errores de base de datos', async () => {
      mockDb.all.mockRejectedValue(new Error('DB Error'));

      const response = await httpClient.get('/tools/api/projects/1/notes');

      expect(response.status).toBe(500);
      expect(response.data).toEqual({ error: 'Error al obtener notas' });
    });
  });

  describe('POST /tools/api/projects/:id/notes', () => {
    it('debe crear una nota correctamente', async () => {
      const noteData = {
        detail: 'Nueva nota importante',
        created_at: '2024-01-15T12:00:00Z'
      };

      mockDb.run.mockResolvedValue({ lastID: 3 });

      const response = await httpClient.post('/tools/api/projects/1/notes', noteData);

      expect(response.status).toBe(201);
      expect(response.data).toEqual({ message: 'Nota creada' });
      expect(mockDb.run).toHaveBeenCalledWith(
        'INSERT INTO project_notes (project_id, detail, created_at) VALUES (?, ?, ?)',
        ["1", 'Nueva nota importante', '2024-01-15T12:00:00Z']
      );
    });

    it('debe crear nota con fecha automática si no se proporciona', async () => {
      const noteData = {
        detail: 'Nota sin fecha'
      };

      mockDb.run.mockResolvedValue({ lastID: 4 });

      const response = await httpClient.post('/tools/api/projects/1/notes', noteData);

      expect(response.status).toBe(201);
      expect(response.data).toEqual({ message: 'Nota creada' });
      expect(mockDb.run).toHaveBeenCalledWith(
        'INSERT INTO project_notes (project_id, detail, created_at) VALUES (?, ?, ?)',
        expect.arrayContaining(["1", 'Nota sin fecha', expect.any(String)])
      );
    });

    it('debe rechazar notas sin detalle', async () => {
      const response = await httpClient.post('/tools/api/projects/1/notes', {});

      expect(response.status).toBe(400);
      expect(response.data).toEqual({ error: 'La nota es requerida' });
    });

    it('debe manejar errores durante creación', async () => {
      mockDb.run.mockRejectedValue(new Error('DB Error'));

      const response = await httpClient.post('/tools/api/projects/1/notes', { 
        detail: 'Nota con error' 
      });

      expect(response.status).toBe(500);
      expect(response.data).toEqual({ error: 'Error al guardar la nota' });
    });
  });

  describe('PUT /tools/api/projects/:id/notes', () => {
    it('debe actualizar una nota correctamente', async () => {
      const updateData = {
        noteId: 1,
        detail: 'Nota actualizada'
      };

      const updatedNotes = [
        {
          id: 1,
          project_id: 1,
          detail: 'Nota actualizada',
          created_at: '2024-01-01T10:00:00Z'
        }
      ];

      mockDb.run.mockResolvedValue({ changes: 1 });
      mockDb.all.mockResolvedValue(updatedNotes);

      const response = await httpClient.put('/tools/api/projects/1/notes', updateData);

      expect(response.status).toBe(200);
      expect(response.data).toEqual(updatedNotes);
    });

    it('debe manejar errores durante actualización', async () => {
      mockDb.run.mockRejectedValue(new Error('DB Error'));

      const response = await httpClient.put('/tools/api/projects/1/notes', { 
        noteId: 1, 
        detail: 'Nota con error' 
      });

      expect(response.status).toBe(500);
      expect(response.data).toHaveProperty('error', 'Error actualizando nota');
    });
  });

  describe('DELETE /tools/api/projects/:id/notes', () => {
    it('debe eliminar una nota correctamente', async () => {
      mockDb.run.mockResolvedValue({ changes: 1 });

      const response = await httpClient.delete('/tools/api/projects/1/notes', {
        data: { noteId: 1 }
      });

      expect(response.status).toBe(200);
      expect(response.data).toEqual({ success: true });
    });

    it('debe manejar errores durante eliminación', async () => {
      mockDb.run.mockRejectedValue(new Error('DB Error'));

      const response = await httpClient.delete('/tools/api/projects/1/notes', {
        data: { noteId: 1 }
      });

      expect(response.status).toBe(500);
      expect(response.data).toHaveProperty('error', 'Error eliminando nota');
    });
  });
});
