const { Router } = require('express');

const authenticate = require('../../middleware/authenticate');
const validate = require('../../middleware/validate');
const authController = require('./auth.controller');
const authValidation = require('./auth.validation');

const router = Router();

router.post('/register', validate(authValidation.register), authController.register);
router.post('/login', validate(authValidation.login), authController.login);

// Lets the frontend restore a session from a stored token on a page refresh.
router.get('/me', authenticate, authController.me);

module.exports = router;
