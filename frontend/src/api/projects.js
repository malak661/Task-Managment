import client from './client';

export async function listProjects() {
  const { data } = await client.get('/projects');
  return data.projects;
}

export async function fetchProject(projectId) {
  const { data } = await client.get(`/projects/${projectId}`);
  return data.project;
}

export async function createProject(values) {
  const { data } = await client.post('/projects', values);
  return data.project;
}

export async function updateProject(projectId, values) {
  const { data } = await client.patch(`/projects/${projectId}`, values);
  return data.project;
}

export async function deleteProject(projectId) {
  await client.delete(`/projects/${projectId}`);
}

export async function addMember(projectId, userId) {
  const { data } = await client.post(`/projects/${projectId}/members`, { userId });
  return data.project;
}

export async function removeMember(projectId, userId) {
  const { data } = await client.delete(`/projects/${projectId}/members/${userId}`);
  return data.project;
}
