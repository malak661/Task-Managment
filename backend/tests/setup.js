const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const { connectDatabase, disconnectDatabase } = require('../src/config/database');

// By default the suite spins up its own throwaway mongo, so `npm test` needs no
// setup at all. Set MONGODB_TEST_URI to run against a mongo you already have
// (the docker compose one, say) and skip the one-off binary download.
const providedUri = process.env.MONGODB_TEST_URI;

let memoryServer;

function assertIsScratchDatabase(uri) {
  const databaseName = new URL(uri).pathname.replace('/', '');

  // afterEach empties every collection, so refuse to point at anything that is
  // not obviously disposable.
  if (!databaseName.endsWith('-test')) {
    throw new Error(
      `MONGODB_TEST_URI must name a database ending in "-test" (got "${databaseName || 'none'}"), ` +
        'because the test suite wipes it between tests.'
    );
  }
}

beforeAll(async () => {
  if (providedUri) {
    assertIsScratchDatabase(providedUri);
    await connectDatabase(providedUri);
    return;
  }

  memoryServer = await MongoMemoryServer.create();
  await connectDatabase(memoryServer.getUri());
});

afterEach(async () => {
  // Every test starts from an empty database rather than inheriting whatever the
  // previous one left behind.
  const collections = Object.values(mongoose.connection.collections);
  await Promise.all(collections.map((collection) => collection.deleteMany({})));
});

afterAll(async () => {
  await disconnectDatabase();

  if (memoryServer) {
    await memoryServer.stop();
  }
});
