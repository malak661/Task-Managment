const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');

const env = require('./config/env');
const swaggerSpec = require('./config/swagger');
const authRoutes = require('./modules/auth/auth.routes');
const userRoutes = require('./modules/users/user.routes');
const projectRoutes = require('./modules/projects/project.routes');
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

// Browsable docs, plus the raw spec for anything that wants to import it.
app.get('/api/docs.json', (req, res) => res.json(swaggerSpec));
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { customSiteTitle: 'Task Board API' }));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);

// Order matters: unmatched route first, then the single place errors are rendered.
app.use(notFound);
app.use(errorHandler);

module.exports = app;
