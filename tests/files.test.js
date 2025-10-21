import { describe, it, expect, beforeEach, beforeAll } from '@jest/globals';
import { mockDb, resetMocks, setupTestServer, getHttpClient } from './setup.js';
import FormData from 'form-data';

describe('Files Endpoints', () => {
  let httpClient;

  beforeAll(async () => {
    await setupTestServer();
    httpClient = await getHttpClient();
  }, 30000);

  beforeEach(() => {
    resetMocks();
  });

  describe('GET /tools/api/projects/:id/files', () => {
    it('debe retornar lista de archivos', async () => {
      const mockFiles = [
        {
          id: 1,
          filename: 'documento.pdf',
          mime_type: 'application/pdf',
          file_size: 1024,
          created_at: '2024-01-01'
        }
      ];

      mockDb.all.mockResolvedValue(mockFiles);

      const response = await httpClient.get('/tools/api/projects/1/files');

      expect(response.status).toBe(200);
      expect(response.data).toEqual(mockFiles);
    });
  });

  describe('POST /tools/api/projects/:id/files', () => {
    it('debe subir archivos correctamente', async () => {
      mockDb.exec.mockResolvedValue();
      mockDb.run.mockResolvedValue();

      const formData = new FormData();
      formData.append('files[]', Buffer.from('contenido del archivo'), 'test.txt');

      const response = await httpClient.post('/tools/api/projects/1/files', formData, {
        headers: formData.getHeaders()
      });

      expect(response.status).toBe(201);
      expect(response.data).toEqual({ message: 'Archivos subidos correctamente' });
    });
  });

  describe('GET /tools/api/projects/:id/files/:fileId/download', () => {
    it('debe descargar archivo existente', async () => {
      const mockFile = {
        filename: 'test.txt',
        file_data: Buffer.from('contenido'),
        mime_type: 'text/plain'
      };

      mockDb.get.mockResolvedValue(mockFile);

      const response = await httpClient.get('/tools/api/projects/1/files/1/download');

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('text/plain');
    });

    it('debe retornar 404 para archivo inexistente', async () => {
      mockDb.get.mockResolvedValue(null);

      const response = await httpClient.get('/tools/api/projects/1/files/999/download');

      expect(response.status).toBe(404);
      expect(response.data).toEqual({ error: 'Archivo no encontrado' });
    });
  });

  describe('DELETE /tools/api/projects/:id/files/:fileId', () => {
    it('debe eliminar archivo correctamente', async () => {
      mockDb.run.mockResolvedValue({ changes: 1 });

      const response = await httpClient.delete('/tools/api/projects/1/files/1');

      expect(response.status).toBe(200);
      expect(response.data).toEqual({ message: 'Archivo eliminado correctamente' });
    });
  });
});
