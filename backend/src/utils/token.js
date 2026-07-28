const jwt = require('jsonwebtoken');

const env = require('../config/env');

// The token carries the role so authorisation checks do not need a database
// round trip for the common case.
function signAccessToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });
}

function verifyAccessToken(token) {
  return jwt.verify(token, env.jwtSecret);
}

module.exports = { signAccessToken, verifyAccessToken };
