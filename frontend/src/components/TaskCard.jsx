import { STATUSES, priorityLabel } from '../labels';
import { formatDate, isOverdue } from '../utils/dates';

function TaskCard({ task, onStatusChange, onEdit, onDelete }) {
  const due = formatDate(task.dueDate);
  const late = isOverdue(task.dueDate, task.status);

  return (
    <article className="task">
      <header className="task__top">
        <h3 className="task__title">{task.title}</h3>
        <span className={`chip chip--${task.priority}`}>{priorityLabel(task.priority)}</span>
      </header>

      {task.description && <p className="task__description">{task.description}</p>}

      <dl className="task__meta">
        <div>
          <dt>Assignee</dt>
          <dd>{task.assignee ? task.assignee.name : <span className="muted">Unassigned</span>}</dd>
        </div>

        {due && (
          <div>
            <dt>Due</dt>
            <dd className={late ? 'task__due is-late' : 'task__due'}>
              {due}
              {late && ' · overdue'}
            </dd>
          </div>
        )}
      </dl>

      <footer className="task__actions">
        {/* Changing status is the most common edit, so it does not need the form. */}
        <label className="task__status">
          <span className="sr-only">Status</span>
          <select value={task.status} onChange={(event) => onStatusChange(task, event.target.value)}>
            {STATUSES.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </label>

        <button type="button" className="button button--ghost" onClick={() => onEdit(task)}>
          Edit
        </button>
        <button type="button" className="button button--danger" onClick={() => onDelete(task)}>
          Delete
        </button>
      </footer>
    </article>
  );
}

export default TaskCard;
