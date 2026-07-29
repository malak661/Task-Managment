const { Router } = require('express');

const authenticate = require('../../middleware/authenticate');
const validate = require('../../middleware/validate');
const taskRoutes = require('../tasks/task.routes');
const projectController = require('./project.controller');
const projectValidation = require('./project.validation');

const router = Router();

// There is no such thing as a public project here.
router.use(authenticate);

// Tasks only exist inside a project, so the url says so.
router.use('/:projectId/tasks', taskRoutes);

/**
 * @openapi
 * /projects:
 *   get:
 *     tags: [Projects]
 *     summary: Projects you can see
 *     description: Projects you own or belong to. An admin gets all of them.
 *     responses:
 *       200:
 *         description: The project list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 projects:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Project' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *   post:
 *     tags: [Projects]
 *     summary: Create a project
 *     description: You become the owner and the first member.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string, minLength: 2, maxLength: 120, example: Website Relaunch }
 *               description: { type: string, maxLength: 2000 }
 *     responses:
 *       201:
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 project: { $ref: '#/components/schemas/Project' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       422: { $ref: '#/components/responses/ValidationFailed' }
 */
router
  .route('/')
  .get(projectController.list)
  .post(validate(projectValidation.createProject), projectController.create);

/**
 * @openapi
 * /projects/{id}:
 *   get:
 *     tags: [Projects]
 *     summary: One project
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: The project
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 project: { $ref: '#/components/schemas/Project' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *   patch:
 *     tags: [Projects]
 *     summary: Rename a project or change its description
 *     description: Owner or admin. Send at least one field.
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
 *             minProperties: 1
 *             properties:
 *               name: { type: string, minLength: 2, maxLength: 120 }
 *               description: { type: string, maxLength: 2000 }
 *     responses:
 *       200:
 *         description: The updated project
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 project: { $ref: '#/components/schemas/Project' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *       422: { $ref: '#/components/responses/ValidationFailed' }
 *   delete:
 *     tags: [Projects]
 *     summary: Delete a project and its tasks
 *     description: Owner or admin. The project's tasks go with it.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204: { description: Deleted }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router
  .route('/:id')
  .all(validate(projectValidation.projectIdParam, 'params'))
  .get(projectController.getOne)
  .patch(validate(projectValidation.updateProject), projectController.update)
  .delete(projectController.remove);

/**
 * @openapi
 * /projects/{id}/members:
 *   post:
 *     tags: [Projects]
 *     summary: Add somebody to the project
 *     description: Owner or admin.
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
 *             required: [userId]
 *             properties:
 *               userId: { type: string }
 *     responses:
 *       200:
 *         description: The project with its new member list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 project: { $ref: '#/components/schemas/Project' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *       409:
 *         description: Already a member
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *             example: { message: That user is already a member of this project }
 */
router.post(
  '/:id/members',
  validate(projectValidation.projectIdParam, 'params'),
  validate(projectValidation.addMember),
  projectController.addMember
);

/**
 * @openapi
 * /projects/{id}/members/{userId}:
 *   delete:
 *     tags: [Projects]
 *     summary: Take somebody off the project
 *     description: >
 *       Owner or admin. The owner cannot be removed. Anything the person was
 *       assigned in this project becomes unassigned.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: The project with its new member list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 project: { $ref: '#/components/schemas/Project' }
 *       400:
 *         description: Tried to remove the owner
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *             example: { message: The owner cannot be removed from their own project }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.delete(
  '/:id/members/:userId',
  validate(projectValidation.memberParams, 'params'),
  projectController.removeMember
);

module.exports = router;
