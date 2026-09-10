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
  const [user, setUser] = useState(() => tokenStore.getUser());
  const [sessionExpired, setSessionExpired] = useState(false);
  const [activeMode, setActiveModeState] = useState(() => localStorage.getItem("wk_active_mode") || "STUDENT");
  const [isOrgUnlocked, setIsOrgUnlocked] = useState(() => localStorage.getItem("wk_org_unlocked") === "true");

  const setActiveMode = useCallback((mode) => {
    setActiveModeState(mode);
    localStorage.setItem("wk_active_mode", mode);
  }, []);

  const unlockOrg = useCallback((orgData) => {
    setIsOrgUnlocked(true);
    localStorage.setItem("wk_org_unlocked", "true");
    if (orgData) {
      setOrganization(orgData);
    }
  }, []);

  // The API layer tells us when the backend rejected our token.
  useEffect(() => {
    return onUnauthorized(() => {
      setToken(null);
      setOrganization(null);
      setUser(null);
      setSessionExpired(true);
      setIsOrgUnlocked(false);
      localStorage.removeItem("wk_org_unlocked");
    });
  }, []);

  const login = useCallback(async (organizationName, password) => {
    const data = await api.login(organizationName, password);
    tokenStore.set(data.token, data.organization, data.user);
    setToken(data.token);
    setOrganization(data.organization);
    setUser(data.user || null);
    setSessionExpired(false);
    setIsOrgUnlocked(true);
    localStorage.setItem("wk_org_unlocked", "true");
    setActiveModeState("ORGANIZATION");
    localStorage.setItem("wk_active_mode", "ORGANIZATION");
    return data;
  }, []);

  const logout = useCallback(() => {
    tokenStore.clear();
    setToken(null);
    setOrganization(null);
    setUser(null);
    setSessionExpired(false);
    setIsOrgUnlocked(false);
    localStorage.removeItem("wk_org_unlocked");
    setActiveModeState("STUDENT");
    localStorage.setItem("wk_active_mode", "STUDENT");
  }, []);

  const clearExpiredNotice = useCallback(() => setSessionExpired(false), []);

  const value = useMemo(
    () => ({
      token,
      organization,
      user,
      role: user?.role || "HEAD_ADMIN",
      isAuthenticated: Boolean(token),
      sessionExpired,
      activeMode,
      setActiveMode,
      isOrgUnlocked,
      unlockOrg,
      login,
      logout,
      clearExpiredNotice,
    }),
    [token, organization, user, sessionExpired, activeMode, setActiveMode, isOrgUnlocked, unlockOrg, login, logout, clearExpiredNotice]
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
