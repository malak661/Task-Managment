const request = require('supertest');

const { app, authHeader, signUp, PASSWORD } = require('./helpers');
const User = require('../src/models/user.model');

describe('POST /api/auth/register', () => {
  it('creates a user, returns a token, and never sends the password back', async () => {
    const response = await request(app).post('/api/auth/register').send({
      name: 'Nadia',
      email: 'nadia@example.com',
      password: PASSWORD,
    });

    expect(response.status).toBe(201);
    expect(response.body.token).toBeTruthy();
    expect(response.body.user.email).toBe('nadia@example.com');
    expect(response.body.user).not.toHaveProperty('password');
  });

  it('stores the password as a hash rather than plain text', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ name: 'Nadia', email: 'nadia@example.com', password: PASSWORD });

    const stored = await User.findOne({ email: 'nadia@example.com' }).select('+password');

    expect(stored.password).not.toBe(PASSWORD);
    expect(await stored.matchesPassword(PASSWORD)).toBe(true);
  });

  it('ignores a role sent in the body so nobody can sign up as an admin', async () => {
    const response = await request(app).post('/api/auth/register').send({
      name: 'Sneaky',
      email: 'sneaky@example.com',
      password: PASSWORD,
      role: 'admin',
    });

    expect(response.status).toBe(201);
    expect(response.body.user.role).toBe('member');
  });

  it('rejects a duplicate email with 409', async () => {
    const payload = { name: 'Nadia', email: 'nadia@example.com', password: PASSWORD };
    await request(app).post('/api/auth/register').send(payload);

    const response = await request(app).post('/api/auth/register').send(payload);

    expect(response.status).toBe(409);
  });

  it('reports every validation problem at once', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({ name: 'x', email: 'not-an-email', password: 'short' });

    expect(response.status).toBe(422);
    expect(response.body.details).toHaveLength(3);
  });
});

describe('POST /api/auth/login', () => {
  it('returns a token for the right password', async () => {
    const user = await signUp({ email: 'nadia@example.com' });

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: PASSWORD });

    expect(response.status).toBe(200);
    expect(response.body.token).toBeTruthy();
  });

  it('gives the same 401 for a wrong password and an unknown email', async () => {
    const user = await signUp({ email: 'nadia@example.com' });

    const wrongPassword = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: 'not-the-password' });
    const unknownEmail = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: PASSWORD });

    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    // Identical wording, so the endpoint cannot be used to find out who has an account.
    expect(wrongPassword.body.message).toBe(unknownEmail.body.message);
  });
});

describe('GET /api/auth/me', () => {
  it('returns the signed-in user', async () => {
    const user = await signUp({ name: 'Nadia' });

    const response = await request(app).get('/api/auth/me').set(authHeader(user));

    expect(response.status).toBe(200);
    expect(response.body.user.name).toBe('Nadia');
  });

  it('refuses a missing token, a malformed token and a deleted account', async () => {
    const user = await signUp();

    const noToken = await request(app).get('/api/auth/me');
    const junkToken = await request(app).get('/api/auth/me').set({ Authorization: 'Bearer nope' });

    await User.deleteOne({ _id: user.id });
    const deletedAccount = await request(app).get('/api/auth/me').set(authHeader(user));

    expect(noToken.status).toBe(401);
    expect(junkToken.status).toBe(401);
    // The token is still cryptographically valid — the account behind it is not.
    expect(deletedAccount.status).toBe(401);
  });
});
