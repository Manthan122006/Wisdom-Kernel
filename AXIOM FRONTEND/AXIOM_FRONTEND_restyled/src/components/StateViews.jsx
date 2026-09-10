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
    <div role="status" aria-live="polite" className="animate-fade-in">
      <p className="mb-5 text-sm text-ink-2">{message}</p>
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, index) => (
          <div
            key={index}
            className="h-24 animate-pulse rounded-lg border border-rule bg-white"
            style={{ animationDelay: `${index * 90}ms` }}
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
    <div role="status" aria-live="polite" className="flex items-center gap-2.5 text-sm text-ink-2">
      <span
        className="h-4 w-4 animate-spin rounded-full border-2 border-royal border-t-transparent"
        aria-hidden="true"
      />
      {message}
    </div>
  );
}

export function ErrorState({ error, onRetry, title }) {
  const isNetwork = error?.code === "network_error" || error?.code === "timeout";
  const Icon = isNetwork ? WifiOff : AlertCircle;

  const heading =
    title || (isNetwork ? "Unable to connect to WisdomKernel" : "Something went wrong");

  return (
    <div
      role="alert"
      className="animate-fade-in rounded-lg border border-wrong/25 bg-wrong-tint p-6 sm:p-8"
    >
      <div className="flex gap-4">
        <Icon size={20} className="mt-0.5 shrink-0 text-wrong" aria-hidden="true" />
        <div className="min-w-0">
          <h2 className="text-heading text-ink">{heading}</h2>
          <p className="mt-2 max-w-prose text-[0.9375rem] leading-relaxed text-ink-2">
            {error?.message || "The request could not be completed."}
          </p>
          {isNetwork && (
            <p className="mt-2 max-w-prose text-sm text-ink-3">
              Start the backend with{" "}
              <code className="rounded bg-white px-1.5 py-0.5 font-mono text-[0.8125rem] text-ink">
                uvicorn main:app --reload --port 8000
              </code>{" "}
              and check that VITE_API_BASE_URL points to it.
            </p>
          )}
          {onRetry && (
            <Button variant="secondary" size="sm" onClick={onRetry} icon={RefreshCw} className="mt-4">
              Try again
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
    <div className="animate-fade-in rounded-lg border border-dashed border-rule-strong bg-white px-6 py-12 text-center">
      <Icon size={22} className="mx-auto text-ink-3" aria-hidden="true" />
      <h2 className="mt-3 text-heading text-ink">{title}</h2>
      {message && (
        <p className="mx-auto mt-2 max-w-prose text-[0.9375rem] leading-relaxed text-ink-2">
          {message}
        </p>
      )}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}
