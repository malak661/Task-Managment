const request = require('supertest');

const app = require('../src/app');
const User = require('../src/models/user.model');

const PASSWORD = 'password123';

let counter = 0;

// Unique email per call, so tests never collide on the unique index.
const nextEmail = () => `user${(counter += 1)}@example.com`;

const authHeader = (user) => ({ Authorization: `Bearer ${user.token}` });

// Registration always produces a member, so an admin is made by promoting one and
// logging in again to pick up a token that carries the new role.
async function signUp({ name = 'Test User', email = nextEmail(), role = 'member' } = {}) {
  const registered = await request(app)
    .post('/api/auth/register')
    .send({ name, email, password: PASSWORD });

  if (role === 'member') {
    return { id: registered.body.user._id, email, token: registered.body.token };
  }

  await User.updateOne({ email }, { role });
  const loggedIn = await request(app).post('/api/auth/login').send({ email, password: PASSWORD });

  return { id: loggedIn.body.user._id, email, token: loggedIn.body.token };
}

async function createProject(owner, overrides = {}) {
  const response = await request(app)
    .post('/api/projects')
    .set(authHeader(owner))
    .send({ name: 'Test Project', ...overrides });

  return response.body.project;
}

async function addMember(project, owner, member) {
  const response = await request(app)
    .post(`/api/projects/${project._id}/members`)
    .set(authHeader(owner))
    .send({ userId: member.id });

  return response.body.project;
}

async function createTask(project, user, overrides = {}) {
  const response = await request(app)
    .post(`/api/projects/${project._id}/tasks`)
    .set(authHeader(user))
    .send({ title: 'Test Task', ...overrides });

  return response.body.task;
}

module.exports = {
  PASSWORD,
  app,
  authHeader,
  signUp,
  createProject,
  addMember,
  createTask,
};
