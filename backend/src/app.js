const express = require('express');
const cors = require('cors');

const env = require('./config/env');

const app = express();

app.use(cors({ origin: env.clientOrigin }));
app.use(express.json());

// Cheap liveness probe. It never touches the database, so it keeps answering
// even if the mongo connection drops while the process is up.
app.get('/health', (req, res) => {
  res.json({ status: 'ok', environment: env.nodeEnv, uptime: process.uptime() });
});

module.exports = app;
