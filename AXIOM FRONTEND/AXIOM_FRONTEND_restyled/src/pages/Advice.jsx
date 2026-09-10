/**
 * Advice.jsx
 * ----------
 * "What I wish I knew" — short notes from engineers, filtered by category.
 *
 * The filter calls GET /advice?category=... so the backend stays the source
 * of truth. The category list also comes from the backend rather than being
 * hardcoded here, with "All" added on the front.
 *
 * Editorial treatment: the advice is set in serif at reading size and the
 * attribution sits underneath, so each card reads as a person speaking
 * rather than a motivational quote card.
 */

import { useState } from "react";
import { Lightbulb } from "lucide-react";

import { api } from "../api/api";
import useApi from "../hooks/useApi";
import Button from "../components/Button";
import PageHeader from "../components/PageHeader";
import { Card, DemoBadge } from "../components/Card";
import { EmptyState, ErrorState, LoadingState } from "../components/StateViews";

const ALL = "All";

export default function Advice() {
  const [category, setCategory] = useState(ALL);

  const { data, loading, error, reload } = useApi(
    () => api.advice(category === ALL ? undefined : category),
    [category]
  );

  // Backend returns the full category list on every response, so the tabs
  // stay correct even while a filter is applied.
  const categories = [ALL, ...(data?.categories || [])];
  const records = data?.advice || [];

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="What I wish I knew"
        description="Things engineers say they would tell themselves earlier in their careers. Each note is attached to the person who said it."
        breadcrumbs={[{ label: "Home", to: "/" }, { label: "What I Wish I Knew" }]}
      />

      {/* Category filter */}
      {(data?.categories?.length > 0 || loading) && (
        <div className="mb-8 border-b border-rule pb-4">
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
                  className={`rounded-full border px-4 py-1.5 text-sm transition-colors duration-150 ${
                    isActive
                      ? "border-royal bg-royal text-white"
                      : "border-rule-strong bg-white text-ink-2 hover:border-royal hover:text-royal"
                  }`}
                >
                  {name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {loading && <LoadingState message="Loading advice…" rows={3} />}

      {!loading && error && <ErrorState error={error} onRetry={reload} />}

      {!loading && !error && records.length === 0 && (
        <EmptyState
          icon={Lightbulb}
          title={category === ALL ? "No advice recorded yet" : `Nothing filed under ${category}`}
          message={
            category === ALL
              ? "Advice appears here as engineers contribute it."
              : "Try another category, or view everything."
          }
          action={
            category !== ALL ? (
              <Button variant="secondary" onClick={() => setCategory(ALL)}>
                View all advice
              </Button>
            ) : (
              <Button to="/record">Record an experience</Button>
            )
          }
        />
      )}

      {!loading && !error && records.length > 0 && (
        <>
          <p className="mb-5 text-sm text-ink-2">
            {records.length} {records.length === 1 ? "note" : "notes"}
            {category !== ALL && ` in ${category}`}
          </p>

          <div className="grid gap-5 md:grid-cols-2">
            {records.map((item) => (
              <Card key={item.id} as="article" className="flex flex-col p-6">
                <blockquote className="flex-1">
                  <p className="font-serif text-[1.0625rem] leading-[1.7] text-ink">
                    {item.advice}
                  </p>
                </blockquote>

                <footer className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-rule pt-4">
                  <div>
                    <p className="text-[0.9375rem] text-ink">{item.engineer_name}</p>
                    <p className="text-sm text-ink-3">{item.category}</p>
                  </div>
                  {item.is_demo && <DemoBadge />}
                </footer>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
