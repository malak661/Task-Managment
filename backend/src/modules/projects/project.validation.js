const Joi = require('joi');

const { objectId } = require('../../utils/validation');

const createProject = Joi.object({
  name: Joi.string().trim().min(2).max(120).required(),
  description: Joi.string().trim().max(2000).allow('').default(''),
});

// At least one field, otherwise the request is a no-op and probably a mistake.
const updateProject = Joi.object({
  name: Joi.string().trim().min(2).max(120),
  description: Joi.string().trim().max(2000).allow(''),
})
  .min(1)
  .messages({ 'object.min': 'Send at least one field to update' });

const projectIdParam = Joi.object({
  id: objectId.required(),
});

const memberParams = Joi.object({
  id: objectId.required(),
  userId: objectId.required(),
});

const addMember = Joi.object({
  userId: objectId.required(),
});

module.exports = {
  createProject,
  updateProject,
  projectIdParam,
  memberParams,
  addMember,
};
