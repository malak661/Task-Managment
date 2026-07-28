const Joi = require('joi');

// Mongo ids are 24 hex characters. One pattern rule rather than hex() + length()
// so a malformed id produces a single message instead of two identical ones.
const objectId = Joi.string()
  .pattern(/^[0-9a-fA-F]{24}$/)
  .messages({ 'string.pattern.base': '{{#label}} must be a valid id' });

module.exports = { objectId };
