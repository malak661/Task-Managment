import { PRIORITIES, SORT_OPTIONS } from '../labels';

// The status filter is missing on purpose: the three columns already are the
// status split.
function TaskFilters({ filters, members, onChange, onReset }) {
  // Updating from the previous value rather than from `filters` — two changes in
  // quick succession would otherwise both build on the same stale object and the
  // first one would be lost.
  const set = (name) => (event) => {
    const { value } = event.target;
    onChange((current) => ({ ...current, [name]: value }));
  };

  const isFiltered = filters.priority || filters.assignee || filters.search;

  return (
    <div className="filters">
      <label className="filters__field filters__field--grow">
        <span className="filters__label">Search</span>
        <input
          type="search"
          value={filters.search}
          onChange={set('search')}
          placeholder="Search titles…"
        />
      </label>

      <label className="filters__field">
        <span className="filters__label">Priority</span>
        <select value={filters.priority} onChange={set('priority')}>
          <option value="">Any</option>
          {PRIORITIES.map((priority) => (
            <option key={priority.value} value={priority.value}>
              {priority.label}
            </option>
          ))}
        </select>
      </label>

      <label className="filters__field">
        <span className="filters__label">Assignee</span>
        <select value={filters.assignee} onChange={set('assignee')}>
          <option value="">Anyone</option>
          <option value="unassigned">Unassigned</option>
          {members.map((member) => (
            <option key={member._id} value={member._id}>
              {member.name}
            </option>
          ))}
        </select>
      </label>

      <label className="filters__field">
        <span className="filters__label">Sort</span>
        <select value={filters.sort} onChange={set('sort')}>
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      {isFiltered && (
        <button type="button" className="button button--ghost" onClick={onReset}>
          Clear
        </button>
      )}
    </div>
  );
}

export default TaskFilters;
