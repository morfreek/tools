import { describe, it, expect, beforeEach, beforeAll, afterAll } from '@jest/globals';
import { mockDb, resetMocks, setupTestServer, teardownTestServer, getHttpClient } from './setup.js';

describe('Reviews Endpoints', () => {
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

  describe('GET /tools/api/projects/:id/reviews', () => {
    it('debe retornar lista de revisiones', async () => {
      const mockReviews = [
        { id: 1, project_id: 1, applied_at: '2024-01-01', note: 'Revisión inicial' }
      ];
      const mockResults = [
        { review_id: 1, point_id: 1, status: 'Cumple', observation: 'Todo OK' }
      ];

      mockDb.all
        .mockResolvedValueOnce(mockReviews)
        .mockResolvedValueOnce(mockResults);

      const response = await httpClient.get('/tools/api/projects/1/reviews');

      expect(response.status).toBe(200);
      expect(response.data).toHaveLength(1);
      expect(response.data[0].results).toEqual([
        { point_id: 1, status: 'Cumple', observation: 'Todo OK' }
      ]);
    });
  });

  describe('POST /tools/api/projects/:id/reviews', () => {
    const insertedResults = () => mockDb.run.mock.calls.filter(([sql]) => sql.includes('review_point_results'));

    it('debe crear revisión con checklist, guardando solo los puntos evaluados', async () => {
      mockDb.run.mockResolvedValue({ lastID: 2 });

      const response = await httpClient.post('/tools/api/projects/1/reviews', {
        applied_at: '2024-01-01',
        general_notes: '<p>Revisión completa</p>',
        results: [
          { point_id: 1, status: 'bien', observation: ' OK ' },
          { point_id: 2, status: '', observation: '' }
        ]
      });

      expect(response.status).toBe(201);
      expect(response.data).toEqual({ success: true });
      expect(insertedResults().map(([, params]) => params)).toEqual([[2, 1, 'bien', 'OK']]);
    });

    it('debe crear revisión sin checklist (solo observación general)', async () => {
      mockDb.run.mockResolvedValue({ lastID: 3 });

      const response = await httpClient.post('/tools/api/projects/1/reviews', {
        applied_at: '2024-01-01',
        general_notes: '<p>Se revisó la migración de rutas.</p>'
      });

      expect(response.status).toBe(201);
      expect(mockDb.run).toHaveBeenCalledTimes(1);
      expect(insertedResults()).toHaveLength(0);
    });

    it.each([
      ['sin observación general', undefined],
      ['con observación vacía del editor', '<p><br></p>'],
      ['con solo espacios duros', '<p>&nbsp; </p>']
    ])('debe rechazar revisiones %s', async (_caso, general_notes) => {
      const response = await httpClient.post('/tools/api/projects/1/reviews', {
        applied_at: '2024-01-01', general_notes, results: []
      });

      expect(response.status).toBe(400);
      expect(response.data).toEqual({ error: 'La observación general es obligatoria' });
      expect(mockDb.run).not.toHaveBeenCalled();
    });

    it('debe rechazar revisiones sin fecha', async () => {
      const response = await httpClient.post('/tools/api/projects/1/reviews', { general_notes: 'Texto' });

      expect(response.status).toBe(400);
      expect(response.data).toEqual({ error: 'La fecha de la revisión es obligatoria' });
    });

    it('debe manejar errores durante creación', async () => {
      mockDb.run.mockRejectedValue(new Error('DB Error'));

      const response = await httpClient.post('/tools/api/projects/1/reviews', {
        applied_at: '2024-01-01', general_notes: 'Texto'
      });

      expect(response.status).toBe(500);
      expect(response.data).toEqual({ error: 'Error al crear la revisión' });
      expect(mockDb.exec).toHaveBeenCalledWith('ROLLBACK');
    });

    it('debe revertir la transacción si falla un resultado', async () => {
      mockDb.run
        .mockResolvedValueOnce({ lastID: 7 })
        .mockRejectedValueOnce(new Error('CHECK constraint failed'));

      const response = await httpClient.post('/tools/api/projects/1/reviews', {
        applied_at: '2024-01-01',
        general_notes: 'Texto',
        results: [{ point_id: 1, status: 'invalido', observation: '' }]
      });

      expect(response.status).toBe(500);
      expect(mockDb.exec.mock.calls.map(([sql]) => sql)).toEqual(['BEGIN', 'ROLLBACK']);
    });
  });

  describe('DELETE /tools/api/projects/:id/reviews', () => {
    it('debe eliminar revisión correctamente', async () => {
      mockDb.run.mockResolvedValue({ changes: 1 });

      const response = await httpClient.delete('/tools/api/projects/1/reviews', {
        data: { reviewId: 1 }
      });

      expect(response.status).toBe(200);
      expect(response.data).toEqual({ success: true });
      // Primero los resultados, luego la revisión
      expect(mockDb.run.mock.calls[0][0]).toContain('DELETE FROM review_point_results');
      expect(mockDb.run.mock.calls[1][0]).toContain('DELETE FROM project_reviews');
    });
  });
});
