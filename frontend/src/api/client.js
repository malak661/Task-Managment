import axios from 'axios';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
});

// The auth context owns the token and pushes it in here, which keeps this module
// free of react imports and avoids a circular dependency between the two.
export function setAuthToken(token) {
  if (token) {
    client.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete client.defaults.headers.common.Authorization;
  }
}

let handleUnauthorized = () => {};

// Lets the auth context sign the user out when a token expires mid-session,
// instead of every page having to handle a surprise 401 of its own.
export function onUnauthorized(callback) {
  handleUnauthorized = callback;
}

client.interceptors.response.use(
  (response) => response,
  (error) => {
    const isSignInAttempt = error.config?.url?.includes('/auth/login');

    if (error.response?.status === 401 && !isSignInAttempt) {
      handleUnauthorized();
    }

    return Promise.reject(error);
  }
);

// The api answers with { message, details? }. Validation errors carry the useful
// part in details, so prefer those when they are there.
export function readErrorMessage(error, fallback = 'Something went wrong, please try again') {
  const data = error.response?.data;

  if (data?.details?.length) {
    return data.details.join('. ');
  }

  if (data?.message) {
    return data.message;
  }

  // No response at all usually means the api is not running.
  if (error.request) {
    return 'Cannot reach the server. Is the API running?';
  }

  return fallback;
}

export default client;
