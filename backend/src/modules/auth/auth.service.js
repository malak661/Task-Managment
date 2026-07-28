const User = require('../../models/user.model');
const ApiError = require('../../utils/ApiError');
const { signAccessToken } = require('../../utils/token');

async function register({ name, email, password }) {
  const alreadyRegistered = await User.findOne({ email });

  if (alreadyRegistered) {
    throw new ApiError(409, 'That email is already registered');
  }

  // Role is deliberately not taken from the request body — otherwise anyone
  // could sign up as an admin. Admins come from the seed script.
  const user = await User.create({ name, email, password });

  return { user, token: signAccessToken(user) };
}

async function login({ email, password }) {
  // The hash is select:false on the schema, so ask for it explicitly.
  const user = await User.findOne({ email }).select('+password');
  const passwordMatches = user ? await user.matchesPassword(password) : false;

  // One message for both failures: never tell a caller which half was wrong.
  if (!passwordMatches) {
    throw new ApiError(401, 'Email or password is incorrect');
  }

  return { user, token: signAccessToken(user) };
}

module.exports = { register, login };
