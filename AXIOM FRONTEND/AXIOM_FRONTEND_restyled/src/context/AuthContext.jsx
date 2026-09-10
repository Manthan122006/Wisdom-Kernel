/**
 * AuthContext.jsx
 * ---------------
 * Centralized organization authentication state.
 *
 * Holds the bearer token and the organization identity, and listens for
 * 401 responses from the API layer so an expired session logs the user
 * out everywhere at once instead of leaving dead pages behind.
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, onUnauthorized, tokenStore } from "../api/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => tokenStore.get());
  const [organization, setOrganization] = useState(() => tokenStore.getOrganization());
  const [sessionExpired, setSessionExpired] = useState(false);

  // The API layer tells us when the backend rejected our token.
  useEffect(() => {
    return onUnauthorized(() => {
      setToken(null);
      setOrganization(null);
      setSessionExpired(true);
    });
  }, []);

  const login = useCallback(async (organizationName, password) => {
    const data = await api.login(organizationName, password);
    tokenStore.set(data.token, data.organization);
    setToken(data.token);
    setOrganization(data.organization);
    setSessionExpired(false);
    return data;
  }, []);

  const logout = useCallback(() => {
    tokenStore.clear();
    setToken(null);
    setOrganization(null);
    setSessionExpired(false);
  }, []);

  const clearExpiredNotice = useCallback(() => setSessionExpired(false), []);

  const value = useMemo(
    () => ({
      token,
      organization,
      isAuthenticated: Boolean(token),
      sessionExpired,
      login,
      logout,
      clearExpiredNotice,
    }),
    [token, organization, sessionExpired, login, logout, clearExpiredNotice]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside an AuthProvider.");
  }
  return context;
}
