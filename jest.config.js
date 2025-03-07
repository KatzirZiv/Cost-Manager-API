export default {
    transform: {
        '^.+\\.js$': 'babel-jest',
    },
    testEnvironment: 'node',
    moduleFileExtensions: ['js', 'json'],
    testMatch: ['**/tests/**/*.test.js'],
    setupFilesAfterEnv: ['./src/tests/setup.js'],
    verbose: true,
    forceExit: true,
    clearMocks: true,
    resetMocks: true,
    restoreMocks: true,
    testTimeout: 10000,
  };
  