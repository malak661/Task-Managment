// The api stores snake_case values; the wording belongs to the UI. Renaming a
// column here never touches the database.
export const STATUSES = [
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
];

export const PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

export const SORT_OPTIONS = [
  { value: '-createdAt', label: 'Newest first' },
  { value: 'createdAt', label: 'Oldest first' },
  { value: '-priority', label: 'Priority, high to low' },
  { value: 'dueDate', label: 'Due date, soonest first' },
  { value: 'title', label: 'Title, A to Z' },
];

const labelFrom = (options, value) =>
  options.find((option) => option.value === value)?.label ?? value;

export const statusLabel = (value) => labelFrom(STATUSES, value);
export const priorityLabel = (value) => labelFrom(PRIORITIES, value);
