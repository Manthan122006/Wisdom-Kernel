/**
 * api.js
 * ------
 * The single place where the WisdomKernel backend is described.
 * No component builds a URL or sets an auth header by itself.
 *
 * Backend contract reference: backend/README.md -> "Frontend API contract".
 */

import axios from "axios";

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") || "http://localhost:8000";

const TOKEN_KEY = "wk_token";
const ORG_KEY = "wk_organization";

/* ------------------------------------------------------------------ */
/* Token storage                                                       */
/* Prototype-grade: localStorage keeps the demo simple across reloads. */
/* A production build should use an httpOnly cookie instead.           */
/* ------------------------------------------------------------------ */

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  getOrganization: () => {
    try {
      const raw = localStorage.getItem(ORG_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },
  set: (token, organization) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(ORG_KEY, JSON.stringify(organization ?? null));
  },
  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ORG_KEY);
  },
};

/* ------------------------------------------------------------------ */
/* Axios instance                                                      */
/* ------------------------------------------------------------------ */

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 90000, // transcription of a long recording can be slow
});

// Attach the organization token to every request that has one available.
client.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Listeners notified when the backend rejects our token, so the auth
// context can clear state and send the user back to the login page.
const unauthorizedListeners = new Set();

export function onUnauthorized(listener) {
  unauthorizedListeners.add(listener);
  return () => unauthorizedListeners.delete(listener);
}

client.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || "";

    // A failed login is not an expired session, so it must not trigger a logout.
    if (status === 401 && !url.includes("/organization/login")) {
      tokenStore.clear();
      unauthorizedListeners.forEach((listener) => listener());
    }
    return Promise.reject(error);
  }
);

/* ------------------------------------------------------------------ */
/* Error normalisation                                                 */
/* The backend always returns { success:false, error:{ code, message } }*/
/* ------------------------------------------------------------------ */

export function describeError(error) {
  if (error?.response) {
    const payload = error.response.data;
    const message = payload?.error?.message || payload?.detail;
    return {
      status: error.response.status,
      code: payload?.error?.code || `http_${error.response.status}`,
      message:
        typeof message === "string"
          ? message
          : `The server responded with status ${error.response.status}.`,
    };
  }

  if (error?.code === "ECONNABORTED") {
    return {
      status: 0,
      code: "timeout",
      message: "The request took too long and was stopped. Try again.",
    };
  }

  return {
    status: 0,
    code: "network_error",
    message: `Unable to connect to WisdomKernel at ${API_BASE_URL}. Check that the backend is running.`,
  };
}

/* ------------------------------------------------------------------ */
/* Endpoints                                                           */
/* ------------------------------------------------------------------ */

/** Drop empty filter values so the URL stays clean. */
function clean(params = {}) {
  return Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) => value !== "" && value !== null && value !== undefined
    )
  );
}

export const api = {
  /** GET / — health, version and which AI services are configured. */
  health: () => client.get("/").then((r) => r.data),

  /** GET /dashboard — public home statistics. */
  dashboard: () => client.get("/dashboard").then((r) => r.data),

  /**
   * POST /transcribe — audio to transcript to structured experience.
   * The form field must be named exactly "file".
   * Content-Type is left unset so the browser adds the multipart boundary.
   */
  transcribe: (blob, filename = "recording.webm") => {
    const form = new FormData();
    form.append("file", blob, filename);
    return client.post("/transcribe", form).then((r) => r.data);
  },

  /** GET /search — filtered, ranked experience search. */
  search: (params) => client.get("/search", { params: clean(params) }).then((r) => r.data),

  /** GET /mistakes — mistakes library. */
  mistakes: (params) => client.get("/mistakes", { params: clean(params) }).then((r) => r.data),

  /** GET /simulator — full incident scenarios. */
  simulator: (params) => client.get("/simulator", { params: clean(params) }).then((r) => r.data),

  /** POST /score — Experience Transfer Score for a completed run. */
  score: (payload) => client.post("/score", payload).then((r) => r.data),

  /** GET /advice — "What I wish I knew" records. */
  advice: (category) =>
    client.get("/advice", { params: clean({ category }) }).then((r) => r.data),

  /** POST /organization/login — exchange credentials for a bearer token. */
  login: (organization_name, password) =>
    client
      .post("/organization/login", { organization_name, password })
      .then((r) => r.data),

  /**
   * GET /organization/{section} — protected vault data.
   * Sections: vault, onboarding, troubleshooting, postmortems,
   *           retirement, kri, dashboard.
   */
  organizationSection: (section) =>
    client.get(`/organization/${section}`).then((r) => r.data),
};

export default api;
