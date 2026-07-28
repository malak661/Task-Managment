const asyncHandler = require('../../utils/asyncHandler');
const authService = require('./auth.service');

const register = asyncHandler(async (req, res) => {
  const { user, token } = await authService.register(req.body);
  res.status(201).json({ user, token });
});

const login = asyncHandler(async (req, res) => {
  const { user, token } = await authService.login(req.body);
  res.status(200).json({ user, token });
});

// authenticate already loaded the user, so there is nothing left to look up.
const me = (req, res) => {
  res.status(200).json({ user: req.user });
};

module.exports = { register, login, me };
