const Joi = require('joi');

const {
  TASK_STATUS_VALUES,
  TASK_PRIORITY_VALUES,
  TASK_SORT_FIELDS,
} = require('../../constants');
const { objectId } = require('../../utils/validation');

// "dueDate" ascending, "-dueDate" descending — the mongo convention.
const SORT_VALUES = TASK_SORT_FIELDS.flatMap((field) => [field, `-${field}`]);

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

// Defaults live here rather than in the service, so the service always receives a
// complete, already-sane query.
const listTasks = Joi.object({
  status: Joi.string().valid(...TASK_STATUS_VALUES),
  priority: Joi.string().valid(...TASK_PRIORITY_VALUES),
  // Either a member's id, or the literal "unassigned" for tasks nobody owns yet.
  assignee: Joi.alternatives()
    .try(objectId, Joi.string().valid('unassigned'))
    .messages({ 'alternatives.match': '"assignee" must be a valid id or "unassigned"' }),
  search: Joi.string().trim().max(100).allow(''),
  sort: Joi.string()
    .valid(...SORT_VALUES)
    .default('-createdAt'),
  page: Joi.number().integer().min(1).default(1),
  // Capped so one request cannot ask for the whole collection.
  limit: Joi.number().integer().min(1).max(100).default(20),
});

const projectScope = Joi.object({
  projectId: objectId.required(),
});

const taskScope = Joi.object({
  projectId: objectId.required(),
  taskId: objectId.required(),
});

module.exports = { createTask, updateTask, listTasks, projectScope, taskScope };
