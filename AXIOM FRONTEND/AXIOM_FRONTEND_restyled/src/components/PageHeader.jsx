/**
 * PageHeader.jsx
 * --------------
 * Consistent page opening: optional breadcrumb trail, heading, and a
 * one-line description of what the page is for.
 */

import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

export default function PageHeader({ title, description, breadcrumbs, actions, children }) {
  return (
    <header className="mb-8 border-b border-rule pb-6">
      {breadcrumbs?.length > 0 && (
        <nav aria-label="Breadcrumb" className="mb-3">
          <ol className="flex flex-wrap items-center gap-1 text-sm text-ink-3">
            {breadcrumbs.map((crumb, index) => (
              <li key={`${crumb.label}-${index}`} className="flex items-center gap-1">
                {index > 0 && <ChevronRight size={13} aria-hidden="true" className="text-ink-3" />}
                {crumb.to ? (
                  <Link to={crumb.to} className="rounded transition-colors hover:text-royal">
                    {crumb.label}
                  </Link>
                ) : (
                  <span aria-current="page" className="text-ink-2">
                    {crumb.label}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-title text-ink">{title}</h1>
          {description && (
            <p className="mt-2 max-w-prose text-[0.9375rem] leading-relaxed text-ink-2">
              {description}
            </p>
          )}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
      </div>

      {children}
    </header>
  );
}
