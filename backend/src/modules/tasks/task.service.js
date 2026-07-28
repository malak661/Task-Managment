const { ROLES } = require('../../constants');
const Task = require('../../models/task.model');
const ApiError = require('../../utils/ApiError');
const escapeRegex = require('../../utils/escapeRegex');
const projectService = require('../projects/project.service');

const PEOPLE_FIELDS = 'name email role';

// Sort keys the api accepts, mapped to the field actually stored. "priority" is
// the interesting one: it sorts on the numeric weight, not the label.
const SORTABLE_FIELDS = {
  createdAt: 'createdAt',
  dueDate: 'dueDate',
  title: 'title',
  priority: 'priorityWeight',
};

const idOf = (value) => String(value && value._id ? value._id : value);

const withPeople = (query) => query.populate('creator assignee', PEOPLE_FIELDS);

// You cannot hand work to somebody who is not on the project.
function assertAssigneeIsMember(project, assigneeId) {
  if (!assigneeId) {
    return;
  }

  const onTheProject = project.members.some((member) => idOf(member) === String(assigneeId));

  if (!onTheProject) {
    throw new ApiError(422, 'The assignee must be a member of this project');
  }
}

// Every task lives inside a project, so the project's access rules are the gate
// for the task as well.
async function findTaskInProject(projectId, taskId, user) {
  const project = await projectService.getAccessibleProject(projectId, user);
  const task = await withPeople(Task.findOne({ _id: taskId, project: project._id }));

  // Also covers a real task id borrowed from a different project.
  if (!task) {
    throw new ApiError(404, 'Task not found in this project');
  }

  return { project, task };
}

async function createTask(projectId, payload, user) {
  const project = await projectService.getAccessibleProject(projectId, user);

  assertAssigneeIsMember(project, payload.assignee);

  const task = await Task.create({
    ...payload,
    project: project._id,
    creator: user._id,
  });

  return withPeople(Task.findById(task._id));
}

function buildFilter(projectId, { status, priority, assignee, search }) {
  const filter = { project: projectId };

  if (status) {
    filter.status = status;
  }

  if (priority) {
    filter.priority = priority;
  }

  if (assignee) {
    filter.assignee = assignee === 'unassigned' ? null : assignee;
  }

  if (search) {
    filter.title = { $regex: escapeRegex(search), $options: 'i' };
  }

  return filter;
}

function buildSort(sort) {
  const descending = sort.startsWith('-');
  const field = SORTABLE_FIELDS[descending ? sort.slice(1) : sort];

  // The _id tiebreaker keeps paging stable when the sort field has duplicates,
  // otherwise the same task can show up on two pages.
  return { [field]: descending ? -1 : 1, _id: -1 };
}

async function listTasks(projectId, query, user) {
  const project = await projectService.getAccessibleProject(projectId, user);

  const { page, limit, sort } = query;
  const filter = buildFilter(project._id, query);

  const [tasks, total] = await Promise.all([
    withPeople(Task.find(filter))
      .sort(buildSort(sort))
      .skip((page - 1) * limit)
      .limit(limit),
    Task.countDocuments(filter),
  ]);

  return {
    tasks,
    meta: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit) || 1,
    },
  };
}

async function getTask(projectId, taskId, user) {
  const { task } = await findTaskInProject(projectId, taskId, user);

  return task;
}

// Any project member may edit a task — moving someone else's card across the
// board is the whole point of a shared board.
async function updateTask(projectId, taskId, updates, user) {
  const { project, task } = await findTaskInProject(projectId, taskId, user);

  if ('assignee' in updates) {
    assertAssigneeIsMember(project, updates.assignee);
  }

  Object.assign(task, updates);
  await task.save();

  return withPeople(Task.findById(task._id));
}

// Deleting is narrower than editing: only the person who created the task, the
// project owner, or an admin.
async function deleteTask(projectId, taskId, user) {
  const { project, task } = await findTaskInProject(projectId, taskId, user);

  const allowed =
    user.role === ROLES.ADMIN ||
    idOf(task.creator) === idOf(user) ||
    idOf(project.owner) === idOf(user);

  if (!allowed) {
    throw new ApiError(403, 'Only the task creator, the project owner or an admin can delete a task');
  }

  await task.deleteOne();
}

module.exports = { createTask, listTasks, getTask, updateTask, deleteTask };
