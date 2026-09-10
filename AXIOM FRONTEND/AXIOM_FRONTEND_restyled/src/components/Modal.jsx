/**
 * Modal.jsx
 * ---------
 * Accessible dialog used for the search detail view.
 * Closes on Escape and on backdrop click, restores focus to the element
 * that opened it, and keeps Tab inside the dialog while open.
 */

import { useEffect, useRef } from "react";
import { X } from "lucide-react";

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

export default function Modal({ open, onClose, title, subtitle, children, footer }) {
  const panelRef = useRef(null);
  const openerRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    openerRef.current = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Move focus into the dialog.
    const timer = window.setTimeout(() => {
      const first = panelRef.current?.querySelector(FOCUSABLE);
      (first || panelRef.current)?.focus();
    }, 0);

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose?.();
        return;
      }

      if (event.key !== "Tab") return;

      const focusable = Array.from(panelRef.current?.querySelectorAll(FOCUSABLE) || []);
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);

    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      if (openerRef.current instanceof HTMLElement) openerRef.current.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/35 p-0 sm:items-center sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose?.();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className="flex max-h-[92vh] w-full max-w-3xl animate-modal-in flex-col rounded-t-xl border border-rule bg-surface shadow-xl sm:rounded-xl"
      >
        <header className="flex items-start justify-between gap-4 border-b border-rule px-5 py-4 sm:px-7 sm:py-5">
          <div className="min-w-0">
            <h2 className="text-heading text-ink">{title}</h2>
            {subtitle && <p className="mt-1 text-sm text-ink-2">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-1 shrink-0 rounded-md p-1.5 text-ink-3 transition-colors hover:bg-paper hover:text-ink"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-7 sm:py-6">{children}</div>

        {footer && (
          <footer className="border-t border-rule px-5 py-4 sm:px-7">{footer}</footer>
        )}
      </div>
    </div>
  );
}
