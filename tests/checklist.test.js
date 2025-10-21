import { describe, it, expect, beforeEach, beforeAll } from '@jest/globals';
import { mockDb, resetMocks, mockChecklist, setupTestServer, getHttpClient } from './setup.js';

describe('Checklist Endpoint', () => {
  let httpClient;

  beforeAll(async () => {
    await setupTestServer();
    httpClient = await getHttpClient();
  }, 30000);

  beforeEach(() => {
    resetMocks();
  });

  describe('GET /tools/api/checklist', () => {
    it('debe retornar checklist con aspectos y puntos', async () => {
      const aspects = [{ id: 1, name: 'Aspecto 1' }];
      const points = [{ id: 1, aspect_id: 1, description: 'Punto 1' }];

      mockDb.all
        .mockResolvedValueOnce(aspects)
        .mockResolvedValueOnce(points);

      const response = await httpClient.get('/tools/api/checklist');

      expect(response.status).toBe(200);
      expect(response.data).toHaveLength(1);
      expect(response.data[0]).toHaveProperty('points');
      expect(response.data[0].points).toHaveLength(1);
    });
  });
});
