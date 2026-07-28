const { Router } = require('express');

const validate = require('../../middleware/validate');
const taskController = require('./task.controller');
const taskValidation = require('./task.validation');

// Mounted under /api/projects/:projectId/tasks, so mergeParams is what gives us
// projectId. authenticate already ran on the parent router.
const router = Router({ mergeParams: true });

router
  .route('/')
  .all(validate(taskValidation.projectScope, 'params'))
  .get(taskController.list)
  .post(validate(taskValidation.createTask), taskController.create);

router
  .route('/:taskId')
  .all(validate(taskValidation.taskScope, 'params'))
  .get(taskController.getOne)
  .patch(validate(taskValidation.updateTask), taskController.update)
  .delete(taskController.remove);

module.exports = router;
