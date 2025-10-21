import { describe, it, expect, beforeEach, beforeAll, afterAll, jest } from '@jest/globals';
import { resetMocks, resetFsMocks, setupTestServer, teardownTestServer, getHttpClient } from './setup.js';

// Mock del módulo fs
const mockFs = {
  readFile: jest.fn(),
  writeFile: jest.fn(),
  mkdir: jest.fn(),
  access: jest.fn()
};

jest.unstable_mockModule('fs', () => ({
  promises: mockFs
}));

describe('Configs Endpoints', () => {
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
    resetFsMocks(mockFs);
  });

  describe('GET /tools/api/projects/:id/configs', () => {
    it('debe retornar configuraciones existentes', async () => {
      const mockConfigs = {
        configs: [
          {
            name: 'config1',
            config: { key1: 'value1', key2: 'value2' }
          },
          {
            name: 'config2',
            config: { key3: 'value3' }
          }
        ]
      };

      mockFs.mkdir.mockResolvedValue();
      mockFs.access.mockResolvedValue();
      mockFs.readFile.mockResolvedValue(JSON.stringify(mockConfigs));

      const response = await httpClient.get('/tools/api/projects/1/configs');

      expect(response.status).toBe(200);
      expect(response.data).toEqual(mockConfigs.configs);
    });

    it('debe crear archivo de configuración si no existe', async () => {
      const emptyConfig = { configs: [] };

      mockFs.mkdir.mockResolvedValue();
      mockFs.access.mockRejectedValue(new Error('File not found'));
      mockFs.writeFile.mockResolvedValue();
      mockFs.readFile.mockResolvedValue(JSON.stringify(emptyConfig));

      const response = await httpClient.get('/tools/api/projects/1/configs');

      expect(response.status).toBe(200);
      expect(response.data).toEqual([]);
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('1.json'),
        JSON.stringify({ configs: [] })
      );
    });

    it('debe manejar errores de lectura', async () => {
      mockFs.mkdir.mockRejectedValue(new Error('Permission denied'));

      const response = await httpClient.get('/tools/api/projects/1/configs');

      expect(response.status).toBe(500);
      expect(response.data).toHaveProperty('error', 'Error al leer las configuraciones');
    });
  });

  describe('POST /tools/api/projects/:id/configs', () => {
    it('debe crear nueva configuración', async () => {
      const configData = {
        name: 'nueva-config',
        config: { setting1: 'valor1', setting2: 'valor2' }
      };

      const existingConfigs = { configs: [] };
      const updatedConfigs = {
        configs: [
          { name: 'nueva-config', config: { setting1: 'valor1', setting2: 'valor2' } }
        ]
      };

      mockFs.mkdir.mockResolvedValue();
      mockFs.access.mockResolvedValue();
      mockFs.readFile.mockResolvedValue(JSON.stringify(existingConfigs));
      mockFs.writeFile.mockResolvedValue();

      const response = await httpClient.post('/tools/api/projects/1/configs', configData);

      expect(response.status).toBe(200);
      expect(response.data).toEqual(updatedConfigs);
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('1.json'),
        JSON.stringify(updatedConfigs, null, 2)
      );
    });

    it('debe actualizar configuración existente', async () => {
      const configData = {
        name: 'config-existente',
        config: { setting1: 'nuevo-valor' }
      };

      const existingConfigs = {
        configs: [
          { name: 'config-existente', config: { setting1: 'valor-viejo' } },
          { name: 'otra-config', config: { other: 'value' } }
        ]
      };

      const updatedConfigs = {
        configs: [
          { name: 'config-existente', config: { setting1: 'nuevo-valor' } },
          { name: 'otra-config', config: { other: 'value' } }
        ]
      };

      mockFs.mkdir.mockResolvedValue();
      mockFs.access.mockResolvedValue();
      mockFs.readFile.mockResolvedValue(JSON.stringify(existingConfigs));
      mockFs.writeFile.mockResolvedValue();

      const response = await httpClient.post('/tools/api/projects/1/configs', configData);

      expect(response.status).toBe(200);
      expect(response.data).toEqual(updatedConfigs);
    });

    it('debe rechazar configuraciones sin nombre', async () => {
      const response = await httpClient.post('/tools/api/projects/1/configs', { 
        config: { key: 'value' } 
      });

      expect(response.status).toBe(400);
      expect(response.data).toEqual({ error: 'Nombre y configuración son requeridos' });
    });

    it('debe rechazar configuraciones sin config', async () => {
      const response = await httpClient.post('/tools/api/projects/1/configs', { 
        name: 'test-config' 
      });

      expect(response.status).toBe(400);
      expect(response.data).toEqual({ error: 'Nombre y configuración son requeridos' });
    });

    it('debe manejar errores durante guardado', async () => {
      mockFs.mkdir.mockResolvedValue();
      mockFs.access.mockResolvedValue();
      mockFs.readFile.mockRejectedValue(new Error('Read error'));

      const response = await httpClient.post('/tools/api/projects/1/configs', { 
        name: 'test', config: { key: 'value' } 
      });

      expect(response.status).toBe(500);
      expect(response.data).toEqual({ error: 'Error al guardar la configuración' });
    });
  });

  describe('DELETE /tools/api/projects/:id/configs', () => {
    it('debe eliminar configuración existente', async () => {
      const existingConfigs = {
        configs: [
          { name: 'config-a-eliminar', config: { key: 'value' } },
          { name: 'config-a-mantener', config: { other: 'value' } }
        ]
      };

      const updatedConfigs = {
        configs: [
          { name: 'config-a-mantener', config: { other: 'value' } }
        ]
      };

      mockFs.readFile.mockResolvedValue(JSON.stringify(existingConfigs));
      mockFs.writeFile.mockResolvedValue();

      const response = await httpClient.delete('/tools/api/projects/1/configs', {
        data: { name: 'config-a-eliminar' }
      });

      expect(response.status).toBe(200);
      expect(response.data).toEqual(updatedConfigs);
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('1.json'),
        JSON.stringify(updatedConfigs, null, 2)
      );
    });

    it('debe rechazar eliminación sin nombre', async () => {
      const response = await httpClient.delete('/tools/api/projects/1/configs', {
        data: {}
      });

      expect(response.status).toBe(400);
      expect(response.data).toEqual({ error: 'Nombre de configuración requerido' });
    });

    it('debe manejar errores durante eliminación', async () => {
      mockFs.readFile.mockRejectedValue(new Error('Read error'));

      const response = await httpClient.delete('/tools/api/projects/1/configs', {
        data: { name: 'test-config' }
      });

      expect(response.status).toBe(500);
      expect(response.data).toEqual({ error: 'Error al eliminar la configuración' });
    });
  });
});
