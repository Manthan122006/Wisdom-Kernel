/**
 * StateViews.jsx
 * --------------
 * Loading, error and empty states. Every API-driven page uses these, so a
 * blank screen is never possible while the backend is working.
 *
 * Copy rules: errors say what happened and what to do next, and empty
 * states invite an action rather than apologising.
 */

import { AlertCircle, Inbox, RefreshCw, WifiOff } from "lucide-react";
import Button from "./Button";

/** Skeleton rows sized to the content they stand in for. */
export function LoadingState({ message = "Loading…", rows = 3 }) {
  return (
    <div role="status" aria-live="polite" className="animate-fade-in py-6">
      <div className="mb-4 flex items-center gap-2 text-xs font-semibold text-royal uppercase tracking-wider">
        <span className="h-2 w-2 rounded-full bg-royal animate-ping" />
        <span>{message}</span>
      </div>
      <div className="space-y-4">
        {Array.from({ length: rows }).map((_, index) => (
          <div
            key={index}
            className="h-24 animate-pulse rounded-2xl border border-rule bg-white shadow-subtle"
            style={{ animationDelay: `${index * 120}ms` }}
          />
        ))}
      </div>
      <span className="sr-only">{message}</span>
    </div>
  );
}

/** Inline spinner for buttons and small regions. */
export function InlineLoader({ message = "Working…" }) {
  return (
    <div role="status" aria-live="polite" className="flex items-center gap-2.5 text-sm font-medium text-ink-2">
      <span
        className="h-4 w-4 animate-spin rounded-full border-2 border-royal border-t-transparent"
        aria-hidden="true"
      />
      <span>{message}</span>
    </div>
  );
}

export function ErrorState({ error, onRetry, title }) {
  const isNetwork = error?.code === "network_error" || error?.code === "timeout";
  const Icon = isNetwork ? WifiOff : AlertCircle;

  const heading =
    title || (isNetwork ? "Unable to connect to WisdomKernel API" : "Something went wrong");

  return (
    <div
      role="alert"
      className="animate-fade-in rounded-2xl border border-wrong/25 bg-wrong-tint/70 p-6 sm:p-8 shadow-subtle"
    >
      <div className="flex gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-wrong text-white shadow-sm">
          <Icon size={20} aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="font-sans text-lg font-bold text-ink">{heading}</h2>
          <p className="mt-1.5 max-w-prose text-[0.9375rem] leading-relaxed text-ink-2">
            {error?.message || "The request could not be completed."}
          </p>
          {isNetwork && (
            <div className="mt-3 rounded-xl border border-wrong/20 bg-white/80 p-3 text-xs text-ink-2">
              <span className="font-semibold text-ink">Backend Troubleshooting:</span> Start the API server with{" "}
              <code className="rounded bg-paper px-1.5 py-0.5 font-mono text-[0.8125rem] text-ink font-semibold">
                uvicorn main:app --reload --port 8000
              </code>{" "}
              and verify that VITE_API_BASE_URL is reachable.
            </div>
          )}
          {onRetry && (
            <Button variant="secondary" size="sm" onClick={onRetry} icon={RefreshCw} className="mt-4">
              Retry request
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export function EmptyState({
  title = "Nothing here yet",
  message,
  action,
  icon: Icon = Inbox,
}) {
  return (
    <div className="animate-fade-in rounded-2xl border border-dashed border-rule-strong bg-gradient-to-b from-white to-royal-tint/20 px-6 py-12 text-center shadow-subtle">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-royal-tint text-royal shadow-subtle">
        <Icon size={26} aria-hidden="true" />
      </div>
      <h2 className="mt-4 font-sans text-xl font-bold tracking-tight text-ink">{title}</h2>
      {message && (
        <p className="mx-auto mt-2 max-w-prose text-sm sm:text-[0.9375rem] leading-relaxed text-ink-2">
          {message}
        </p>
      )}
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  );
}
