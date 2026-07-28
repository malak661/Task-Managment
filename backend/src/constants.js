// Values that both the models and the validation schemas need to agree on.
const ROLES = {
  ADMIN: 'admin',
  MEMBER: 'member',
};

// Stored as snake_case so the wire format stays stable; the UI owns the labels
// ("To Do", "In Progress", "Done").
const TASK_STATUSES = {
  TODO: 'todo',
  IN_PROGRESS: 'in_progress',
  DONE: 'done',
};

const TASK_PRIORITIES = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
};

module.exports = {
  ROLES,
  ROLE_VALUES: Object.values(ROLES),
  TASK_STATUSES,
  TASK_STATUS_VALUES: Object.values(TASK_STATUSES),
  TASK_PRIORITIES,
  TASK_PRIORITY_VALUES: Object.values(TASK_PRIORITIES),
};
