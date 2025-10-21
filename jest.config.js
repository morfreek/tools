export default {
  testEnvironment: 'node',
  globalTeardown: './tests/globalTeardown.js',
  preset: null,
  transform: {},
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  collectCoverageFrom: [
    'src/api/**/*.js',
    '!src/api/db.js'
  ],
  testMatch: [
    '**/tests/**/*.test.js'
  ],
  setupFilesAfterEnv: [],
  testTimeout: 30000,
  silent: false,
  verbose: true,
  forceExit: true,
  detectOpenHandles: true,
  // Configuración para debugging
  runInBand: true,
  detectLeaks: false,
  maxWorkers: 1
};
