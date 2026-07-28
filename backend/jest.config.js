module.exports = {
  testEnvironment: 'node',
  // Runs before anything is imported, so config/env.js finds what it needs.
  setupFiles: ['<rootDir>/tests/env.js'],
  // Runs after jest is ready, which is where beforeAll/afterEach can be used.
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  // Downloading and booting the in-memory mongo on a cold run takes a while.
  testTimeout: 30000,
};
