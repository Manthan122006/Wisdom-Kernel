/**
 * Mistakes.jsx
 * ------------
 * The mistakes library.
 *
 * Hierarchy: the title states what went wrong, the wrong assumption and the
 * actual cause sit side by side so the gap between them is visible, and the
 * lesson is the most prominent element on the card because it is the part
 * that transfers.
 */

import { useMemo, useState } from "react";
import { ShieldAlert, X } from "lucide-react";

import { api } from "../api/api";
import useApi from "../hooks/useApi";
import Button from "../components/Button";
import PageHeader from "../components/PageHeader";
import { Badge, Card, DemoBadge } from "../components/Card";
import { EmptyState, ErrorState, LoadingState } from "../components/StateViews";

function MistakeCard({ mistake }) {
  return (
    <Card as="article" className="overflow-hidden">
      <header className="border-b border-rule px-5 py-4 sm:px-6">
        <h2 className="font-serif text-lg leading-snug text-ink">{mistake.title}</h2>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-ink-2">
          <span>{mistake.engineer}</span>
          {mistake.year && <span className="font-mono text-xs text-ink-3">{mistake.year}</span>}
          {mistake.domain && <Badge tone="royal">{mistake.domain}</Badge>}
          {mistake.is_demo && <DemoBadge />}
        </div>
      </header>

      {/* The gap between belief and reality */}
      <div className="grid gap-px bg-rule sm:grid-cols-2">
        <div className="bg-wrong-tint px-5 py-4 sm:px-6">
          <h3 className="text-label font-medium uppercase tracking-wide text-wrong">
            Wrong assumption
          </h3>
          <p className="mt-1.5 text-[0.9375rem] leading-relaxed text-ink">
            {mistake.wrong_assumption}
          </p>
        </div>
        <div className="bg-surface px-5 py-4 sm:px-6">
          <h3 className="text-label font-medium uppercase tracking-wide text-ink-3">
            Actual cause
          </h3>
          <p className="mt-1.5 text-[0.9375rem] leading-relaxed text-ink">{mistake.actual_cause}</p>
        </div>
      </div>

      <div className="grid gap-px border-t border-rule bg-rule sm:grid-cols-2">
        <div className="bg-surface px-5 py-4 sm:px-6">
          <h3 className="text-label font-medium uppercase tracking-wide text-ink-3">What we did</h3>
          <p className="mt-1.5 text-[0.9375rem] leading-relaxed text-ink-2">
            {mistake.what_we_did}
          </p>
        </div>
        <div className="bg-surface px-5 py-4 sm:px-6">
          <h3 className="text-label font-medium uppercase tracking-wide text-correct">
            What we should have done
          </h3>
          <p className="mt-1.5 text-[0.9375rem] leading-relaxed text-ink-2">
            {mistake.what_we_should_have_done}
          </p>
        </div>
      </div>

      {/* The lesson is the loudest thing on the card */}
      <div className="border-t-2 border-royal bg-royal-tint px-5 py-5 sm:px-6">
        <h3 className="text-label font-medium uppercase tracking-wide text-royal-dark">Lesson</h3>
        <p className="mt-1.5 font-serif text-[1.0625rem] leading-relaxed text-ink">
          {mistake.lesson}
        </p>
      </div>

      {mistake.mistake_to_avoid && (
        <div className="border-t border-rule px-5 py-4 sm:px-6">
          <h3 className="text-label font-medium uppercase tracking-wide text-ink-3">
            Mistake to avoid
          </h3>
          <p className="mt-1.5 text-[0.9375rem] leading-relaxed text-ink-2">
            {mistake.mistake_to_avoid}
          </p>
        </div>
      )}
    </Card>
  );
}

export default function Mistakes() {
  const { data, loading, error, reload } = useApi(() => api.mistakes(), []);
  const [filter, setFilter] = useState("");

  const mistakes = data?.mistakes || [];

  // Filtering happens on already-loaded records, so typing does not
  // create a request per keystroke.
  const visible = useMemo(() => {
    const needle = filter.trim().toLowerCase();
    if (!needle) return mistakes;
    return mistakes.filter((mistake) =>
      [mistake.title, mistake.lesson, mistake.domain, mistake.engineer, mistake.mistake_to_avoid]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(needle))
    );
  }, [mistakes, filter]);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Mistakes library"
        description="What experienced engineers got wrong, why they got it wrong, and what they would do instead. Mistakes are recorded here because they transfer faster than successes."
        breadcrumbs={[{ label: "Home", to: "/" }, { label: "Mistakes" }]}
      />

      {!loading && !error && mistakes.length > 0 && (
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-sm flex-1">
            <label htmlFor="mistake-filter" className="sr-only">
              Filter mistakes
            </label>
            <input
              id="mistake-filter"
              type="search"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              placeholder="Filter by lesson, domain or engineer"
              className="w-full rounded-md border border-rule-strong bg-white px-3.5 py-2 text-[0.9375rem] text-ink placeholder:text-ink-3 focus:border-royal focus:outline-none focus:ring-1 focus:ring-royal"
            />
          </div>
          <p className="text-sm text-ink-2">
            {visible.length} of {mistakes.length} recorded
          </p>
        </div>
      )}

      {loading && <LoadingState message="Loading the mistakes library…" rows={3} />}

      {!loading && error && <ErrorState error={error} onRetry={reload} />}

      {!loading && !error && mistakes.length === 0 && (
        <EmptyState
          icon={ShieldAlert}
          title="No mistakes recorded yet"
          message="Once engineers record experiences that include a mistake, they appear here."
          action={<Button to="/record">Record an experience</Button>}
        />
      )}

      {!loading && !error && mistakes.length > 0 && visible.length === 0 && (
        <EmptyState
          icon={ShieldAlert}
          title="Nothing matches that filter"
          message={`No recorded mistake mentions "${filter}".`}
          action={
            <Button variant="secondary" icon={X} onClick={() => setFilter("")}>
              Clear filter
            </Button>
          }
        />
      )}

      {!loading && !error && visible.length > 0 && (
        <div className="grid gap-6 xl:grid-cols-2">
          {visible.map((mistake) => (
            <MistakeCard key={mistake.id} mistake={mistake} />
          ))}
        </div>
      )}
    </div>
  );
}
