const Joi = require('joi');

const { TASK_STATUS_VALUES, TASK_PRIORITY_VALUES } = require('../../constants');
const { objectId } = require('../../utils/validation');

// null clears the assignee, which is different from leaving the field out.
const assignee = objectId.allow(null);

const createTask = Joi.object({
  title: Joi.string().trim().min(2).max(200).required(),
  description: Joi.string().trim().max(5000).allow('').default(''),
  status: Joi.string().valid(...TASK_STATUS_VALUES),
  priority: Joi.string().valid(...TASK_PRIORITY_VALUES),
  dueDate: Joi.date().iso().allow(null),
  assignee,
});

const updateTask = Joi.object({
  title: Joi.string().trim().min(2).max(200),
  description: Joi.string().trim().max(5000).allow(''),
  status: Joi.string().valid(...TASK_STATUS_VALUES),
  priority: Joi.string().valid(...TASK_PRIORITY_VALUES),
  dueDate: Joi.date().iso().allow(null),
  assignee,
})
  .min(1)
  .messages({ 'object.min': 'Send at least one field to update' });

const projectScope = Joi.object({
  projectId: objectId.required(),
});

const taskScope = Joi.object({
  projectId: objectId.required(),
  taskId: objectId.required(),
});

module.exports = { createTask, updateTask, projectScope, taskScope };
