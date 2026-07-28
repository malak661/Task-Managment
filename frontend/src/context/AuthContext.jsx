import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { onUnauthorized, setAuthToken } from '../api/client';
import * as authApi from '../api/auth';

const TOKEN_KEY = 'taskboard.token';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // Starts as true because a stored token still has to be checked against the api
  // before we know whether we are signed in.
  const [restoring, setRestoring] = useState(true);

  const signOut = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setAuthToken(null);
    setUser(null);
  }, []);

  const applySession = useCallback(({ token, user: signedInUser }) => {
    localStorage.setItem(TOKEN_KEY, token);
    setAuthToken(token);
    setUser(signedInUser);
  }, []);

  // A token that expires while the app is open should drop us back to the login
  // screen rather than leave a half-broken page.
  useEffect(() => {
    onUnauthorized(signOut);
  }, [signOut]);

  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY);

    if (!storedToken) {
      setRestoring(false);
      return;
    }

    setAuthToken(storedToken);

    // The token could be expired or belong to a deleted account, so ask the api
    // who it thinks we are instead of trusting what is in storage.
    authApi
      .fetchCurrentUser()
      .then(setUser)
      .catch(signOut)
      .finally(() => setRestoring(false));
  }, [signOut]);

  const signIn = useCallback(
    async (credentials) => {
      applySession(await authApi.login(credentials));
    },
    [applySession]
  );

  const signUp = useCallback(
    async (details) => {
      applySession(await authApi.register(details));
    },
    [applySession]
  );

  const value = useMemo(
    () => ({ user, restoring, signIn, signUp, signOut, isAdmin: user?.role === 'admin' }),
    [user, restoring, signIn, signUp, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth has to be used inside an AuthProvider');
  }

  return context;
}
