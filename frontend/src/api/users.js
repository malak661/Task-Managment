import client from './client';

export async function listUsers() {
  const { data } = await client.get('/users');
  return data.users;
}
