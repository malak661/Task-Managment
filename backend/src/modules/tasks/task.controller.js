const asyncHandler = require('../../utils/asyncHandler');
const taskService = require('./task.service');

const create = asyncHandler(async (req, res) => {
  const task = await taskService.createTask(req.params.projectId, req.body, req.user);
  res.status(201).json({ task });
});

const list = asyncHandler(async (req, res) => {
  const { tasks, meta } = await taskService.listTasks(req.params.projectId, req.query, req.user);
  res.status(200).json({ tasks, meta });
});

const getOne = asyncHandler(async (req, res) => {
  const task = await taskService.getTask(req.params.projectId, req.params.taskId, req.user);
  res.status(200).json({ task });
});

const update = asyncHandler(async (req, res) => {
  const task = await taskService.updateTask(
    req.params.projectId,
    req.params.taskId,
    req.body,
    req.user
  );
  res.status(200).json({ task });
});

const remove = asyncHandler(async (req, res) => {
  await taskService.deleteTask(req.params.projectId, req.params.taskId, req.user);
  res.status(204).send();
});

module.exports = { create, list, getOne, update, remove };
