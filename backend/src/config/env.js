const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

// Every environment value the app needs is read once, here. The rest of the
// codebase imports this object instead of reaching for process.env directly,
// so a missing variable blows up on boot rather than halfway through a request.
const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 4000,
  mongoUri: process.env.MONGODB_URI,
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
};

const required = {
  MONGODB_URI: env.mongoUri,
};

const missing = Object.keys(required).filter((key) => !required[key]);

if (missing.length > 0) {
  throw new Error(
    `Missing environment variable(s): ${missing.join(', ')}. Copy .env.example to .env and fill them in.`
  );
}

module.exports = env;
