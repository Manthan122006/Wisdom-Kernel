/**
 * Mistakes.jsx
 * ------------
 * The Mistakes Library: Practical engineering post-mortem archive.
 *
 * Each record displays:
 * - Header: Very light blue with Dark Navy typography
 * - Wrong Initial Assumption: Rose tint (#FEF2F2)
 * - What Actually Happened / Root Cause: Crisp White
 * - What We Did At The Time: Crisp White
 * - What We Should Have Done: Soft green/blue
 * - Transferred Lesson: Soft Blue (#EAF3FF) with Deep Navy typography
 * - Key Mistake to Avoid: Dark Navy (#102A56) high-contrast bar with white text
 */

import { useMemo, useState } from "react";
import {
  ShieldAlert,
  Search as SearchIcon,
  X,
  Lightbulb,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  User,
} from "lucide-react";

import { api } from "../api/api";
import useApi from "../hooks/useApi";
import Button from "../components/Button";
import PageHeader from "../components/PageHeader";
import { Badge, Card, DemoBadge } from "../components/Card";
import { EmptyState, ErrorState, LoadingState } from "../components/StateViews";

const REQUIRED_CATEGORIES = [
  "All",
  "Production",
  "Architecture",
  "Database",
  "Security",
  "Deployment",
  "Testing",
  "Performance",
  "Team / Process",
];

function MistakeRecordCard({ mistake }) {
  return (
    <article className="overflow-hidden rounded-3xl border border-rule bg-white shadow-subtle transition-all duration-200 hover:shadow-card-hover hover:border-blue-300">
      {/* Header: Very Light Blue with Dark Navy Title */}
      <header className="border-b border-blue-200/80 px-6 sm:px-8 py-5 bg-blue-50/50">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {mistake.category && <Badge tone="royal">{mistake.category}</Badge>}
            {mistake.domain && <Badge tone="neutral">{mistake.domain}</Badge>}
            {mistake.is_demo && <DemoBadge />}
          </div>
          {mistake.year && (
            <span className="font-mono text-xs text-ink-3 inline-flex items-center gap-1">
              <Calendar size={13} /> {mistake.year}
            </span>
          )}
        </div>

        <h2 className="mt-3 font-sans text-xl sm:text-2xl font-extrabold tracking-tight text-navy leading-snug">
          {mistake.title}
        </h2>

        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-2">
          <span className="inline-flex items-center gap-1 font-semibold text-navy">
            <User size={12} className="text-blue-600" /> {mistake.engineer || "Senior Contributor"}
          </span>
          {mistake.role && <span>{mistake.role}</span>}
          {mistake.company && <span>· {mistake.company}</span>}
        </div>
      </header>

      {/* The Gap Between Belief & Reality */}
      <div className="grid gap-px bg-rule/70 sm:grid-cols-2">
        <div className="bg-wrong-tint/50 px-6 sm:px-8 py-5">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-wrong">
            <AlertTriangle size={14} />
            <span>Wrong Initial Assumption</span>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-ink font-medium">
            {mistake.wrong_assumption}
          </p>
        </div>

        <div className="bg-white px-6 sm:px-8 py-5">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-ink-3">
            <span>What Actually Happened / Root Cause</span>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-ink-2">
            {mistake.actual_cause}
          </p>
        </div>
      </div>

      {/* Action Comparison: What We Did vs What We Should Have Done */}
      <div className="grid gap-px border-t border-rule/70 bg-rule/70 sm:grid-cols-2">
        <div className="bg-white px-6 sm:px-8 py-4">
          <span className="text-label font-bold uppercase tracking-wider text-ink-3">
            What We Did At The Time
          </span>
          <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-ink-2">
            {mistake.what_we_did}
          </p>
        </div>

        <div className="bg-correct-tint/40 px-6 sm:px-8 py-4">
          <span className="text-label font-bold uppercase tracking-wider text-correct flex items-center gap-1">
            <CheckCircle2 size={13} />
            <span>What We Should Have Done</span>
          </span>
          <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-navy font-semibold">
            {mistake.what_we_should_have_done}
          </p>
        </div>
      </div>

      {/* Standout Transferred Lesson (Soft Blue #EAF3FF) */}
      <div className="border-t border-blue-200 bg-blue-50/80 px-6 sm:px-8 py-5">
        <span className="text-label font-bold uppercase tracking-wider text-blue-700 flex items-center gap-1.5">
          <Lightbulb size={14} />
          <span>The Enduring Engineering Lesson</span>
        </span>
        <blockquote className="mt-2 font-serif text-base sm:text-lg font-medium leading-relaxed text-navy">
          &ldquo;{mistake.lesson}&rdquo;
        </blockquote>
      </div>

      {/* Mistake to Avoid Footer: High-Contrast Dark Navy Box (#102A56) */}
      {mistake.mistake_to_avoid && (
        <footer className="border-t border-navy-deep bg-navy px-6 sm:px-8 py-4 text-xs text-white flex items-center gap-3">
          <span className="font-bold uppercase tracking-wider text-rose-300 shrink-0">
            Mistake To Avoid:
          </span>
          <span className="text-blue-100/95 font-medium">{mistake.mistake_to_avoid}</span>
        </footer>
      )}
    </article>
  );
}

export default function Mistakes() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [query, setQuery] = useState("");

  const params = useMemo(
    () => ({
      category: selectedCategory === "All" ? undefined : selectedCategory,
      q: query.trim() || undefined,
    }),
    [selectedCategory, query]
  );

  const { data, loading, error, reload } = useApi(
    () => api.mistakes(params),
    [params]
  );

  const categories = useMemo(() => {
    const fromApi = data?.categories || [];
    const set = new Set([...REQUIRED_CATEGORIES, ...fromApi]);
    return Array.from(set);
  }, [data]);

  const mistakes = data?.mistakes || [];

  return (
    <div className="animate-fade-in space-y-8">
      <PageHeader
        title="Mistakes & Postmortems Archive"
        description="Engineering postmortems, flawed initial assumptions, and hard-earned production lessons. Studying what went wrong preserves institutional knowledge and prevents costly repeats."
        breadcrumbs={[{ label: "Home", to: "/" }, { label: "Mistakes" }]}
      />

      {/* Search and Category Filter Toolbar in Soft Blue Container */}
      <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-4 shadow-subtle space-y-3">
        <div className="relative max-w-xl">
          <SearchIcon
            size={18}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-600"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search mistakes by symptom, failure mode, or root cause…"
            className="w-full rounded-xl border border-rule bg-white py-2.5 pl-10 pr-4 text-sm text-ink placeholder:text-ink-3 shadow-xs focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
          />
        </div>

        {/* Category Pills */}
        <div className="no-scrollbar flex flex-wrap gap-2 pt-1" role="tablist" aria-label="Mistake Categories">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                role="tab"
                type="button"
                aria-selected={isActive}
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all duration-150 ${
                  isActive
                    ? "bg-blue-600 text-white font-bold shadow-xs border border-blue-600"
                    : "border border-blue-200 bg-white text-navy hover:bg-blue-50 hover:border-blue-300"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* States */}
      {loading && <LoadingState message="Loading documented engineering postmortems…" rows={3} />}
      {!loading && error && <ErrorState error={error} onRetry={reload} />}

      {!loading && !error && mistakes.length === 0 && (
        <EmptyState
          icon={ShieldAlert}
          title="No mistakes found for this filter"
          message="No incidents match this specific category and search query in the knowledge base."
          action={
            <Button
              variant="secondary"
              onClick={() => {
                setSelectedCategory("All");
                setQuery("");
              }}
            >
              Reset Filters
            </Button>
          }
        />
      )}

      {/* Mistakes Feed */}
      {!loading && !error && mistakes.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between text-xs font-medium text-ink-3">
            <span>
              Showing <strong className="text-navy font-bold">{mistakes.length}</strong> documented postmortems
            </span>
          </div>

          <div className="space-y-6">
            {mistakes.map((mistake) => (
              <MistakeRecordCard key={mistake.id} mistake={mistake} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
