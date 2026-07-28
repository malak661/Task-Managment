import { useState } from 'react';

import Field from './Field';
import Modal from './Modal';
import { ErrorMessage } from './states';

// Used for both "new project" and "rename project" — the only difference is
// whether it starts with values in it.
function ProjectFormModal({ project, onSubmit, onClose }) {
  const [form, setForm] = useState({
    name: project?.name ?? '',
    description: project?.description ?? '',
  });
  const [fieldError, setFieldError] = useState('');
  const [failure, setFailure] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFailure('');

    if (form.name.trim().length < 2) {
      setFieldError('Please use at least 2 characters');
      return;
    }

    setSubmitting(true);

    try {
      await onSubmit({ name: form.name.trim(), description: form.description.trim() });
      onClose();
    } catch (error) {
      setFailure(error);
      setSubmitting(false);
    }
  };

  return (
    <Modal title={project ? 'Edit project' : 'New project'} onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate>
        {failure && <ErrorMessage>{failure}</ErrorMessage>}

        <Field
          label="Name"
          name="name"
          value={form.name}
          onChange={(event) => {
            setForm((current) => ({ ...current, name: event.target.value }));
            setFieldError('');
          }}
          error={fieldError}
          placeholder="Website Relaunch"
          autoFocus
        />

        <Field label="Description">
          <textarea
            rows={3}
            value={form.description}
            onChange={(event) =>
              setForm((current) => ({ ...current, description: event.target.value }))
            }
            placeholder="What is this project for?"
          />
        </Field>

        <div className="modal__actions">
          <button type="button" className="button button--ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="button button--primary button--inline" disabled={submitting}>
            {submitting ? 'Saving…' : 'Save project'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default ProjectFormModal;
