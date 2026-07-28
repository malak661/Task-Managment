const request = require('supertest');

const { app, authHeader, signUp, createProject, addMember, createTask } = require('./helpers');
const Task = require('../src/models/task.model');

describe('task creation', () => {
  it('fills in sensible defaults and records who created it', async () => {
    const owner = await signUp();
    const project = await createProject(owner);

    const task = await createTask(project, owner, { title: 'Write the readme' });

    expect(task.status).toBe('todo');
    expect(task.priority).toBe('medium');
    expect(task.assignee).toBeNull();
    expect(task.creator._id).toBe(owner.id);
  });

  it('refuses an assignee who is not on the project', async () => {
    const owner = await signUp();
    const outsider = await signUp();
    const project = await createProject(owner);

    const response = await request(app)
      .post(`/api/projects/${project._id}/tasks`)
      .set(authHeader(owner))
      .send({ title: 'Not yours', assignee: outsider.id });

    expect(response.status).toBe(422);
  });

  it('rejects a status that is not one of the three we support', async () => {
    const owner = await signUp();
    const project = await createProject(owner);

    const response = await request(app)
      .post(`/api/projects/${project._id}/tasks`)
      .set(authHeader(owner))
      .send({ title: 'Almost there', status: 'nearly_done' });

    expect(response.status).toBe(422);
  });

  it('stops a non-member creating or listing tasks', async () => {
    const owner = await signUp();
    const outsider = await signUp();
    const project = await createProject(owner);

    const create = await request(app)
      .post(`/api/projects/${project._id}/tasks`)
      .set(authHeader(outsider))
      .send({ title: 'Sneaking in' });
    const list = await request(app)
      .get(`/api/projects/${project._id}/tasks`)
      .set(authHeader(outsider));

    expect(create.status).toBe(403);
    expect(list.status).toBe(403);
  });
});

describe('task updates', () => {
  it('lets any member move a card that somebody else created', async () => {
    const owner = await signUp();
    const member = await signUp();
    const project = await createProject(owner);
    await addMember(project, owner, member);
    const task = await createTask(project, owner);

    const response = await request(app)
      .patch(`/api/projects/${project._id}/tasks/${task._id}`)
      .set(authHeader(member))
      .send({ status: 'in_progress' });

    expect(response.status).toBe(200);
    expect(response.body.task.status).toBe('in_progress');
  });

  it('does not find a task through a project it does not belong to', async () => {
    const owner = await signUp();
    const project = await createProject(owner, { name: 'Real Project' });
    const other = await createProject(owner, { name: 'Other Project' });
    const task = await createTask(project, owner);

    const response = await request(app)
      .get(`/api/projects/${other._id}/tasks/${task._id}`)
      .set(authHeader(owner));

    // A valid id, asked for in the wrong place, must not leak the task.
    expect(response.status).toBe(404);
  });
});

describe('task deletion', () => {
  it('allows the creator and the project owner, but not another member', async () => {
    const owner = await signUp();
    const member = await signUp();
    const project = await createProject(owner);
    await addMember(project, owner, member);
    const ownersTask = await createTask(project, owner, { title: 'Owner task' });
    const membersTask = await createTask(project, member, { title: 'Member task' });

    const memberDeletingOwners = await request(app)
      .delete(`/api/projects/${project._id}/tasks/${ownersTask._id}`)
      .set(authHeader(member));
    const memberDeletingOwn = await request(app)
      .delete(`/api/projects/${project._id}/tasks/${membersTask._id}`)
      .set(authHeader(member));

    expect(memberDeletingOwners.status).toBe(403);
    expect(memberDeletingOwn.status).toBe(204);
  });
});

describe('clean up after a project or a member leaves', () => {
  it('deletes the tasks along with the project', async () => {
    const owner = await signUp();
    const project = await createProject(owner);
    await createTask(project, owner, { title: 'One' });
    await createTask(project, owner, { title: 'Two' });

    await request(app).delete(`/api/projects/${project._id}`).set(authHeader(owner));

    expect(await Task.countDocuments({ project: project._id })).toBe(0);
  });

  it('unassigns tasks held by somebody who is removed from the project', async () => {
    const owner = await signUp();
    const member = await signUp();
    const project = await createProject(owner);
    await addMember(project, owner, member);
    const task = await createTask(project, owner, { assignee: member.id });

    await request(app)
      .delete(`/api/projects/${project._id}/members/${member.id}`)
      .set(authHeader(owner));

    const response = await request(app)
      .get(`/api/projects/${project._id}/tasks/${task._id}`)
      .set(authHeader(owner));

    expect(response.body.task.assignee).toBeNull();
  });
});
