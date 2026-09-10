/**
 * format.js
 * ---------
 * Small display helpers, plus storage for real simulator runs.
 *
 * runStore only ever holds results the user actually produced. Nothing in
 * here invents a score, a baseline or a metric.
 */

const RUNS_KEY = "wk_simulator_runs";
const MAX_RUNS = 10;

/** Seconds -> m:ss, for the recording timer and durations. */
export function formatDuration(totalSeconds) {
  const safe = Math.max(0, Math.floor(totalSeconds || 0));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

/** "2026-04-02" or an ISO timestamp -> "2 Apr 2026". */
export function formatDate(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Turn a backend key such as "root_cause" into "Root cause". */
export function humanizeKey(key) {
  const text = String(key).replace(/_/g, " ").trim();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Render any backend value as readable text without inventing content. */
export function renderValue(value) {
  if (value === null || value === undefined || value === "") return null;
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}

/* ------------------------------------------------------------------ */
/* Simulator run history (real results only)                           */
/* ------------------------------------------------------------------ */

export const runStore = {
  /** Newest first. */
  all() {
    try {
      const raw = localStorage.getItem(RUNS_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  latest() {
    return this.all()[0] || null;
  },

  /** The run before the latest one, used as a real improvement baseline. */
  previous() {
    return this.all()[1] || null;
  },

  save(run) {
    const runs = [{ ...run, completedAt: new Date().toISOString() }, ...this.all()].slice(
      0,
      MAX_RUNS
    );
    localStorage.setItem(RUNS_KEY, JSON.stringify(runs));
    return runs[0];
  },

  clear() {
    localStorage.removeItem(RUNS_KEY);
  },
};
