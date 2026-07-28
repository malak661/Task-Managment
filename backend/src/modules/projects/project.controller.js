const asyncHandler = require('../../utils/asyncHandler');
const projectService = require('./project.service');

const create = asyncHandler(async (req, res) => {
  const project = await projectService.createProject(req.body, req.user);
  res.status(201).json({ project });
});

const list = asyncHandler(async (req, res) => {
  const projects = await projectService.listProjects(req.user);
  res.status(200).json({ projects });
});

const getOne = asyncHandler(async (req, res) => {
  const project = await projectService.getAccessibleProject(req.params.id, req.user);
  res.status(200).json({ project });
});

const update = asyncHandler(async (req, res) => {
  const project = await projectService.updateProject(req.params.id, req.body, req.user);
  res.status(200).json({ project });
});

const remove = asyncHandler(async (req, res) => {
  await projectService.deleteProject(req.params.id, req.user);
  res.status(204).send();
});

const addMember = asyncHandler(async (req, res) => {
  const project = await projectService.addMember(req.params.id, req.body.userId, req.user);
  res.status(200).json({ project });
});

const removeMember = asyncHandler(async (req, res) => {
  const project = await projectService.removeMember(req.params.id, req.params.userId, req.user);
  res.status(200).json({ project });
});

module.exports = { create, list, getOne, update, remove, addMember, removeMember };
