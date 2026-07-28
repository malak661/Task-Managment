const env = require('../config/env');
const ApiError = require('../utils/ApiError');

// Mongo and mongoose throw their own error shapes. Turning them into ApiErrors
// here keeps the "what status code is this?" decision in one place.
function toApiError(error) {
  if (error instanceof ApiError) {
    return error;
  }

  if (error.name === 'ValidationError') {
    const details = Object.values(error.errors).map((field) => field.message);
    return new ApiError(422, 'Validation failed', details);
  }

  if (error.code === 11000) {
    const field = Object.keys(error.keyValue || {})[0] || 'value';
    return new ApiError(409, `That ${field} is already taken`);
  }

  if (error.name === 'CastError') {
    return new ApiError(400, `"${error.value}" is not a valid ${error.path}`);
  }

  if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
    return new ApiError(401, 'Your session is not valid, please sign in again');
  }

  return new ApiError(500, error.message);
}

// eslint-disable-next-line no-unused-vars -- express needs the 4-arg signature
function errorHandler(error, req, res, next) {
  const apiError = toApiError(error);

  // Unexpected failures are the ones worth a stack trace in the logs.
  if (apiError.statusCode >= 500) {
    console.error(`${req.method} ${req.originalUrl} failed:`, error);
  }

  const hideDetail = apiError.statusCode >= 500 && env.nodeEnv === 'production';

  res.status(apiError.statusCode).json({
    message: hideDetail ? 'Something went wrong on our side' : apiError.message,
    ...(apiError.details ? { details: apiError.details } : {}),
  });
}

module.exports = errorHandler;
