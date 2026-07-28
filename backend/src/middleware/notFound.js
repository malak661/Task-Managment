const ApiError = require('../utils/ApiError');

// Runs after every route. Anything that reaches it was never matched, so it
// becomes a normal 404 instead of express' default html page.
function notFound(req, res, next) {
  next(new ApiError(404, `Cannot ${req.method} ${req.originalUrl}`));
}

module.exports = notFound;
