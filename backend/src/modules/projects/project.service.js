const { ROLES } = require('../../constants');
const Project = require('../../models/project.model');
const Task = require('../../models/task.model');
const User = require('../../models/user.model');
const ApiError = require('../../utils/ApiError');

// Enough to render a member chip or an assignee option, and nothing more.
const MEMBER_FIELDS = 'name email role';

// owner and members come back as ids or as populated documents depending on the
// query, so compare through this.
const idOf = (value) => String(value && value._id ? value._id : value);

function isMember(project, user) {
  return project.members.some((member) => idOf(member) === idOf(user));
}

// A global admin can reach every project — that is what the role is for. Everyone
// else needs to be on the member list.
function canAccess(project, user) {
  return user.role === ROLES.ADMIN || isMember(project, user);
}

// Renaming, deleting and changing the member list are the owner's calls, plus
// admins.
function canManage(project, user) {
  return user.role === ROLES.ADMIN || idOf(project.owner) === idOf(user);
}

// Shared by the tasks module too: tasks are only reachable through a project the
// caller can access.
async function getAccessibleProject(projectId, user) {
  const project = await Project.findById(projectId).populate('owner members', MEMBER_FIELDS);

  if (!project) {
    throw new ApiError(404, 'Project not found');
  }

  if (!canAccess(project, user)) {
    throw new ApiError(403, 'You do not have access to this project');
  }

  return project;
}

async function getManageableProject(projectId, user) {
  const project = await getAccessibleProject(projectId, user);

  if (!canManage(project, user)) {
    throw new ApiError(403, 'Only the project owner or an admin can do that');
  }

  return project;
}

async function createProject({ name, description }, user) {
  const project = await Project.create({
    name,
    description,
    owner: user._id,
    members: [user._id],
  });

  return project.populate('owner members', MEMBER_FIELDS);
}

function listProjects(user) {
  const scope = user.role === ROLES.ADMIN ? {} : { members: user._id };

  return Project.find(scope).populate('owner members', MEMBER_FIELDS).sort('-createdAt');
}

async function updateProject(projectId, updates, user) {
  const project = await getManageableProject(projectId, user);

  Object.assign(project, updates);
  await project.save();

  return project;
}

async function deleteProject(projectId, user) {
  const project = await getManageableProject(projectId, user);

  // Tasks have no meaning without their project, so they go with it rather than
  // being left behind pointing at nothing.
  await Task.deleteMany({ project: project._id });
  await project.deleteOne();
}

async function addMember(projectId, userId, actingUser) {
  const project = await getManageableProject(projectId, actingUser);
  const invitee = await User.findById(userId);

  if (!invitee) {
    throw new ApiError(404, 'User not found');
  }

  if (isMember(project, invitee)) {
    throw new ApiError(409, 'That user is already a member of this project');
  }

  project.members.push(invitee._id);
  await project.save();

  return project.populate('owner members', MEMBER_FIELDS);
}

async function removeMember(projectId, userId, actingUser) {
  const project = await getManageableProject(projectId, actingUser);

  if (idOf(project.owner) === String(userId)) {
    throw new ApiError(400, 'The owner cannot be removed from their own project');
  }

  if (!project.members.some((member) => idOf(member) === String(userId))) {
    throw new ApiError(404, 'That user is not a member of this project');
  }

  project.members = project.members.filter((member) => idOf(member) !== String(userId));
  await project.save();

  // Someone who is off the project should not still be holding its tasks.
  await Task.updateMany({ project: project._id, assignee: userId }, { assignee: null });

  return project.populate('owner members', MEMBER_FIELDS);
}

module.exports = {
  getAccessibleProject,
  getManageableProject,
  createProject,
  listProjects,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
};
