const express = require('express');
const cors = require('cors');

const env = require('./config/env');
const authRoutes = require('./modules/auth/auth.routes');
const userRoutes = require('./modules/users/user.routes');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(cors({ origin: env.clientOrigin }));
app.use(express.json());

// Cheap liveness probe. It never touches the database, so it keeps answering
// even if the mongo connection drops while the process is up.
app.get('/health', (req, res) => {
  res.json({ status: 'ok', environment: env.nodeEnv, uptime: process.uptime() });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Order matters: unmatched route first, then the single place errors are rendered.
app.use(notFound);
app.use(errorHandler);

module.exports = app;
