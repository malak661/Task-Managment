const request = require('supertest');

const { app, authHeader, signUp, createProject, addMember } = require('./helpers');

describe('project access', () => {
  it('only lists projects the caller belongs to', async () => {
    const owner = await signUp();
    const outsider = await signUp();
    await createProject(owner, { name: 'Owner Project' });

    const ownerList = await request(app).get('/api/projects').set(authHeader(owner));
    const outsiderList = await request(app).get('/api/projects').set(authHeader(outsider));

    expect(ownerList.body.projects).toHaveLength(1);
    expect(outsiderList.body.projects).toHaveLength(0);
  });

  it('lets an admin see projects they are not a member of', async () => {
    const owner = await signUp();
    const admin = await signUp({ role: 'admin' });
    await createProject(owner);

    const response = await request(app).get('/api/projects').set(authHeader(admin));

    expect(response.body.projects).toHaveLength(1);
  });

  it('blocks a non-member from reading or changing a project', async () => {
    const owner = await signUp();
    const outsider = await signUp();
    const project = await createProject(owner);

    const read = await request(app)
      .get(`/api/projects/${project._id}`)
      .set(authHeader(outsider));
    const rename = await request(app)
      .patch(`/api/projects/${project._id}`)
      .set(authHeader(outsider))
      .send({ name: 'Hijacked' });

    expect(read.status).toBe(403);
    expect(rename.status).toBe(403);
  });

  it('adds the owner to the member list when the project is created', async () => {
    const owner = await signUp();

    const project = await createProject(owner);

    expect(project.members.map((member) => member._id)).toContain(owner.id);
  });
});

describe('project membership', () => {
  it('gives a new member access, but not the right to rename the project', async () => {
    const owner = await signUp();
    const member = await signUp();
    const project = await createProject(owner);

    await addMember(project, owner, member);

    const read = await request(app).get(`/api/projects/${project._id}`).set(authHeader(member));
    const rename = await request(app)
      .patch(`/api/projects/${project._id}`)
      .set(authHeader(member))
      .send({ name: 'Member Rename' });

    expect(read.status).toBe(200);
    expect(rename.status).toBe(403);
  });

  it('refuses to add the same person twice or an account that does not exist', async () => {
    const owner = await signUp();
    const member = await signUp();
    const project = await createProject(owner);
    await addMember(project, owner, member);

    const twice = await request(app)
      .post(`/api/projects/${project._id}/members`)
      .set(authHeader(owner))
      .send({ userId: member.id });
    const ghost = await request(app)
      .post(`/api/projects/${project._id}/members`)
      .set(authHeader(owner))
      .send({ userId: '0'.repeat(24) });

    expect(twice.status).toBe(409);
    expect(ghost.status).toBe(404);
  });

  it('will not remove the owner from their own project', async () => {
    const owner = await signUp();
    const project = await createProject(owner);

    const response = await request(app)
      .delete(`/api/projects/${project._id}/members/${owner.id}`)
      .set(authHeader(owner));

    expect(response.status).toBe(400);
  });
});
