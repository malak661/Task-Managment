// An error we raised on purpose. It carries the status code the client should see,
// which is how the error handler tells "the user sent something wrong" apart from
// "we broke".
class ApiError extends Error {
  constructor(statusCode, message, details) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = ApiError;
