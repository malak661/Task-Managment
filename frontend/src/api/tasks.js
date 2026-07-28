import client from './client';

// Empty filters are dropped rather than sent as blanks, which the api would
// reject as invalid values.
function toParams(filters = {}) {
  return Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value !== '' && value != null)
  );
}

export async function listTasks(projectId, filters) {
  const { data } = await client.get(`/projects/${projectId}/tasks`, {
    params: toParams(filters),
  });

  return data;
}

export async function createTask(projectId, values) {
  const { data } = await client.post(`/projects/${projectId}/tasks`, values);
  return data.task;
}

export async function updateTask(projectId, taskId, values) {
  const { data } = await client.patch(`/projects/${projectId}/tasks/${taskId}`, values);
  return data.task;
}

export async function deleteTask(projectId, taskId) {
  await client.delete(`/projects/${projectId}/tasks/${taskId}`);
}
