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

/**
 * @openapi
 * /users:
 *   get:
 *     tags: [Users]
 *     summary: Everyone who can be added to a project or assigned a task
 *     responses:
 *       200:
 *         description: The people list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/User' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.get('/', userController.list);

/**
 * @openapi
 * /users/{id}/role:
 *   patch:
 *     tags: [Users]
 *     summary: Promote or demote somebody
 *     description: Admins only. Registration cannot create an admin, so this is the way in.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [role]
 *             properties:
 *               role: { type: string, enum: [admin, member] }
 *     responses:
 *       200:
 *         description: The updated user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user: { $ref: '#/components/schemas/User' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *       422: { $ref: '#/components/responses/ValidationFailed' }
 */
router.patch(
  '/:id/role',
  authorize(ROLES.ADMIN),
  validate(userValidation.userIdParam, 'params'),
  validate(userValidation.changeRole),
  userController.changeRole
);

module.exports = router;
