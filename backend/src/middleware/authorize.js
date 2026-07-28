const ApiError = require('../utils/ApiError');

// Route level guard for the global role, used as authorize(ROLES.ADMIN).
// Per-project permissions are a different question and live in the services,
// because they need to look at the project document.
const authorize =
  (...allowedRoles) =>
  (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return next(new ApiError(403, 'Your account is not allowed to do that'));
    }

    return next();
  };

module.exports = authorize;
