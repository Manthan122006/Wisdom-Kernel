/**
 * Search.jsx
 * ----------
 * Ask Experience: ranked retrieval over stored human experiences.
 *
 * The page makes the provenance obvious — every result names the engineer,
 * their years of experience, and the source of the record. It shows why a
 * result matched (the backend's relevance score and matched terms) instead
 * of presenting an answer from nowhere.
 *
 * There is no chatbot here by design. Results are records, not generated text.
 */

import { useCallback, useMemo, useState } from "react";
import { Search as SearchIcon, SlidersHorizontal, X } from "lucide-react";

import { api, describeError } from "../api/api";
import Button from "../components/Button";
import PageHeader from "../components/PageHeader";
import Modal from "../components/Modal";
import RecordSheet, { experienceToFields } from "../components/RecordSheet";
import { Badge, Card, DemoBadge } from "../components/Card";
import { EmptyState, ErrorState, LoadingState } from "../components/StateViews";

const EMPTY_FILTERS = {
  engineering_type: "",
  company: "",
  domain: "",
  expertise: "",
  years_min: "",
  years_max: "",
};

const EXAMPLE_QUERIES = [
  "Why does latency spike when CPU looks fine?",
  "Repeated equipment failure after a capacity increase",
  "A fault that will not reproduce in the lab",
];

function Field({ label, id, ...rest }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm text-ink-2">
        {label}
      </label>
      <input
        id={id}
        className="w-full rounded-md border border-rule-strong bg-white px-3 py-2 text-[0.9375rem] text-ink placeholder:text-ink-3 focus:border-royal focus:outline-none focus:ring-1 focus:ring-royal"
        {...rest}
      />
    </div>
  );
}

function ResultCard({ result, onOpen }) {
  return (
    <Card interactive className="p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-serif text-lg leading-snug text-ink">{result.title}</h3>
          <p className="mt-1.5 text-sm text-ink-2">
            {result.contributor_name}
            {result.years_experience != null && ` · ${result.years_experience} years`}
            {result.company && ` · ${result.company}`}
          </p>
        </div>
        {result.relevance > 0 && (
          <span
            className="font-mono text-xs tabular-nums text-ink-3"
            title={`Relevance score from the ${result.ranking_method} ranker`}
          >
            {Math.round(result.relevance * 100)}% match
          </span>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {result.engineering_type && <Badge>{result.engineering_type}</Badge>}
        {result.domain && <Badge tone="royal">{result.domain}</Badge>}
        {result.expertise && <Badge>{result.expertise}</Badge>}
        {result.is_demo && <DemoBadge />}
      </div>

      <dl className="mt-5 space-y-3 border-t border-rule pt-4">
        {result.problem && (
          <div>
            <dt className="text-label font-medium uppercase tracking-wide text-ink-3">Problem</dt>
            <dd className="mt-1 line-clamp-2 text-[0.9375rem] leading-relaxed text-ink-2">
              {result.problem}
            </dd>
          </div>
        )}
        {result.decision && (
          <div>
            <dt className="text-label font-medium uppercase tracking-wide text-ink-3">Decision</dt>
            <dd className="mt-1 line-clamp-2 text-[0.9375rem] leading-relaxed text-ink-2">
              {result.decision}
            </dd>
          </div>
        )}
        {result.lesson && (
          <div className="border-l-2 border-royal pl-3">
            <dt className="text-label font-medium uppercase tracking-wide text-royal">Lesson</dt>
            <dd className="mt-1 text-[0.9375rem] leading-relaxed text-ink">{result.lesson}</dd>
          </div>
        )}
      </dl>

      <div className="mt-5 flex items-center justify-between gap-4">
        <Button variant="secondary" size="sm" onClick={() => onOpen(result)}>
          View experience
        </Button>
        {result.matched_terms?.length > 0 && (
          <p className="truncate text-xs text-ink-3" title={result.matched_terms.join(", ")}>
            Matched: {result.matched_terms.join(", ")}
          </p>
        )}
      </div>
    </Card>
  );
}

export default function Search() {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [showFilters, setShowFilters] = useState(false);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [selected, setSelected] = useState(null);

  const activeFilterCount = useMemo(
    () => Object.values(filters).filter((value) => value !== "").length,
    [filters]
  );

  const runSearch = useCallback(
    async (searchQuery, searchFilters) => {
      setLoading(true);
      setError(null);
      setHasSearched(true);

      try {
        const response = await api.search({
          query: searchQuery,
          ...searchFilters,
          limit: 20,
        });
        setData(response);
      } catch (err) {
        setError(describeError(err));
        setData(null);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  function handleSubmit(event) {
    event.preventDefault();
    runSearch(query, filters);
  }

  function clearFilters() {
    setFilters(EMPTY_FILTERS);
    if (hasSearched) runSearch(query, EMPTY_FILTERS);
  }

  const results = data?.results || [];

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Ask Experience"
        description="Search real-world engineering experiences instead of generic answers. Every result is a record of something an engineer actually did, with their name and years of experience attached."
        breadcrumbs={[{ label: "Home", to: "/" }, { label: "Ask Experience" }]}
      />

      {/* Search form */}
      <form onSubmit={handleSubmit} role="search" className="mb-8">
        <label htmlFor="search-query" className="sr-only">
          Describe your situation
        </label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <SearchIcon
              size={18}
              aria-hidden="true"
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-3"
            />
            <input
              id="search-query"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="How do I debug a memory leak in production?"
              className="w-full rounded-md border border-rule-strong bg-white py-3 pl-11 pr-4 text-[0.9375rem] text-ink placeholder:text-ink-3 focus:border-royal focus:outline-none focus:ring-1 focus:ring-royal"
            />
          </div>
          <div className="flex gap-3">
            <Button type="submit" size="lg" loading={loading} className="flex-1 sm:flex-none">
              Search
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="lg"
              icon={SlidersHorizontal}
              onClick={() => setShowFilters((open) => !open)}
              aria-expanded={showFilters}
              aria-controls="search-filters"
            >
              Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
            </Button>
          </div>
        </div>

        {showFilters && (
          <Card id="search-filters" className="mt-4 p-5 sm:p-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field
                id="filter-engineering-type"
                label="Engineering type"
                placeholder="Electrical Engineering"
                value={filters.engineering_type}
                onChange={(e) => setFilters({ ...filters, engineering_type: e.target.value })}
              />
              <Field
                id="filter-company"
                label="Company"
                placeholder="Meridian Cloud Labs"
                value={filters.company}
                onChange={(e) => setFilters({ ...filters, company: e.target.value })}
              />
              <Field
                id="filter-domain"
                label="Domain"
                placeholder="Power Distribution"
                value={filters.domain}
                onChange={(e) => setFilters({ ...filters, domain: e.target.value })}
              />
              <Field
                id="filter-expertise"
                label="Expertise"
                placeholder="Protection Relays"
                value={filters.expertise}
                onChange={(e) => setFilters({ ...filters, expertise: e.target.value })}
              />
              <Field
                id="filter-years-min"
                label="Years of experience, minimum"
                type="number"
                min="0"
                max="80"
                placeholder="0"
                value={filters.years_min}
                onChange={(e) => setFilters({ ...filters, years_min: e.target.value })}
              />
              <Field
                id="filter-years-max"
                label="Years of experience, maximum"
                type="number"
                min="0"
                max="80"
                placeholder="80"
                value={filters.years_max}
                onChange={(e) => setFilters({ ...filters, years_max: e.target.value })}
              />
            </div>

            {activeFilterCount > 0 && (
              <div className="mt-4 border-t border-rule pt-4">
                <Button variant="ghost" size="sm" icon={X} onClick={clearFilters}>
                  Clear all filters
                </Button>
              </div>
            )}
          </Card>
        )}
      </form>

      {/* Results region */}
      <section aria-live="polite" aria-busy={loading}>
        {loading && <LoadingState message="Searching stored experiences…" rows={3} />}

        {!loading && error && <ErrorState error={error} onRetry={() => runSearch(query, filters)} />}

        {!loading && !error && !hasSearched && (
          <div className="rounded-lg border border-dashed border-royal-light bg-royal-tint p-6 sm:p-8">
            <h2 className="font-serif text-lg text-ink">Start with a real situation</h2>
            <p className="mt-2 max-w-prose text-[0.9375rem] leading-relaxed text-ink-2">
              Describe what you are facing in your own words, or search with no query to browse the
              corpus by seniority.
            </p>
            <ul className="mt-5 flex flex-wrap gap-2">
              {EXAMPLE_QUERIES.map((example) => (
                <li key={example}>
                  <button
                    type="button"
                    onClick={() => {
                      setQuery(example);
                      runSearch(example, filters);
                    }}
                    className="rounded-full border border-royal-light bg-white px-3.5 py-1.5 text-sm text-ink-2 transition-colors hover:border-royal hover:text-royal"
                  >
                    {example}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {!loading && !error && hasSearched && results.length === 0 && (
          <EmptyState
            icon={SearchIcon}
            title="No experiences found"
            message={
              data?.message ||
              "Nothing in the knowledge base matches that yet. Try broader wording or remove a filter."
            }
            action={
              activeFilterCount > 0 ? (
                <Button variant="secondary" onClick={clearFilters}>
                  Clear filters and search again
                </Button>
              ) : null
            }
          />
        )}

        {!loading && !error && results.length > 0 && (
          <>
            <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2 border-b border-rule pb-3">
              <p className="text-sm text-ink-2">
                {data.count} {data.count === 1 ? "experience" : "experiences"}
                {data.query ? ` for "${data.query}"` : " (browsing by seniority)"}
              </p>
              <p className="text-xs text-ink-3">
                Ranked by {data.ranking_method === "embeddings" ? "semantic similarity" : data.ranking_method}
              </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {results.map((result) => (
                <ResultCard key={result.id} result={result} onOpen={setSelected} />
              ))}
            </div>
          </>
        )}
      </section>

      {/* Detail view */}
      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected?.title}
        subtitle={
          selected
            ? [
                selected.contributor_name,
                selected.years_experience != null ? `${selected.years_experience} years` : null,
                selected.company,
                selected.year,
              ]
                .filter(Boolean)
                .join(" · ")
            : ""
        }
        footer={
          selected?.source ? (
            <p className="text-xs text-ink-3">Source: {selected.source}</p>
          ) : null
        }
      >
        {selected && (
          <RecordSheet
            emptyText="Not recorded for this experience"
            fields={experienceToFields(selected, "Not recorded for this experience").filter(
              (field) =>
                // The search result carries a subset of the nine fields.
                ["Problem", "Decision", "Root cause", "Lesson", "What I wish I knew"].includes(
                  field.label
                )
            )}
          />
        )}
      </Modal>
    </div>
  );
}