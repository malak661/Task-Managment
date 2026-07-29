import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { readErrorMessage } from '../api/client';
import * as projectsApi from '../api/projects';
import * as tasksApi from '../api/tasks';
import MembersPanel from '../components/MembersPanel';
import TaskCard from '../components/TaskCard';
import TaskFilters from '../components/TaskFilters';
import TaskFormModal from '../components/TaskFormModal';
import { Empty, ErrorMessage, Loading, SuccessMessage } from '../components/states';
import { useAuth } from '../context/AuthContext';
import { useFlash } from '../hooks/useFlash';
import { STATUSES, statusLabel } from '../labels';

const NO_FILTERS = { search: '', priority: '', assignee: '', sort: '-createdAt' };

// One request per board rather than one per column, with the columns as a client
// side split of the result. 100 is the largest page the api allows.
const PAGE_SIZE = 100;

function ProjectBoardPage() {
  const { projectId } = useParams();
  const { user, isAdmin } = useAuth();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState(NO_FILTERS);
  const [appliedSearch, setAppliedSearch] = useState('');

  const [loadingProject, setLoadingProject] = useState(true);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [projectFailure, setProjectFailure] = useState('');
  const [taskFailure, setTaskFailure] = useState('');
  const [editing, setEditing] = useState(null); // a task, or 'new', or null
  const { message: success, flash } = useFlash();

  const loadProject = useCallback(async () => {
    setLoadingProject(true);
    setProjectFailure('');

    try {
      setProject(await projectsApi.fetchProject(projectId));
    } catch (error) {
      setProjectFailure(readErrorMessage(error));
    } finally {
      setLoadingProject(false);
    }
  }, [projectId]);

  // Filter changes and the debounced search can leave two requests in flight at
  // once. Whichever answers last would win, even if it is the older one, so each
  // request takes a number and only the newest is allowed to touch the state.
  const latestRequest = useRef(0);

  // Search is deliberately not in here: it reaches the api through appliedSearch
  // once the typing settles, and depending on both would fire a wasted request on
  // every keystroke.
  const { priority, assignee, sort } = filters;

  const loadTasks = useCallback(async () => {
    const requestNumber = latestRequest.current + 1;
    latestRequest.current = requestNumber;

    setLoadingTasks(true);
    setTaskFailure('');

    try {
      const { tasks: found, meta } = await tasksApi.listTasks(projectId, {
        priority,
        assignee,
        sort,
        search: appliedSearch,
        limit: PAGE_SIZE,
      });

      if (requestNumber !== latestRequest.current) {
        return;
      }

      setTasks(found);
      setTotal(meta.total);
    } catch (error) {
      if (requestNumber !== latestRequest.current) {
        return;
      }

      setTaskFailure(readErrorMessage(error));
    } finally {
      if (requestNumber === latestRequest.current) {
        setLoadingTasks(false);
      }
    }
  }, [projectId, priority, assignee, sort, appliedSearch]);

  useEffect(() => {
    loadProject();
  }, [loadProject]);

  // Wait for a pause in the typing instead of asking the api on every keystroke.
  useEffect(() => {
    const timer = setTimeout(() => setAppliedSearch(filters.search.trim()), 300);
    return () => clearTimeout(timer);
  }, [filters.search]);

  useEffect(() => {
    if (project) {
      loadTasks();
    }
  }, [project, loadTasks]);

  const saveTask = async (values) => {
    const isNew = editing === 'new';

    try {
      if (isNew) {
        await tasksApi.createTask(projectId, values);
      } else {
        await tasksApi.updateTask(projectId, editing._id, values);
      }

      // Confirm on the api's word, not on the board having finished reloading.
      flash(isNew ? `"${values.title}" added` : `"${values.title}" saved`);
      await loadTasks();
    } catch (error) {
      // Back to the modal, which shows it next to the form.
      throw readErrorMessage(error);
    }
  };

  const changeStatus = async (task, status) => {
    setTaskFailure('');

    try {
      const updated = await tasksApi.updateTask(projectId, task._id, { status });
      // Swap the one card instead of reloading the whole board.
      setTasks((current) => current.map((item) => (item._id === task._id ? updated : item)));
      flash(`"${task.title}" moved to ${statusLabel(status)}`);
    } catch (error) {
      setTaskFailure(readErrorMessage(error));
    }
  };

  const removeTask = async (task) => {
    if (!window.confirm(`Delete "${task.title}"?`)) {
      return;
    }

    setTaskFailure('');

    try {
      await tasksApi.deleteTask(projectId, task._id);
      flash(`"${task.title}" deleted`);
      await loadTasks();
    } catch (error) {
      setTaskFailure(readErrorMessage(error));
    }
  };

  // Errors here are reported by the members panel itself, so let them through.
  const changeMembers = async (action, confirmation) => {
    setProject(await action());
    flash(confirmation);
    // Removing someone unassigns their tasks, so the board has to catch up.
    await loadTasks();
  };

  if (loadingProject) {
    return <Loading label="Opening the board…" />;
  }

  if (projectFailure) {
    return (
      <>
        <ErrorMessage onRetry={loadProject}>{projectFailure}</ErrorMessage>
        <Link to="/">Back to projects</Link>
      </>
    );
  }

  const canManageProject = isAdmin || project.owner._id === user._id;
  const isFiltered = Boolean(appliedSearch || filters.priority || filters.assignee);

  return (
    <>
      <header className="page__header">
        <div>
          <Link to="/" className="page__back">
            ← Projects
          </Link>
          <h1>{project.name}</h1>
          {project.description && <p className="muted">{project.description}</p>}
        </div>

        <button
          type="button"
          className="button button--primary button--inline"
          onClick={() => setEditing('new')}
        >
          New task
        </button>
      </header>

      <TaskFilters
        filters={filters}
        members={project.members}
        onChange={setFilters}
        onReset={() => setFilters(NO_FILTERS)}
      />

      {success && <SuccessMessage>{success}</SuccessMessage>}

      {taskFailure && <ErrorMessage onRetry={loadTasks}>{taskFailure}</ErrorMessage>}

      {loadingTasks && <Loading label="Loading tasks…" />}

      {/* An empty board and a failed request are different things to say. */}
      {!loadingTasks && !taskFailure && total === 0 && (
        <Empty title={isFiltered ? 'Nothing matches those filters' : 'No tasks yet'}>
          <p>
            {isFiltered
              ? 'Try clearing the filters.'
              : 'Add the first task and it will appear on the board.'}
          </p>
        </Empty>
      )}

      {!loadingTasks && !taskFailure && total > 0 && (
        <div className="board">
          {STATUSES.map((status) => {
            const column = tasks.filter((task) => task.status === status.value);

            return (
              <section key={status.value} className="board__column">
                <header className="board__heading">
                  <h2>{status.label}</h2>
                  <span className="badge">{column.length}</span>
                </header>

                {column.length === 0 ? (
                  <p className="board__placeholder">Nothing here</p>
                ) : (
                  column.map((task) => (
                    <TaskCard
                      key={task._id}
                      task={task}
                      onStatusChange={changeStatus}
                      onEdit={setEditing}
                      onDelete={removeTask}
                    />
                  ))
                )}
              </section>
            );
          })}
        </div>
      )}

      <MembersPanel
        project={project}
        canManage={canManageProject}
        onAdd={(userId) =>
          changeMembers(() => projectsApi.addMember(projectId, userId), 'Member added')
        }
        onRemove={(userId) =>
          changeMembers(
            () => projectsApi.removeMember(projectId, userId),
            'Member removed, and their tasks are unassigned'
          )
        }
      />

      {editing && (
        <TaskFormModal
          task={editing === 'new' ? null : editing}
          members={project.members}
          onSubmit={saveTask}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
}

export default ProjectBoardPage;
