const { Router } = require('express');

const authenticate = require('../../middleware/authenticate');
const validate = require('../../middleware/validate');
const projectController = require('./project.controller');
const projectValidation = require('./project.validation');

const router = Router();

// There is no such thing as a public project here.
router.use(authenticate);

router
  .route('/')
  .get(projectController.list)
  .post(validate(projectValidation.createProject), projectController.create);

router
  .route('/:id')
  .all(validate(projectValidation.projectIdParam, 'params'))
  .get(projectController.getOne)
  .patch(validate(projectValidation.updateProject), projectController.update)
  .delete(projectController.remove);

router.post(
  '/:id/members',
  validate(projectValidation.projectIdParam, 'params'),
  validate(projectValidation.addMember),
  projectController.addMember
);

router.delete(
  '/:id/members/:userId',
  validate(projectValidation.memberParams, 'params'),
  projectController.removeMember
);

module.exports = router;
