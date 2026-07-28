import { useState } from 'react';

import { PRIORITIES, STATUSES } from '../labels';
import { toDateInputValue } from '../utils/dates';
import Field from './Field';
import Modal from './Modal';
import { ErrorMessage } from './states';

const UNASSIGNED = '';

function TaskFormModal({ task, members, onSubmit, onClose }) {
  const [form, setForm] = useState({
    title: task?.title ?? '',
    description: task?.description ?? '',
    status: task?.status ?? 'todo',
    priority: task?.priority ?? 'medium',
    dueDate: toDateInputValue(task?.dueDate),
    assignee: task?.assignee?._id ?? UNASSIGNED,
  });
  const [fieldError, setFieldError] = useState('');
  const [failure, setFailure] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const update = (name) => (event) => {
    setForm((current) => ({ ...current, [name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFailure('');

    if (form.title.trim().length < 2) {
      setFieldError('Please use at least 2 characters');
      return;
    }

    setSubmitting(true);

    try {
      await onSubmit({
        title: form.title.trim(),
        description: form.description.trim(),
        status: form.status,
        priority: form.priority,
        // null clears the value; leaving it out would mean "no change".
        dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : null,
        assignee: form.assignee || null,
      });
      onClose();
    } catch (error) {
      setFailure(error);
      setSubmitting(false);
    }
  };

  return (
    <Modal title={task ? 'Edit task' : 'New task'} onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate>
        {failure && <ErrorMessage>{failure}</ErrorMessage>}

        <Field
          label="Title"
          value={form.title}
          onChange={(event) => {
            update('title')(event);
            setFieldError('');
          }}
          error={fieldError}
          placeholder="Fix the mobile navigation"
          autoFocus
        />

        <Field label="Description">
          <textarea
            rows={3}
            value={form.description}
            onChange={update('description')}
            placeholder="Anything the assignee needs to know"
          />
        </Field>

        <div className="form-row">
          <Field label="Status">
            <select value={form.status} onChange={update('status')}>
              {STATUSES.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Priority">
            <select value={form.priority} onChange={update('priority')}>
              {PRIORITIES.map((priority) => (
                <option key={priority.value} value={priority.value}>
                  {priority.label}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="form-row">
          <Field label="Due date">
            <input type="date" value={form.dueDate} onChange={update('dueDate')} />
          </Field>

          <Field label="Assignee" hint="Only project members can be assigned">
            <select value={form.assignee} onChange={update('assignee')}>
              <option value={UNASSIGNED}>Unassigned</option>
              {members.map((member) => (
                <option key={member._id} value={member._id}>
                  {member.name}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="modal__actions">
          <button type="button" className="button button--ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="button button--primary button--inline" disabled={submitting}>
            {submitting ? 'Saving…' : 'Save task'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default TaskFormModal;
