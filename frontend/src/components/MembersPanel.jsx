import { useEffect, useState } from 'react';

import { readErrorMessage } from '../api/client';
import { listUsers } from '../api/users';
import { ErrorMessage } from './states';

// Shows who is on the project. Owners and admins also get to change that.
function MembersPanel({ project, canManage, onAdd, onRemove }) {
  const [everyone, setEveryone] = useState([]);
  const [chosen, setChosen] = useState('');
  const [failure, setFailure] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!canManage) {
      return;
    }

    listUsers().then(setEveryone).catch(() => setEveryone([]));
  }, [canManage]);

  const memberIds = new Set(project.members.map((member) => member._id));
  const candidates = everyone.filter((person) => !memberIds.has(person._id));
  const ownerId = project.owner._id;

  const run = async (action) => {
    setFailure('');
    setBusy(true);

    try {
      await action();
    } catch (error) {
      setFailure(readErrorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="card members">
      <h2 className="members__title">Members</h2>

      {failure && <ErrorMessage>{failure}</ErrorMessage>}

      <ul className="members__list">
        {project.members.map((member) => (
          <li key={member._id} className="members__item">
            <span>
              {member.name}
              {member._id === ownerId && <span className="badge">owner</span>}
            </span>

            {canManage && member._id !== ownerId && (
              <button
                type="button"
                className="button button--ghost"
                disabled={busy}
                onClick={() => run(() => onRemove(member._id))}
              >
                Remove
              </button>
            )}
          </li>
        ))}
      </ul>

      {canManage && (
        <div className="members__add">
          <select
            value={chosen}
            onChange={(event) => setChosen(event.target.value)}
            aria-label="Add a member"
          >
            <option value="">Add someone…</option>
            {candidates.map((person) => (
              <option key={person._id} value={person._id}>
                {person.name} ({person.email})
              </option>
            ))}
          </select>

          <button
            type="button"
            className="button button--ghost"
            disabled={!chosen || busy}
            onClick={() =>
              run(async () => {
                await onAdd(chosen);
                setChosen('');
              })
            }
          >
            Add
          </button>
        </div>
      )}
    </section>
  );
}

export default MembersPanel;
