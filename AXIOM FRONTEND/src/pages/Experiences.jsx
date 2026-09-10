/**
 * Experiences.jsx
 * ---------------
 * Knowledge Archive: browsable experience library.
 * Editorial presentation with intentional White + Blue visual rhythm:
 * - Featured Incident Spotlight (#1): White card with Soft Blue lesson
 * - 3-Column Engineering Showcase (#2 - #4): Alternating White and Light Blue cards
 * - Structured Archive Rows (#5+): Crisp alternating rows with Dark Navy typography
 */

import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  Search as SearchIcon,
  SlidersHorizontal,
  X,
  ArrowRight,
  User,
  Building,
  Calendar,
  Sparkles,
  Lightbulb,
  Layers,
  Clock,
} from "lucide-react";

import { api } from "../api/api";
import useApi from "../hooks/useApi";
import Button from "../components/Button";
import PageHeader from "../components/PageHeader";
import { Badge, Card, DemoBadge } from "../components/Card";
import { LoadingState, ErrorState, EmptyState } from "../components/StateViews";

export default function Experiences() {
  const [query, setQuery] = useState("");
  const [domain, setDomain] = useState("");
  const [role, setRole] = useState("");
  const [expertise, setExpertise] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("");
  const [sort, setSort] = useState("recent");
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [viewMode, setViewMode] = useState("editorial"); // "editorial" | "compact"

  const filters = useMemo(
    () => ({
      q: query || undefined,
      domain: domain || undefined,
      role: role || undefined,
      expertise: expertise || undefined,
      experience_level: experienceLevel || undefined,
      sort,
      limit: 50,
    }),
    [query, domain, role, expertise, experienceLevel, sort]
  );

  const { data, loading, error, reload } = useApi(
    () => api.experiences(filters),
    [filters]
  );

  const experiences = data?.experiences || [];
  const facets = data?.facets || {};

  const activeFiltersCount = [domain, role, expertise, experienceLevel].filter(Boolean).length;

  function clearAllFilters() {
    setDomain("");
    setRole("");
    setExpertise("");
    setExperienceLevel("");
    setQuery("");
  }

  // Split into editorial tiers
  const featured = experiences[0] || null;
  const showcase = experiences.slice(1, 4);
  const archive = experiences.slice(4);

  return (
    <div className="animate-fade-in space-y-8">
      <PageHeader
        title="Experience Knowledge Library"
        description="Searchable, verified real-world engineering experiences, incident debriefs, and hard-earned lessons from seasoned practitioners across production systems."
        breadcrumbs={[{ label: "Home", to: "/" }, { label: "Experiences" }]}
        actions={
          <Button to="/record" icon={Sparkles}>
            Capture Experience
          </Button>
        }
      />

      {/* Search & Filter Toolbar in Soft Light Blue Container */}
      <div className="rounded-2xl border border-blue-200/80 bg-blue-50/60 p-3 sm:p-4 shadow-subtle flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <SearchIcon
            size={18}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-3"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search problems, decisions, lessons, or keywords…"
            className="w-full rounded-xl border border-rule bg-white py-2.5 pl-10 pr-4 text-sm text-ink placeholder:text-ink-3 shadow-subtle focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 transition-all"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="hidden sm:flex rounded-xl border border-blue-200 bg-white p-0.5 shadow-subtle">
            <button
              type="button"
              onClick={() => setViewMode("editorial")}
              className={`rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
                viewMode === "editorial"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-ink-2 hover:text-ink"
              }`}
            >
              Editorial
            </button>
            <button
              type="button"
              onClick={() => setViewMode("compact")}
              className={`rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
                viewMode === "compact"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-ink-2 hover:text-ink"
              }`}
            >
              Archive Rows
            </button>
          </div>

          {/* Sort toggle */}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="rounded-xl border border-blue-200 bg-white px-3 py-2.5 text-xs font-semibold text-ink-2 shadow-subtle focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
            aria-label="Sort experiences"
          >
            <option value="recent">Sort: Most Recent</option>
            <option value="seniority">Sort: By Seniority</option>
          </select>

          {/* Filter toggle button */}
          <button
            type="button"
            onClick={() => setShowFilterPanel(!showFilterPanel)}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2.5 text-xs font-semibold shadow-subtle transition-all ${
              showFilterPanel || activeFiltersCount > 0
                ? "border-blue-600 bg-blue-600 text-white shadow-xs"
                : "border-blue-200 bg-white text-navy hover:bg-blue-50"
            }`}
          >
            <SlidersHorizontal size={14} />
            <span>Filters {activeFiltersCount > 0 ? `(${activeFiltersCount})` : ""}</span>
          </button>
        </div>
      </div>

      {/* Expandable facet filter panel */}
      {showFilterPanel && (
        <Card className="p-5 sm:p-6 border border-blue-200 bg-gradient-to-b from-blue-50 to-white shadow-subtle animate-fade-in">
          <div className="flex items-center justify-between border-b border-blue-200 pb-3 mb-4">
            <h3 className="font-sans text-sm font-bold text-navy">Filter Knowledge Records</h3>
            {activeFiltersCount > 0 && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline"
              >
                <X size={12} /> Clear all filters
              </button>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label htmlFor="filter-domain" className="mb-1 block text-xs font-bold text-navy uppercase tracking-wide">
                Domain
              </label>
              <select
                id="filter-domain"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                className="w-full rounded-lg border border-rule bg-white px-2.5 py-2 text-xs text-ink focus:border-blue-600 focus:outline-none"
              >
                <option value="">All Domains</option>
                {facets.domains?.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="filter-expertise" className="mb-1 block text-xs font-bold text-navy uppercase tracking-wide">
                Expertise
              </label>
              <select
                id="filter-expertise"
                value={expertise}
                onChange={(e) => setExpertise(e.target.value)}
                className="w-full rounded-lg border border-rule bg-white px-2.5 py-2 text-xs text-ink focus:border-blue-600 focus:outline-none"
              >
                <option value="">All Expertise</option>
                {facets.expertise?.map((ex) => (
                  <option key={ex} value={ex}>
                    {ex}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="filter-level" className="mb-1 block text-xs font-bold text-navy uppercase tracking-wide">
                Experience Level
              </label>
              <select
                id="filter-level"
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value)}
                className="w-full rounded-lg border border-rule bg-white px-2.5 py-2 text-xs text-ink focus:border-blue-600 focus:outline-none"
              >
                <option value="">All Levels</option>
                {facets.experience_levels?.map((lvl) => (
                  <option key={lvl} value={lvl}>
                    {lvl}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="filter-role" className="mb-1 block text-xs font-bold text-navy uppercase tracking-wide">
                Role
              </label>
              <select
                id="filter-role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full rounded-lg border border-rule bg-white px-2.5 py-2 text-xs text-ink focus:border-blue-600 focus:outline-none"
              >
                <option value="">All Roles</option>
                {facets.roles?.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>
      )}

      {/* Results meta count */}
      {!loading && !error && (
        <div className="flex items-center justify-between text-xs font-medium text-ink-3">
          <p>
            Showing <span className="font-bold text-navy">{experiences.length}</span> structured engineering records
          </p>
          {query && (
            <p className="italic">
              Matching query &ldquo;{query}&rdquo;
            </p>
          )}
        </div>
      )}

      {/* States */}
      {loading && <LoadingState message="Loading experience knowledge records…" rows={3} />}
      {!loading && error && <ErrorState error={error} onRetry={reload} />}

      {!loading && !error && experiences.length === 0 && (
        <EmptyState
          icon={BookOpen}
          title="No matching experiences found"
          message="Try loosening your search terms or clearing selected facet filters."
          action={
            activeFiltersCount > 0 ? (
              <Button variant="secondary" onClick={clearAllFilters}>
                Clear filters
              </Button>
            ) : null
          }
        />
      )}

      {/* DIVERSE EDITORIAL LAYOUT WITH INTENTIONAL COLOR RHYTHM */}
      {!loading && !error && experiences.length > 0 && viewMode === "editorial" && !query && (
        <div className="space-y-12">
          {/* TIER 1: FEATURED SPOTLIGHT (WHITE CARD + SOFT BLUE HIGHLIGHT) */}
          {featured && (
            <section aria-labelledby="featured-incident-heading" className="rounded-3xl border-2 border-blue-200 bg-white p-7 sm:p-10 shadow-card">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rule pb-4 mb-6">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-blue-600 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-xs">
                    Featured Incident Spotlight
                  </span>
                  {featured.domain && <Badge tone="royal">{featured.domain}</Badge>}
                  {featured.expertise && <Badge tone="neutral">{featured.expertise}</Badge>}
                  {featured.is_demo && <DemoBadge />}
                </div>

                <div className="flex items-center gap-3 text-xs text-ink-3 font-mono">
                  {featured.year && <span>Incident Year: {featured.year}</span>}
                  <span>ID: {featured.id}</span>
                </div>
              </div>

              <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr]">
                <div className="space-y-4">
                  <h2 id="featured-incident-heading" className="font-sans text-2xl sm:text-3xl font-extrabold tracking-tight text-navy leading-tight">
                    <Link to={`/experiences/${featured.id}`} className="hover:text-blue-600 transition-colors">
                      {featured.title}
                    </Link>
                  </h2>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-2">
                    <span className="inline-flex items-center gap-1.5 font-bold text-navy">
                      <User size={14} className="text-blue-600" /> {featured.contributor_name}
                    </span>
                    {featured.role && <span>{featured.role}</span>}
                    {featured.years_experience != null && (
                      <span className="text-ink-3 font-mono">{featured.years_experience} yrs experience</span>
                    )}
                    {featured.company && (
                      <span className="inline-flex items-center gap-1 text-ink-3">
                        <Building size={12} /> {featured.company}
                      </span>
                    )}
                  </div>

                  {/* Problem & Decision */}
                  <div className="space-y-3 pt-2">
                    <div>
                      <span className="text-label font-bold uppercase tracking-wider text-ink-3">
                        The Problem Encountered
                      </span>
                      <p className="mt-1 text-sm leading-relaxed text-ink-2">
                        {featured.problem}
                      </p>
                    </div>

                    {featured.context && (
                      <div className="rounded-xl border border-rule bg-paper p-3">
                        <span className="text-label font-bold uppercase tracking-wider text-ink-3">
                          Operating Context
                        </span>
                        <p className="mt-1 text-xs leading-relaxed text-ink-2">
                          {featured.context}
                        </p>
                      </div>
                    )}

                    <div>
                      <span className="text-label font-bold uppercase tracking-wider text-ink-3">
                        Key Decision & Turning Point
                      </span>
                      <p className="mt-1 text-sm font-semibold text-navy leading-relaxed">
                        {featured.decision}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Right Callout: Medium Blue Highlighted Box (#2563EB) */}
                <div className="flex flex-col justify-between rounded-2xl border-2 border-blue-400 bg-gradient-to-br from-blue-600 to-blue-700 text-white p-6 sm:p-7 shadow-md">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-100 mb-2">
                      <Lightbulb size={16} className="text-cyan-200" />
                      <span>Transferred Senior Lesson</span>
                    </div>

                    <blockquote className="font-serif text-lg sm:text-xl font-medium leading-relaxed text-white">
                      &ldquo;{featured.lesson}&rdquo;
                    </blockquote>

                    {featured.what_i_wish_i_knew && (
                      <div className="mt-5 border-t border-white/20 pt-4 text-xs leading-relaxed text-blue-100">
                        <span className="font-bold text-white block mb-0.5">What I Wish I Knew:</span>
                        {featured.what_i_wish_i_knew}
                      </div>
                    )}
                  </div>

                  <div className="mt-6 pt-4 border-t border-white/20 flex items-center justify-between">
                    <span className="text-xs text-blue-200">Comprehensive deconstruction</span>
                    <Link
                      to={`/experiences/${featured.id}`}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-xs font-bold text-blue-700 hover:bg-blue-50 transition-colors shadow-sm"
                    >
                      <span>Read Full Record</span>
                      <ArrowRight size={13} />
                    </Link>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* TIER 2: 3-COLUMN SHOWCASE (MIXING WHITE & LIGHT BLUE CARDS) */}
          {showcase.length > 0 && (
            <section aria-labelledby="showcase-heading" className="space-y-4">
              <div className="flex items-center justify-between border-b border-rule pb-2">
                <h3 id="showcase-heading" className="font-sans text-lg font-bold text-navy flex items-center gap-2">
                  <Layers size={18} className="text-blue-600" />
                  <span>Critical Production Debriefs</span>
                </h3>
                <span className="text-xs text-ink-3">High-impact architectural turning points</span>
              </div>

              <div className="grid gap-6 md:grid-cols-3">
                {showcase.map((exp, idx) => {
                  const isLightBlue = idx === 1; // Middle card uses Light Blue for visual variation
                  return (
                    <article
                      key={exp.id}
                      className={`flex flex-col justify-between rounded-2xl p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-card-hover ${
                        isLightBlue
                          ? "border border-blue-200 bg-blue-50/80 shadow-subtle hover:border-blue-400"
                          : "border border-rule bg-white shadow-subtle hover:border-blue-300"
                      }`}
                    >
                      <div>
                        <div className="flex flex-wrap items-center gap-1.5 mb-3">
                          {exp.domain && <Badge tone="royal">{exp.domain}</Badge>}
                          {exp.is_demo && <DemoBadge />}
                        </div>

                        <h4 className="font-sans text-base font-bold text-navy leading-snug hover:text-blue-600 transition-colors">
                          <Link to={`/experiences/${exp.id}`}>{exp.title}</Link>
                        </h4>

                        <p className={`mt-2 text-xs ${isLightBlue ? "text-navy font-medium" : "text-ink-2"}`}>
                          By <span className="font-semibold text-navy">{exp.contributor_name}</span> ({exp.role})
                        </p>

                        <div className={`mt-4 rounded-xl p-3 border ${
                          isLightBlue ? "border-blue-200 bg-white" : "border-blue-150 bg-blue-50/80"
                        }`}>
                          <span className="text-label font-bold uppercase tracking-wider text-blue-700 text-[0.6875rem] block mb-1">
                            Core Lesson
                          </span>
                          <p className="font-serif text-xs leading-relaxed text-navy line-clamp-3">
                            &ldquo;{exp.lesson}&rdquo;
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 border-t border-rule/70 pt-3 flex items-center justify-between text-xs font-semibold text-blue-600">
                        <span className="text-ink-3 font-mono">{exp.year || "Archive"}</span>
                        <Link to={`/experiences/${exp.id}`} className="inline-flex items-center gap-1 hover:underline font-bold">
                          <span>Read debrief</span>
                          <ArrowRight size={13} />
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          )}

          {/* TIER 3: STRUCTURED ARCHIVE TIMELINE / ROWS */}
          {archive.length > 0 && (
            <section aria-labelledby="archive-heading" className="space-y-4">
              <div className="flex items-center justify-between border-b border-rule pb-2">
                <h3 id="archive-heading" className="font-sans text-lg font-bold text-navy flex items-center gap-2">
                  <Clock size={18} className="text-blue-600" />
                  <span>Engineering Knowledge Archive ({archive.length} Records)</span>
                </h3>
                <span className="text-xs text-ink-3">Indexed historical incident catalog</span>
              </div>

              <div className="divide-y divide-rule rounded-2xl border border-rule bg-white overflow-hidden shadow-subtle">
                {archive.map((exp, idx) => {
                  const isEven = idx % 2 === 1;
                  return (
                    <article
                      key={exp.id}
                      className={`group p-5 sm:p-6 transition-colors flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between ${
                        isEven ? "bg-paper/70 hover:bg-blue-50/40" : "bg-white hover:bg-blue-50/30"
                      }`}
                    >
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          {exp.domain && (
                            <Badge tone="royal" className="text-[0.6875rem]">
                              {exp.domain}
                            </Badge>
                          )}
                          {exp.expertise && (
                            <span className="text-xs font-mono text-ink-3">
                              {exp.expertise}
                            </span>
                          )}
                          {exp.year && (
                            <span className="text-xs font-mono text-ink-3">
                              · {exp.year}
                            </span>
                          )}
                          {exp.is_demo && <DemoBadge />}
                        </div>

                        <h4 className="font-sans text-base font-bold text-navy group-hover:text-blue-600 transition-colors">
                          <Link to={`/experiences/${exp.id}`}>{exp.title}</Link>
                        </h4>

                        <p className="text-xs sm:text-sm text-ink-2 line-clamp-2 leading-relaxed">
                          <span className="font-semibold text-navy">Problem: </span>{exp.problem}
                        </p>

                        <p className="text-xs text-blue-700 font-medium line-clamp-1 font-serif">
                          Lesson: &ldquo;{exp.lesson}&rdquo;
                        </p>
                      </div>

                      <div className="flex shrink-0 items-center justify-between lg:justify-end gap-4 pt-2 lg:pt-0 border-t lg:border-t-0 border-rule/60">
                        <div className="text-left lg:text-right text-xs">
                          <p className="font-bold text-navy">{exp.contributor_name}</p>
                          <p className="text-ink-3">{exp.role}</p>
                        </div>

                        <Button to={`/experiences/${exp.id}`} variant="secondary" size="sm" icon={ArrowRight}>
                          View
                        </Button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      )}

      {/* COMPACT ROW VIEW OR SEARCH RESULTS VIEW */}
      {!loading && !error && experiences.length > 0 && (viewMode === "compact" || query) && (
        <div className="divide-y divide-rule rounded-2xl border border-rule bg-white overflow-hidden shadow-subtle">
          {experiences.map((exp, idx) => (
            <article
              key={exp.id}
              className={`group p-5 sm:p-6 transition-colors flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between ${
                idx % 2 === 1 ? "bg-paper/70 hover:bg-blue-50/40" : "bg-white hover:bg-blue-50/30"
              }`}
            >
              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  {exp.domain && (
                    <Badge tone="royal" className="text-[0.6875rem]">
                      {exp.domain}
                    </Badge>
                  )}
                  {exp.expertise && (
                    <Badge tone="neutral" className="text-[0.6875rem]">
                      {exp.expertise}
                    </Badge>
                  )}
                  {exp.year && (
                    <span className="text-xs font-mono text-ink-3">
                      {exp.year}
                    </span>
                  )}
                  {exp.is_demo && <DemoBadge />}
                </div>

                <h3 className="font-sans text-base font-bold text-navy group-hover:text-blue-600 transition-colors">
                  <Link to={`/experiences/${exp.id}`}>{exp.title}</Link>
                </h3>

                <p className="text-xs sm:text-sm text-ink-2 line-clamp-2 leading-relaxed">
                  <span className="font-semibold text-navy">Problem: </span>{exp.problem}
                </p>

                <p className="text-xs text-blue-700 font-medium line-clamp-1 font-serif">
                  Lesson: &ldquo;{exp.lesson}&rdquo;
                </p>
              </div>

              <div className="flex shrink-0 items-center justify-between lg:justify-end gap-4 pt-2 lg:pt-0 border-t lg:border-t-0 border-rule/60">
                <div className="text-left lg:text-right text-xs">
                  <p className="font-bold text-navy">{exp.contributor_name}</p>
                  <p className="text-ink-3">{exp.role}</p>
                </div>

                <Button to={`/experiences/${exp.id}`} variant="secondary" size="sm" icon={ArrowRight}>
                  View Record
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
