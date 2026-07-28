const { Router } = require('express');

const validate = require('../../middleware/validate');
const taskController = require('./task.controller');
const taskValidation = require('./task.validation');

// Mounted under /api/projects/:projectId/tasks, so mergeParams is what gives us
// projectId. authenticate already ran on the parent router.
const router = Router({ mergeParams: true });

/**
 * @openapi
 * /projects/{projectId}/tasks:
 *   get:
 *     tags: [Tasks]
 *     summary: The tasks in a project
 *     description: >
 *       Any project member can read the list. Filters combine, and the response
 *       carries the paging numbers alongside the tasks.
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [todo, in_progress, done] }
 *       - in: query
 *         name: priority
 *         schema: { type: string, enum: [low, medium, high] }
 *       - in: query
 *         name: assignee
 *         description: A user id, or the word `unassigned` for tasks nobody holds
 *         schema: { type: string }
 *       - in: query
 *         name: search
 *         description: Case-insensitive match on the title
 *         schema: { type: string, maxLength: 100 }
 *       - in: query
 *         name: sort
 *         description: Prefix with `-` for descending. Priority sorts low → high, not alphabetically.
 *         schema:
 *           type: string
 *           default: '-createdAt'
 *           enum: [createdAt, -createdAt, dueDate, -dueDate, title, -title, priority, -priority]
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 100, default: 20 }
 *     responses:
 *       200:
 *         description: A page of tasks
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tasks:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Task' }
 *                 meta: { $ref: '#/components/schemas/Pagination' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *       422: { $ref: '#/components/responses/ValidationFailed' }
 *   post:
 *     tags: [Tasks]
 *     summary: Add a task to a project
 *     description: Any member can add one. An assignee has to be a member of the project.
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               title: { type: string, minLength: 2, maxLength: 200, example: Fix the mobile navigation }
 *               description: { type: string, maxLength: 5000 }
 *               status: { type: string, enum: [todo, in_progress, done], default: todo }
 *               priority: { type: string, enum: [low, medium, high], default: medium }
 *               dueDate: { type: string, format: date-time, nullable: true }
 *               assignee: { type: string, nullable: true }
 *     responses:
 *       201:
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 task: { $ref: '#/components/schemas/Task' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       422: { $ref: '#/components/responses/ValidationFailed' }
 */
router
  .route('/')
  .all(validate(taskValidation.projectScope, 'params'))
  .get(validate(taskValidation.listTasks, 'query'), taskController.list)
  .post(validate(taskValidation.createTask), taskController.create);

/**
 * @openapi
 * /projects/{projectId}/tasks/{taskId}:
 *   get:
 *     tags: [Tasks]
 *     summary: One task
 *     description: A task id that belongs to another project answers 404, not the task.
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: The task
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 task: { $ref: '#/components/schemas/Task' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *   patch:
 *     tags: [Tasks]
 *     summary: Change a task
 *     description: >
 *       Any project member can edit any task in it — moving somebody else's card is
 *       the point of a shared board. Send at least one field. `assignee: null`
 *       clears the assignee.
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: taskId
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
 *               title: { type: string, minLength: 2, maxLength: 200 }
 *               description: { type: string, maxLength: 5000 }
 *               status: { type: string, enum: [todo, in_progress, done] }
 *               priority: { type: string, enum: [low, medium, high] }
 *               dueDate: { type: string, format: date-time, nullable: true }
 *               assignee: { type: string, nullable: true }
 *     responses:
 *       200:
 *         description: The updated task
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 task: { $ref: '#/components/schemas/Task' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *       422: { $ref: '#/components/responses/ValidationFailed' }
 *   delete:
 *     tags: [Tasks]
 *     summary: Delete a task
 *     description: Narrower than editing — the task's creator, the project owner, or an admin.
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204: { description: Deleted }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router
  .route('/:taskId')
  .all(validate(taskValidation.taskScope, 'params'))
  .get(taskController.getOne)
  .patch(validate(taskValidation.updateTask), taskController.update)
  .delete(taskController.remove);

module.exports = router;
