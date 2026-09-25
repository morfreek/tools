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
    it('debe crear revisión correctamente', async () => {
      const reviewData = {
        applied_at: '2024-01-01',
        general_notes: 'Revisión completa',
        results: [
          { point_id: 1, status: 'Cumple', observation: 'OK' }
        ]
      };

      mockDb.run.mockResolvedValue({ lastID: 2 });

      const response = await httpClient.post('/tools/api/projects/1/reviews', reviewData);

      expect(response.status).toBe(201);
      expect(response.data).toEqual({ success: true });
    });

    it('debe manejar errores durante creación', async () => {
      mockDb.run.mockRejectedValue(new Error('DB Error'));

      const response = await httpClient.post('/tools/api/projects/1/reviews', {
        applied_at: '2024-01-01', 
        results: []
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
        results: [{ point_id: 1, status: 'invalido', observation: '' }]
      });

      expect(response.status).toBe(500);
      expect(mockDb.exec.mock.calls.map(([sql]) => sql)).toEqual(['BEGIN', 'ROLLBACK']);
    });

    it('debe rechazar revisiones sin resultados', async () => {
      const response = await httpClient.post('/tools/api/projects/1/reviews', { applied_at: '2024-01-01' });

      expect(response.status).toBe(400);
      expect(mockDb.run).not.toHaveBeenCalled();
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
