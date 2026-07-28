// config/env.js refuses to load without these, and dotenv does not overwrite
// variables that are already set, so the real .env cannot interfere with a test run.
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';
// Replaced with the in-memory server's uri in tests/setup.js — this only needs to
// exist so the config check passes.
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/task-board-test';
