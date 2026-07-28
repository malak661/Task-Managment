import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { readErrorMessage } from '../api/client';
import * as projectsApi from '../api/projects';
import ProjectFormModal from '../components/ProjectFormModal';
import { Empty, ErrorMessage, Loading } from '../components/states';
import { useAuth } from '../context/AuthContext';

function ProjectsPage() {
  const { user, isAdmin } = useAuth();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [failure, setFailure] = useState('');
  const [editing, setEditing] = useState(null); // a project, or 'new', or null

  const load = useCallback(async () => {
    setLoading(true);
    setFailure('');

    try {
      setProjects(await projectsApi.listProjects());
    } catch (error) {
      setFailure(readErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // The modal reports failures through its own banner, so hand the message back
  // rather than swallowing it here.
  const save = async (values) => {
    try {
      if (editing === 'new') {
        await projectsApi.createProject(values);
      } else {
        await projectsApi.updateProject(editing._id, values);
      }

      await load();
    } catch (error) {
      throw readErrorMessage(error);
    }
  };

  const remove = async (project) => {
    const confirmed = window.confirm(
      `Delete "${project.name}"? Its tasks will be deleted as well.`
    );

    if (!confirmed) {
      return;
    }

    try {
      await projectsApi.deleteProject(project._id);
      await load();
    } catch (error) {
      setFailure(readErrorMessage(error));
    }
  };

  const canManage = (project) => isAdmin || project.owner._id === user._id;

  return (
    <>
      <header className="page__header">
        <div>
          <h1>Projects</h1>
          <p className="muted">
            {isAdmin ? 'You can see every project.' : 'Projects you own or belong to.'}
          </p>
        </div>

        <button type="button" className="button button--primary button--inline" onClick={() => setEditing('new')}>
          New project
        </button>
      </header>

      {loading && <Loading label="Loading your projects…" />}

      {!loading && failure && <ErrorMessage onRetry={load}>{failure}</ErrorMessage>}

      {!loading && !failure && projects.length === 0 && (
        <Empty title="No projects yet">
          <p>Create one and it will show up here.</p>
        </Empty>
      )}

      {!loading && !failure && projects.length > 0 && (
        <ul className="projects">
          {projects.map((project) => (
            <li key={project._id} className="card project">
              <h2 className="project__name">
                <Link to={`/projects/${project._id}`}>{project.name}</Link>
              </h2>

              {project.description && <p className="project__description">{project.description}</p>}

              <p className="muted project__facts">
                {project.owner.name} · {project.members.length}{' '}
                {project.members.length === 1 ? 'member' : 'members'}
              </p>

              <div className="project__actions">
                <Link className="button button--ghost" to={`/projects/${project._id}`}>
                  Open board
                </Link>

                {canManage(project) && (
                  <>
                    <button
                      type="button"
                      className="button button--ghost"
                      onClick={() => setEditing(project)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="button button--danger"
                      onClick={() => remove(project)}
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {editing && (
        <ProjectFormModal
          project={editing === 'new' ? null : editing}
          onSubmit={save}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
}

export default ProjectsPage;
