import { createServer } from 'http';
import { mkdtemp } from 'fs/promises';
import { tmpdir } from 'os';
import path from 'path';

let server = null;
let baseUrl = null;

// Levanta la app real en un puerto asignado por el sistema operativo (0),
// en 127.0.0.1, para que cada suite tenga su propio servidor sin colisiones.
export const startTestServer = async () => {
  if (server) return baseUrl;

  // NODE_ENV=test evita que server.js haga listen por su cuenta. Las rutas de
  // datos apuntan a temporales para que ninguna prueba toque la base real ni data/configs.
  process.env.NODE_ENV = 'test';
  process.env.DB_PATH = ':memory:';
  process.env.CONFIGS_DIR ??= await mkdtemp(path.join(tmpdir(), 'tools-configs-'));
  const { default: app } = await import('../src/api/server.js');

  server = createServer(app);
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });

  baseUrl = `http://127.0.0.1:${server.address().port}`;
  return baseUrl;
};

export const stopTestServer = async () => {
  if (!server) return;
  server.closeAllConnections?.();
  await new Promise((resolve) => server.close(() => resolve()));
  server = null;
  baseUrl = null;
};
