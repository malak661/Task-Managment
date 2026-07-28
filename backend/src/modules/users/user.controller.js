const asyncHandler = require('../../utils/asyncHandler');
const userService = require('./user.service');

const list = asyncHandler(async (req, res) => {
  const users = await userService.listUsers();
  res.status(200).json({ users });
});

const changeRole = asyncHandler(async (req, res) => {
  const user = await userService.changeRole(req.params.id, req.body.role);
  res.status(200).json({ user });
});

module.exports = { list, changeRole };
