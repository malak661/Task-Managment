const app = require('./app');
const env = require('./config/env');
const { connectDatabase } = require('./config/database');

async function start() {
  try {
    await connectDatabase();
    console.log('Connected to MongoDB');

    app.listen(env.port, () => {
      console.log(`API listening on http://localhost:${env.port}`);
    });
  } catch (error) {
    console.error('Could not start the API:', error.message);
    process.exit(1);
  }
}

start();
