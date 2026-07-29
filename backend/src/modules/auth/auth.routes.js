const { Router } = require('express');

const authenticate = require('../../middleware/authenticate');
const validate = require('../../middleware/validate');
const authController = require('./auth.controller');
const authValidation = require('./auth.validation');

const router = Router();

/**
 * @openapi
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Create an account and sign in
 *     description: New accounts are always members. A `role` in the body is ignored.
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name: { type: string, minLength: 2, maxLength: 80, example: Omar Farouk }
 *               email: { type: string, format: email, example: omar@example.com }
 *               password: { type: string, minLength: 8, example: password123 }
 *     responses:
 *       201:
 *         description: Account created
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Session' }
 *       409:
 *         description: That email is already registered
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *             example: { message: That email is already registered }
 *       422: { $ref: '#/components/responses/ValidationFailed' }
 */
router.post('/register', validate(authValidation.register), authController.register);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Exchange an email and password for a token
 *     description: A wrong password and an unknown email give the same answer on purpose.
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email, example: admin@taskboard.dev }
 *               password: { type: string, example: Admin1234 }
 *     responses:
 *       200:
 *         description: Signed in
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Session' }
 *       401:
 *         description: Wrong password, or no account with that email
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *             example: { message: Email or password is incorrect }
 *       422: { $ref: '#/components/responses/ValidationFailed' }
 */
router.post('/login', validate(authValidation.login), authController.login);

/**
 * @openapi
 * /auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Who the current token belongs to
 *     description: Used by the client to restore a session after a page refresh.
 *     responses:
 *       200:
 *         description: The signed-in user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user: { $ref: '#/components/schemas/User' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.get('/me', authenticate, authController.me);

module.exports = router;
