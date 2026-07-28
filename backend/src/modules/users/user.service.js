const User = require('../../models/user.model');
const ApiError = require('../../utils/ApiError');

// Feeds the "assign to" pickers, so it returns only what a picker needs.
function listUsers() {
  return User.find().select('name email role').sort('name');
}

async function changeRole(userId, role) {
  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  user.role = role;
  await user.save();

  return user;
}

module.exports = { listUsers, changeRole };
