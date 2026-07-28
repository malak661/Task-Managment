const User = require('../models/user.model');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { verifyAccessToken } = require('../utils/token');

function readBearerToken(req) {
  const [scheme, token] = (req.headers.authorization || '').split(' ');

  return scheme === 'Bearer' && token ? token : null;
}

// Puts the signed-in user on req.user. Everything behind this middleware can
// assume req.user exists.
const authenticate = asyncHandler(async (req, res, next) => {
  const token = readBearerToken(req);

  if (!token) {
    throw new ApiError(401, 'You need to sign in first');
  }

  // A bad or expired signature throws, and the error handler turns that into 401.
  const payload = verifyAccessToken(token);

  // Look the user up instead of trusting the payload alone, so a deleted account
  // cannot keep working with a token that has not expired yet.
  const user = await User.findById(payload.sub);

  if (!user) {
    throw new ApiError(401, 'This account no longer exists');
  }

  req.user = user;
  return next();
});

module.exports = authenticate;
