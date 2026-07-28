const request = require('supertest');

const { app, authHeader, signUp, createProject, addMember, createTask } = require('./helpers');

// One fixture reused by the whole file: five tasks with a spread of statuses,
// priorities and assignees.
async function seedBoard() {
  const owner = await signUp();
  const member = await signUp();
  const project = await createProject(owner);
  await addMember(project, owner, member);

  await createTask(project, owner, {
    title: 'Alpha deploy script',
    priority: 'high',
    status: 'todo',
    assignee: member.id,
  });
  await createTask(project, owner, { title: 'Beta refactor', priority: 'low', status: 'in_progress' });
  await createTask(project, owner, { title: 'Gamma write docs', priority: 'medium', status: 'done' });
  await createTask(project, owner, { title: 'Delta fix c++ parser', priority: 'high', status: 'todo' });
  await createTask(project, owner, {
    title: 'Epsilon polish ui',
    priority: 'medium',
    status: 'todo',
    assignee: member.id,
  });

  return { owner, member, project };
}

const listTasks = (project, user, query = '') =>
  request(app).get(`/api/projects/${project._id}/tasks${query}`).set(authHeader(user));

describe('task filters', () => {
  it('narrows by status, by priority, and by both together', async () => {
    const { owner, project } = await seedBoard();

    const todo = await listTasks(project, owner, '?status=todo');
    const high = await listTasks(project, owner, '?priority=high');
    const both = await listTasks(project, owner, '?status=todo&priority=high');

    expect(todo.body.meta.total).toBe(3);
    expect(high.body.meta.total).toBe(2);
    expect(both.body.meta.total).toBe(2);
  });

  it('filters by assignee, and treats "unassigned" as its own filter', async () => {
    const { owner, member, project } = await seedBoard();

    const theirs = await listTasks(project, owner, `?assignee=${member.id}`);
    const nobodys = await listTasks(project, owner, '?assignee=unassigned');

    expect(theirs.body.meta.total).toBe(2);
    expect(nobodys.body.meta.total).toBe(3);
  });

  it('rejects a filter value that is neither an id nor "unassigned"', async () => {
    const { owner, project } = await seedBoard();

    const response = await listTasks(project, owner, '?assignee=someone');

    expect(response.status).toBe(422);
  });
});

describe('task sorting', () => {
  it('sorts priority by weight rather than alphabetically', async () => {
    const { owner, project } = await seedBoard();

    const response = await listTasks(project, owner, '?sort=-priority');

    // Alphabetically this would be high, high, low, medium, medium.
    expect(response.body.tasks.map((task) => task.priority)).toEqual([
      'high',
      'high',
      'medium',
      'medium',
      'low',
    ]);
  });

  it('refuses to sort by a field that is not on the allow list', async () => {
    const { owner, project } = await seedBoard();

    const response = await listTasks(project, owner, '?sort=priorityWeight');

    expect(response.status).toBe(422);
  });
});

describe('task pagination', () => {
  it('splits the board into pages without repeating or dropping a task', async () => {
    const { owner, project } = await seedBoard();

    const first = await listTasks(project, owner, '?sort=title&page=1&limit=2');
    const second = await listTasks(project, owner, '?sort=title&page=2&limit=2');
    const third = await listTasks(project, owner, '?sort=title&page=3&limit=2');

    const seen = [...first.body.tasks, ...second.body.tasks, ...third.body.tasks].map(
      (task) => task.title
    );

    expect(first.body.meta).toMatchObject({ total: 5, page: 1, limit: 2, pages: 3 });
    expect(seen).toHaveLength(5);
    expect(new Set(seen).size).toBe(5);
  });

  it('will not accept a page below one or a limit above the cap', async () => {
    const { owner, project } = await seedBoard();

    const response = await listTasks(project, owner, '?page=0&limit=500');

    expect(response.status).toBe(422);
    expect(response.body.details).toHaveLength(2);
  });
});

describe('task search', () => {
  it('matches part of a title, case insensitively', async () => {
    const { owner, project } = await seedBoard();

    const response = await listTasks(project, owner, '?search=REFACTOR');

    expect(response.body.meta.total).toBe(1);
    expect(response.body.tasks[0].title).toBe('Beta refactor');
  });

  it('treats regex characters in the search as literal text', async () => {
    const { owner, project } = await seedBoard();

    const plusSigns = await listTasks(project, owner, `?search=${encodeURIComponent('c++')}`);
    const wildcard = await listTasks(project, owner, `?search=${encodeURIComponent('.*')}`);

    // Unescaped, "c++" is an invalid pattern and ".*" would match everything.
    expect(plusSigns.status).toBe(200);
    expect(plusSigns.body.meta.total).toBe(1);
    expect(wildcard.body.meta.total).toBe(0);
  });
});
