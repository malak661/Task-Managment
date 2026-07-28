const { Router } = require('express');

const { ROLES } = require('../../constants');
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');
const validate = require('../../middleware/validate');
const userController = require('./user.controller');
const userValidation = require('./user.validation');

const router = Router();

// Nothing under /api/users is public.
router.use(authenticate);

router.get('/', userController.list);

router.patch(
  '/:id/role',
  authorize(ROLES.ADMIN),
  validate(userValidation.userIdParam, 'params'),
  validate(userValidation.changeRole),
  userController.changeRole
);

module.exports = router;
