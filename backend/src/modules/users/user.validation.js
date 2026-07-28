const Joi = require('joi');

const { ROLE_VALUES } = require('../../constants');
const { objectId } = require('../../utils/validation');

const userIdParam = Joi.object({
  id: objectId.required(),
});

const changeRole = Joi.object({
  role: Joi.string()
    .valid(...ROLE_VALUES)
    .required(),
});

module.exports = { userIdParam, changeRole };
