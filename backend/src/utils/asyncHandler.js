// Express 4 does not forward rejected promises to the error handler, so every
// async route handler gets wrapped in this instead of its own try/catch.
const asyncHandler = (handler) => (req, res, next) => {
  Promise.resolve(handler(req, res, next)).catch(next);
};

module.exports = asyncHandler;
