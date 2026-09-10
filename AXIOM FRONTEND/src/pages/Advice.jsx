/**
 * Advice.jsx
 * ----------
 * "What I Wish I Knew" — Real-world engineering advice from senior practitioners.
 *
 * Visual Rhythm:
 * Alternating White and Light Blue (#F0F6FF) advice cards with deep navy headings
 * and standout soft blue quote blocks.
 */

import { useMemo, useState } from "react";
import { Lightbulb, Building } from "lucide-react";

import { api } from "../api/api";
import useApi from "../hooks/useApi";
import Button from "../components/Button";
import PageHeader from "../components/PageHeader";
import { Badge, Card, DemoBadge } from "../components/Card";
import { EmptyState, ErrorState, LoadingState } from "../components/StateViews";

const REQUIRED_CATEGORIES = [
  "All",
  "Debugging",
  "Architecture",
  "Design",
  "Career",
  "Leadership",
  "Production",
  "Security",
];

export default function Advice() {
  const [category, setCategory] = useState("All");

  const { data, loading, error, reload } = useApi(
    () => api.advice(category === "All" ? undefined : category),
    [category]
  );

  const categories = useMemo(() => {
    const fromApi = data?.categories || [];
    const set = new Set([...REQUIRED_CATEGORIES, ...fromApi]);
    return Array.from(set);
  }, [data]);

  const records = data?.advice || [];

  return (
    <div className="animate-fade-in space-y-8">
      <PageHeader
        title="What I Wish I Knew"
        description="Specific, battle-tested advice from experienced engineers reflecting on turning points. No platitudes—concrete heuristics learned through production reality."
        breadcrumbs={[{ label: "Home", to: "/" }, { label: "What I Wish I Knew" }]}
      />

      {/* Category filter pills in soft blue bar */}
      <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-3 sm:p-4 shadow-subtle">
        <div role="tablist" aria-label="Advice categories" className="flex flex-wrap gap-2">
          {categories.map((name) => {
            const isActive = category === name;
            return (
              <button
                key={name}
                role="tab"
                type="button"
                aria-selected={isActive}
                onClick={() => setCategory(name)}
                className={`rounded-xl px-4 py-2 text-xs font-semibold transition-all duration-150 ${
                  isActive
                    ? "bg-blue-600 text-white font-bold shadow-xs border border-blue-600"
                    : "border border-blue-200 bg-white text-navy hover:bg-blue-50 hover:border-blue-300"
                }`}
              >
                {name}
              </button>
            );
          })}
        </div>
      </div>

      {loading && <LoadingState message="Loading advice records from contributors…" rows={3} />}
      {!loading && error && <ErrorState error={error} onRetry={reload} />}

      {!loading && !error && records.length === 0 && (
        <EmptyState
          icon={Lightbulb}
          title="No advice records found"
          message={`No advice entries recorded under the "${category}" category.`}
          action={
            <Button variant="secondary" onClick={() => setCategory("All")}>
              Show All Categories
            </Button>
          }
        />
      )}

      {/* Advice Cards Grid: Alternating White & Light Blue */}
      {!loading && !error && records.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-medium text-ink-3">
            <span>
              Showing <strong className="text-navy font-bold">{records.length}</strong> engineering advice insights
            </span>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {records.map((item, idx) => {
              const isLightBlue = idx % 2 === 1;
              return (
                <article
                  key={item.id}
                  className={`flex flex-col justify-between rounded-3xl p-7 sm:p-8 transition-all duration-200 hover:-translate-y-1 hover:shadow-card-hover ${
                    isLightBlue
                      ? "border border-blue-200 bg-blue-50/70 shadow-subtle hover:border-blue-400"
                      : "border border-rule bg-white shadow-subtle hover:border-blue-300"
                  }`}
                >
                  <div>
                    {/* Badges */}
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      {item.category && <Badge tone="royal">{item.category}</Badge>}
                      {item.domain && <Badge tone="neutral">{item.domain}</Badge>}
                      {item.expertise && <Badge tone="neutral">{item.expertise}</Badge>}
                      {item.is_demo && <DemoBadge />}
                    </div>

                    {/* Title */}
                    <h2 className="font-sans text-xl font-bold tracking-tight text-navy leading-snug">
                      {item.title}
                    </h2>

                    {/* Context */}
                    {item.context && (
                      <p className="mt-2 text-xs font-medium text-ink-3 leading-relaxed">
                        <span className="font-bold text-navy">Context:</span> {item.context}
                      </p>
                    )}

                    {/* Core Advice Quote */}
                    <blockquote className={`mt-4 rounded-2xl border-l-4 border-blue-600 p-5 font-serif text-base sm:text-lg leading-relaxed text-navy shadow-xs ${
                      isLightBlue ? "bg-white border-y border-r border-rule" : "bg-blue-50 border border-blue-150"
                    }`}>
                      &ldquo;{item.advice}&rdquo;
                    </blockquote>
                  </div>

                  {/* Attribution */}
                  <footer className="mt-6 border-t border-rule/70 pt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-ink-2">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold">
                        {item.engineer ? item.engineer.charAt(0) : "E"}
                      </div>
                      <div>
                        <p className="font-bold text-navy">{item.engineer}</p>
                        <p className="text-ink-3">
                          {item.role || "Engineer"}
                          {item.years_experience != null && ` · ${item.years_experience} yrs experience`}
                        </p>
                      </div>
                    </div>

                    {item.company && (
                      <span className="inline-flex items-center gap-1 text-ink-3 font-medium">
                        <Building size={12} /> {item.company}
                      </span>
                    )}
                  </footer>
                </article>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
