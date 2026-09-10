/**
 * Search.jsx
 * ----------
 * Ask Experience: Knowledge archive retrieval engine.
 *
 * Section 12 Requirements:
 * - White foundation
 * - Large light-blue search area
 * - Blue search button
 * - White result cards
 * - Selected result -> subtle blue highlight
 * - Important lesson -> stronger blue highlight
 */

import { useCallback, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search as SearchIcon,
  SlidersHorizontal,
  X,
  ArrowRight,
  User,
  Lightbulb,
  Building,
  Target,
  Sparkles,
} from "lucide-react";

import { api, describeError } from "../api/api";
import Button from "../components/Button";
import PageHeader from "../components/PageHeader";
import Modal from "../components/Modal";
import RecordSheet, { experienceToFields } from "../components/RecordSheet";
import { Badge, Card, DemoBadge } from "../components/Card";
import { EmptyState, ErrorState, LoadingState } from "../components/StateViews";

const EMPTY_FILTERS = {
  domain: "",
  expertise: "",
  experience_level: "",
  engineering_type: "",
  company: "",
};

const SUGGESTED_QUERIES = [
  "Production API suddenly became slow",
  "How do senior engineers approach database migrations?",
  "What should I check before scaling a service?",
  "Lessons from failed deployments",
  "How do experienced teams handle authentication failures?",
];

function FilterField({ label, id, ...rest }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-xs font-bold uppercase tracking-wider text-navy">
        {label}
      </label>
      <input
        id={id}
        className="w-full rounded-xl border border-rule bg-white px-3 py-2 text-xs text-ink placeholder:text-ink-3/70 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
        {...rest}
      />
    </div>
  );
}

function SearchResultCard({ result, onOpenModal }) {
  return (
    <article className="group flex flex-col justify-between rounded-3xl border border-rule bg-white p-7 shadow-subtle transition-all duration-200 hover:-translate-y-1 hover:border-blue-300 hover:shadow-card-hover">
      <div className="space-y-4">
        {/* Header Badges & Relevance */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-rule/60 pb-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {result.domain && <Badge tone="royal">{result.domain}</Badge>}
            {result.engineering_type && <Badge tone="neutral">{result.engineering_type}</Badge>}
            {result.expertise && <Badge tone="neutral">{result.expertise}</Badge>}
            {result.is_demo && <DemoBadge />}
          </div>

          {result.relevance > 0 && (
            <span
              className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 font-mono text-xs font-bold text-emerald-700 border border-emerald-200"
              title={`Relevance score from ${result.ranking_method} ranker`}
            >
              <Target size={12} />
              <span>{Math.round(result.relevance * 100)}% match</span>
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="font-sans text-xl font-bold tracking-tight text-navy group-hover:text-blue-600 transition-colors">
          <Link to={`/experiences/${result.id}`}>{result.title}</Link>
        </h3>

        {/* Contributor credentials */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-3 font-medium">
          <span className="inline-flex items-center gap-1 text-navy font-semibold">
            <User size={12} className="text-blue-600" /> {result.contributor_name}
          </span>
          {result.years_experience != null && <span>· {result.years_experience} yrs experience</span>}
          {result.company && (
            <span className="inline-flex items-center gap-1">
              <Building size={11} /> {result.company}
            </span>
          )}
        </div>

        {/* Structured Knowledge Breakdown */}
        <div className="space-y-3 pt-2">
          {result.problem && (
            <div>
              <span className="text-label font-bold uppercase tracking-wider text-ink-3">Problem</span>
              <p className="mt-0.5 line-clamp-2 text-xs sm:text-sm text-ink-2 leading-relaxed">
                {result.problem}
              </p>
            </div>
          )}

          {result.decision && (
            <div>
              <span className="text-label font-bold uppercase tracking-wider text-ink-3">Decision Taken</span>
              <p className="mt-0.5 line-clamp-2 text-xs sm:text-sm text-navy font-semibold leading-relaxed">
                {result.decision}
              </p>
            </div>
          )}

          {result.reasoning && (
            <div>
              <span className="text-label font-bold uppercase tracking-wider text-ink-3">Reasoning</span>
              <p className="mt-0.5 line-clamp-2 text-xs sm:text-sm text-ink-2 leading-relaxed">
                {result.reasoning}
              </p>
            </div>
          )}

          {result.outcome && (
            <div>
              <span className="text-label font-bold uppercase tracking-wider text-ink-3">Outcome</span>
              <p className="mt-0.5 line-clamp-2 text-xs sm:text-sm text-ink-2 leading-relaxed">
                {result.outcome}
              </p>
            </div>
          )}

          {/* Important Lesson: Medium Blue Highlight */}
          {result.lesson && (
            <div className="rounded-2xl border-2 border-blue-400 bg-gradient-to-br from-blue-600 to-blue-700 text-white p-4 sm:p-5 shadow-sm">
              <span className="text-label font-bold uppercase tracking-wider text-blue-100 flex items-center gap-1.5 mb-1.5">
                <Lightbulb size={14} className="text-cyan-200" />
                <span>Transferred Senior Lesson</span>
              </span>
              <p className="font-serif text-sm sm:text-base font-medium text-white leading-relaxed">
                &ldquo;{result.lesson}&rdquo;
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Footer controls */}
      <div className="mt-6 flex items-center justify-between border-t border-rule/60 pt-4">
        {result.matched_terms?.length > 0 ? (
          <p className="truncate text-xs text-ink-3 max-w-[200px]" title={result.matched_terms.join(", ")}>
            Matched: <span className="font-bold text-navy">{result.matched_terms.slice(0, 3).join(", ")}</span>
          </p>
        ) : (
          <span className="text-xs text-ink-3 font-mono">ID: {result.id}</span>
        )}

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => onOpenModal(result)}>
            Quick Sheet
          </Button>
          <Button to={`/experiences/${result.id}`} size="sm" icon={ArrowRight}>
            Read Record
          </Button>
        </div>
      </div>
    </article>
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
    () => Object.values(filters).filter((val) => val !== "").length,
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

  function handleSubmit(e) {
    e.preventDefault();
    runSearch(query, filters);
  }

  function clearFilters() {
    setFilters(EMPTY_FILTERS);
    if (hasSearched) runSearch(query, EMPTY_FILTERS);
  }

  const results = data?.results || [];

  return (
    <div className="animate-fade-in space-y-8">
      <PageHeader
        title="Ask Experience"
        description="Search real-world engineering experiences instead of model-generated guesses. Find what seasoned engineers actually decided and learned when facing identical production symptoms."
        breadcrumbs={[{ label: "Home", to: "/" }, { label: "Ask Experience" }]}
      />

      {/* Purpose Workflow Diagram Banner */}
      <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2.5 text-xs font-bold uppercase tracking-wider text-navy">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white text-[0.6875rem]">1</span>
            <span>User Has A Problem</span>
          </div>
          <ArrowRight size={14} className="text-blue-600 hidden sm:block" />
          <div className="flex items-center gap-2.5 text-xs font-bold uppercase tracking-wider text-navy">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white text-[0.6875rem]">2</span>
            <span>WisdomKernel Finds Experience</span>
          </div>
          <ArrowRight size={14} className="text-blue-600 hidden sm:block" />
          <div className="flex items-center gap-2.5 text-xs font-bold uppercase tracking-wider text-navy">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white text-[0.6875rem]">3</span>
            <span>User Learns From Reality</span>
          </div>
        </div>
      </div>

      {/* Large Light-Blue Search Area (#F0F6FF) */}
      <form
        onSubmit={handleSubmit}
        role="search"
        className="rounded-3xl border-2 border-blue-200 bg-gradient-to-b from-blue-50 via-blue-50/60 to-white p-6 sm:p-8 shadow-subtle space-y-4"
      >
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <SearchIcon
              size={20}
              aria-hidden="true"
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-blue-600"
            />
            <input
              id="search-query"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="What experience are you looking for?"
              className="w-full rounded-2xl border border-blue-200 bg-white py-3.5 pl-12 pr-4 text-base text-ink placeholder:text-ink-3/70 shadow-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 transition-all"
            />
          </div>

          <div className="flex gap-2.5">
            <Button type="submit" size="lg" loading={loading} className="px-6 shadow-md shadow-blue-600/20 font-bold">
              Search Archive
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="lg"
              icon={SlidersHorizontal}
              onClick={() => setShowFilters((open) => !open)}
              aria-expanded={showFilters}
            >
              Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
            </Button>
          </div>
        </div>

        {/* 5 Exact Suggested Queries from Prompt */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-xs font-bold text-navy">Example searches:</span>
          {SUGGESTED_QUERIES.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => {
                setQuery(example);
                runSearch(example, filters);
              }}
              className="rounded-lg border border-blue-200 bg-white px-2.5 py-1 text-xs text-navy hover:border-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-2xs font-medium"
            >
              {example}
            </button>
          ))}
        </div>

        {/* Expandable Filters Panel */}
        {showFilters && (
          <Card className="p-6 border border-blue-200 bg-white shadow-subtle animate-fade-in">
            <div className="flex items-center justify-between border-b border-rule pb-3 mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-navy">Refine Experience Search</span>
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
                >
                  <X size={12} /> Clear all filters
                </button>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <FilterField
                id="filter-domain"
                label="Domain"
                placeholder="e.g. Distributed Systems, Power Distribution"
                value={filters.domain}
                onChange={(e) => setFilters({ ...filters, domain: e.target.value })}
              />
              <FilterField
                id="filter-expertise"
                label="Expertise"
                placeholder="e.g. Database Scaling, Connection Pools"
                value={filters.expertise}
                onChange={(e) => setFilters({ ...filters, expertise: e.target.value })}
              />
              <FilterField
                id="filter-experience-level"
                label="Experience Level"
                placeholder="e.g. Senior, Staff, Principal"
                value={filters.experience_level}
                onChange={(e) => setFilters({ ...filters, experience_level: e.target.value })}
              />
              <FilterField
                id="filter-engineering-type"
                label="Engineering Type"
                placeholder="e.g. Backend Engineering, SRE, Electrical"
                value={filters.engineering_type}
                onChange={(e) => setFilters({ ...filters, engineering_type: e.target.value })}
              />
              <FilterField
                id="filter-company"
                label="Company / Environment"
                placeholder="e.g. Meridian Cloud Labs, Northstar"
                value={filters.company}
                onChange={(e) => setFilters({ ...filters, company: e.target.value })}
              />
            </div>
          </Card>
        )}
      </form>

      {/* Results Section */}
      <section aria-live="polite" aria-busy={loading}>
        {loading && <LoadingState message="Ranking human experiences against your situation…" rows={3} />}

        {!loading && error && (
          <ErrorState error={error} onRetry={() => runSearch(query, filters)} />
        )}

        {!loading && !error && !hasSearched && (
          <div className="rounded-3xl border border-dashed border-blue-200 bg-white p-8 sm:p-12 text-center shadow-subtle">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 mb-4 border border-blue-200">
              <SearchIcon size={24} />
            </div>
            <h3 className="font-sans text-xl font-bold text-navy">Ready to Query Experience Archive</h3>
            <p className="mt-2 max-w-lg mx-auto text-sm text-ink-2 leading-relaxed">
              Type your production problem above or select one of the suggested engineering queries to retrieve verified peer accounts, decisions, and outcomes.
            </p>
          </div>
        )}

        {!loading && !error && hasSearched && results.length === 0 && (
          <EmptyState
            icon={SearchIcon}
            title="No matching experiences found"
            message={
              data?.message ||
              "Nothing in the knowledge base matches your query and filters yet. Try searching broader symptoms or clearing filters."
            }
            action={
              activeFilterCount > 0 ? (
                <Button variant="secondary" onClick={clearFilters}>
                  Clear filters and retry
                </Button>
              ) : null
            }
          />
        )}

        {!loading && !error && results.length > 0 && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-rule pb-3">
              <p className="text-sm font-semibold text-navy">
                {data.count} {data.count === 1 ? "relevant experience" : "relevant experiences"} retrieved
                {data.query ? ` for "${data.query}"` : ""}
              </p>
              <p className="text-xs text-ink-3">
                Ranked by {data.ranking_method === "embeddings" ? "semantic vector similarity" : data.ranking_method}
              </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              {results.map((result) => (
                <SearchResultCard
                  key={result.id}
                  result={result}
                  onOpenModal={setSelected}
                />
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Quick Sheet Modal with Subtle Blue Accent */}
      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected?.title}
        subtitle={
          selected
            ? [
                selected.contributor_name,
                selected.years_experience != null ? `${selected.years_experience} yrs experience` : null,
                selected.company,
                selected.year,
              ]
                .filter(Boolean)
                .join(" · ")
            : ""
        }
        footer={
          <div className="flex items-center justify-between w-full">
            <span className="text-xs text-ink-3">Source: {selected?.source || "Archive"}</span>
            {selected && (
              <Button to={`/experiences/${selected.id}`} size="sm" icon={ArrowRight}>
                Open Full Article View
              </Button>
            )}
          </div>
        }
      >
        {selected && (
          <RecordSheet
            emptyText="Not recorded for this experience"
            fields={experienceToFields(selected, "Not recorded for this experience").filter(
              (field) =>
                ["Problem", "Decision", "Reasoning", "Outcome", "Lesson", "What I wish I knew"].includes(
                  field.label
                )
            )}
          />
        )}
      </Modal>
    </div>
  );
}
