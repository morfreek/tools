import { describe, it, expect, beforeEach, beforeAll } from '@jest/globals';
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
        { point_id: 1, status: 'Cumple', observation: 'Todo OK' }
      ];

      mockDb.all
        .mockResolvedValueOnce(mockReviews)
        .mockResolvedValueOnce(mockResults);

      const response = await httpClient.get('/tools/api/projects/1/reviews');

      expect(response.status).toBe(200);
      expect(response.data).toHaveLength(1);
      expect(response.data[0]).toHaveProperty('results');
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
      expect(response.data).toHaveProperty('error');
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
    });
  });
});
