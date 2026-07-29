const path = require('path');
const swaggerJsdoc = require('swagger-jsdoc');

const env = require('./env');
const { ROLE_VALUES, TASK_STATUS_VALUES, TASK_PRIORITY_VALUES } = require('../constants');

// The shapes and the common failures live here; the routes only describe what is
// specific to them. Keeps the annotations next to the code short and honest.
const definition = {
  openapi: '3.0.3',
  info: {
    title: 'Task Board API',
    version: '1.0.0',
    description:
      'Projects, tasks and the people they belong to. Every endpoint except register ' +
      'and login needs a bearer token from one of the auth endpoints.',
  },
  servers: [{ url: `http://localhost:${env.port}/api`, description: 'Local' }],
  tags: [
    { name: 'Auth', description: 'Register, sign in, and read the current session' },
    { name: 'Users', description: 'People who can be assigned work' },
    { name: 'Projects', description: 'Projects and their member lists' },
    { name: 'Tasks', description: 'Tasks, always inside a project' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '66a1f2b3c4d5e6f708192a3b' },
          name: { type: 'string', example: 'Omar Farouk' },
          email: { type: 'string', format: 'email', example: 'omar@example.com' },
          role: { type: 'string', enum: ROLE_VALUES },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Project: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          name: { type: 'string', example: 'Website Relaunch' },
          description: { type: 'string' },
          owner: { $ref: '#/components/schemas/User' },
          members: { type: 'array', items: { $ref: '#/components/schemas/User' } },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Task: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          project: { type: 'string' },
          title: { type: 'string', example: 'Fix the mobile navigation' },
          description: { type: 'string' },
          status: { type: 'string', enum: TASK_STATUS_VALUES },
          priority: { type: 'string', enum: TASK_PRIORITY_VALUES },
          dueDate: { type: 'string', format: 'date-time', nullable: true },
          creator: { $ref: '#/components/schemas/User' },
          assignee: {
            allOf: [{ $ref: '#/components/schemas/User' }],
            nullable: true,
            description: 'null when nobody has picked the task up yet',
          },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Session: {
        type: 'object',
        properties: {
          user: { $ref: '#/components/schemas/User' },
          token: { type: 'string', description: 'JWT, send it as `Authorization: Bearer <token>`' },
        },
      },
      Pagination: {
        type: 'object',
        properties: {
          total: { type: 'integer', example: 42 },
          page: { type: 'integer', example: 1 },
          limit: { type: 'integer', example: 20 },
          pages: { type: 'integer', example: 3 },
        },
      },
      Error: {
        type: 'object',
        properties: {
          message: { type: 'string', example: 'Something went wrong' },
          details: {
            type: 'array',
            items: { type: 'string' },
            description: 'One entry per failed rule, only on validation errors',
          },
        },
      },
    },
    // Each of these carries its own example. Sharing one schema example across all
    // four made the docs claim a 401 answers "Project not found".
    responses: {
      Unauthorized: {
        description: 'Missing, malformed or expired token',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
            example: { message: 'You need to sign in first' },
          },
        },
      },
      Forbidden: {
        description: 'Signed in, but not allowed to touch this',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
            example: { message: 'Your account is not allowed to do that' },
          },
        },
      },
      NotFound: {
        description: 'No such record',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
            example: { message: 'Project not found' },
          },
        },
      },
      ValidationFailed: {
        description: 'The request body or query did not pass validation',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
            example: {
              message: 'Validation failed',
              details: ['"title" length must be at least 2 characters long'],
            },
          },
        },
      },
    },
  },
  // Applies everywhere; the two auth endpoints opt out with `security: []`.
  security: [{ bearerAuth: [] }],
};

// Forward slashes because the glob this feeds does not understand backslashes.
const routeFiles = path
  .join(__dirname, '..', 'modules', '**', '*.routes.js')
  .replace(/\\/g, '/');

module.exports = swaggerJsdoc({ definition, apis: [routeFiles] });
