import { createServer } from 'http';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const net = require('net');

let server;
let app;
let TEST_PORT = 3001;
let serverStarting = false;

// Función para encontrar puerto disponible
const getAvailablePort = (startPort = 3001) => {
  return new Promise((resolve, reject) => {
    const testServer = net.createServer();
    testServer.unref(); // Permite que el proceso termine si este servidor es el único activo
    
    testServer.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        // Puerto ocupado, intentar con el siguiente
        resolve(getAvailablePort(startPort + 1));
      } else {
        reject(err);
      }
    });
    
    testServer.listen(startPort, () => {
      const port = testServer.address().port;
      testServer.close(() => resolve(port));
    });
  });
};

export const startTestServer = async () => {
  if (server) return `http://localhost:${TEST_PORT}`;
  
  // Evitar múltiples intentos simultáneos de iniciar el servidor
  if (serverStarting) {
    // Esperar a que termine el inicio actual
    while (serverStarting) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return server ? `http://localhost:${TEST_PORT}` : null;
  }

  serverStarting = true;
  
  try {
    // Establecer NODE_ENV para evitar que el servidor inicie automáticamente
    process.env.NODE_ENV = 'test';
    
    const { default: expressApp } = await import('../src/api/server.js');
    app = expressApp;
    
    // Obtener puerto disponible
    TEST_PORT = await getAvailablePort(TEST_PORT);
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        serverStarting = false;
        reject(new Error('Timeout al iniciar servidor de prueba'));
      }, 10000); // Aumentar timeout
      
      server = createServer(app);
      
      server.on('error', (err) => {
        clearTimeout(timeout);
        serverStarting = false;
        reject(err);
      });
      
      server.listen(TEST_PORT, '127.0.0.1', (err) => {
        clearTimeout(timeout);
        serverStarting = false;
        if (err) {
          reject(err);
        } else {
          console.log(`Test server running on port ${TEST_PORT}`);
          resolve(`http://localhost:${TEST_PORT}`);
        }
      });
    });
  } catch (error) {
    serverStarting = false;
    console.error('Error starting test server:', error);
    throw error;
  }
};

export const stopTestServer = async () => {
  if (!server) return;
  
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      console.warn('Timeout al cerrar servidor, forzando cierre');
      if (server) {
        server.removeAllListeners();
        server.unref();
      }
      server = null;
      app = null;
      resolve();
    }, 3000);
    
    // Cerrar todas las conexiones activas
    server.closeAllConnections?.();
    
    server.close((err) => {
      clearTimeout(timeout);
      if (err) {
        console.warn('Error al cerrar servidor:', err);
      }
      
      // Limpiar referencias
      if (server) {
        server.removeAllListeners();
        server.unref();
      }
      
      server = null;
      app = null;
      serverStarting = false;
      console.log('Test server stopped');
      resolve();
    });
  });
};

export const getServerUrl = () => `http://localhost:${TEST_PORT}`;
