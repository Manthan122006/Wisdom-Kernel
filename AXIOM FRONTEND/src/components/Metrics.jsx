/**
 * Metrics.jsx
 * -----------
 * Progress bars and stat blocks used by the score page and the vault.
 *
 * ProgressBar animates its fill on mount so a change is visible, and
 * exposes proper progressbar semantics to assistive technology.
 */

import { useEffect, useState } from "react";

const TONE_FILL = {
  royal: "bg-gradient-to-r from-blue-600 to-indigo-600 shadow-sm",
  correct: "bg-gradient-to-r from-emerald-600 to-teal-600 shadow-sm",
  caution: "bg-gradient-to-r from-amber-500 to-orange-500 shadow-sm",
  wrong: "bg-gradient-to-r from-rose-600 to-red-600 shadow-sm",
  ink: "bg-ink shadow-sm",
};

export function ProgressBar({
  value,
  max = 100,
  label,
  valueLabel,
  tone = "royal",
  size = "md",
}) {
  const safeMax = max > 0 ? max : 100;
  const clamped = Math.max(0, Math.min(Number(value) || 0, safeMax));
  const percent = (clamped / safeMax) * 100;

  // Start at 0 and animate to the real value once mounted.
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setWidth(percent));
    return () => cancelAnimationFrame(frame);
  }, [percent]);

  return (
    <div>
      {(label || valueLabel) && (
        <div className="mb-1.5 flex items-baseline justify-between gap-3">
          {label && <span className="text-sm text-ink-2">{label}</span>}
          {valueLabel && (
            <span className="font-mono text-sm tabular-nums text-ink">{valueLabel}</span>
          )}
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={Math.round(clamped)}
        aria-valuemin={0}
        aria-valuemax={safeMax}
        aria-label={label || "Progress"}
        className={`w-full overflow-hidden rounded-full bg-rule ${size === "sm" ? "h-1.5" : "h-2.5"}`}
      >
        <div
          className={`h-full rounded-full transition-[width] duration-700 ease-out ${
            TONE_FILL[tone] || TONE_FILL.royal
          }`}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

/** A single figure with its label. Numerals are set in mono. */
export function Stat({ value, label, hint, tone = "ink", size = "md" }) {
  const toneClass =
    { ink: "text-ink", royal: "text-royal", correct: "text-correct", wrong: "text-wrong" }[tone] ||
    "text-ink";

  return (
    <div>
      <p
        className={`font-mono tabular-nums ${toneClass} ${
          size === "lg" ? "text-4xl" : "text-2xl"
        }`}
      >
        {value}
      </p>
      <p className="mt-1 text-sm text-ink-2">{label}</p>
      {hint && <p className="mt-0.5 text-xs text-ink-3">{hint}</p>}
    </div>
  );
}

/** Grid of Stat blocks separated by hairline rules. */
export function StatRow({ children, columns = 4 }) {
  const columnClass =
    { 2: "sm:grid-cols-2", 3: "sm:grid-cols-3", 4: "sm:grid-cols-2 lg:grid-cols-4" }[columns] ||
    "sm:grid-cols-2 lg:grid-cols-4";

  return (
    <div
      className={`grid grid-cols-2 gap-x-6 gap-y-6 rounded-lg border border-rule bg-surface p-5 sm:p-6 ${columnClass}`}
    >
      {children}
    </div>
  );
}
