const ApiError = require('../utils/ApiError');

// Checks one part of the request against a joi schema and swaps in the cleaned
// value, so controllers only ever see known fields that are already trimmed and
// cast. Unknown keys are dropped rather than rejected.
const validate =
  (schema, property = 'body') =>
  (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const details = error.details.map((detail) => detail.message);
      return next(new ApiError(422, 'Validation failed', details));
    }

    req[property] = value;
    return next();
  };

module.exports = validate;
