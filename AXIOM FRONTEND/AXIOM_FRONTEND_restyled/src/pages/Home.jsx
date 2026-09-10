/**
 * Home.jsx
 * --------
 * Landing and dashboard. Explains the product in one screen, then shows
 * the three primary actions and live corpus statistics from GET /dashboard.
 *
 * Every number here comes from the backend. Nothing is hardcoded.
 */

import { Link } from "react-router-dom";
import { ArrowRight, Lightbulb, Mic, Search, ShieldAlert } from "lucide-react";

import { api } from "../api/api";
import useApi from "../hooks/useApi";
import Button from "../components/Button";
import { Card } from "../components/Card";
import { EmptyState, ErrorState, InlineLoader } from "../components/StateViews";

const PRIMARY_ACTIONS = [
  {
    to: "/record",
    icon: Mic,
    title: "Record an experience",
    body: "Speak about one real incident. WisdomKernel writes it down and structures it into a record.",
    tint: "bg-royal-tint text-royal-dark",
  },
  {
    to: "/search",
    icon: Search,
    title: "Ask experience",
    body: "Search what engineers actually did in situations like yours, not what a model guesses they might.",
    tint: "bg-sky-tint text-sky",
  },
  {
    to: "/mistakes",
    icon: ShieldAlert,
    title: "Learn from mistakes",
    body: "Read the wrong assumption, the real cause, and what should have been done instead.",
    tint: "bg-peach-tint text-peach",
  },
];

const PIPELINE = [
  {
    term: "Experience",
    detail: "A senior engineer describes one incident out loud, in their own words.",
  },
  {
    term: "Structured knowledge",
    detail:
      "The account is split into nine fields: problem, context, decision, reasoning, mistake, root cause, outcome, lesson, and what they wish they had known.",
  },
  {
    term: "Reusable wisdom",
    detail:
      "Those records become searchable, and turn into incident simulations a newer engineer can work through.",
  },
];

function StatLine({ value, label, loading }) {
  return (
    <div>
      <p className="font-mono text-2xl tabular-nums text-ink">
        {loading ? <span className="text-ink-3">—</span> : value}
      </p>
      <p className="mt-1 text-sm text-ink-2">{label}</p>
    </div>
  );
}

export default function Home() {
  const { data, loading, error, reload } = useApi(() => api.dashboard(), []);
  const stats = data?.stats;

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <section className="hero-gradient relative overflow-hidden px-7 py-10 sm:px-10 sm:py-12">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-white/10"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-20 right-24 h-40 w-40 rounded-full bg-white/10"
        />

        <p className="font-mono text-xs uppercase tracking-[0.18em] text-white/70">
          WisdomKernel
        </p>

        <h1 className="relative mt-4 max-w-[16ch] font-serif text-[2.25rem] leading-[1.1] tracking-tight text-white sm:text-[3rem]">
          Experience should never retire.
        </h1>

        <p className="relative mt-5 max-w-prose text-lg leading-relaxed text-white/85">
          Turn real-world experience into knowledge that the next generation can actually use.
        </p>

        <div className="relative mt-7 flex flex-wrap gap-3">
          <Button
            to="/record"
            size="lg"
            icon={Mic}
            className="!bg-white !border-white !text-royal-dark hover:!bg-white/90"
          >
            Record an experience
          </Button>
          <Button
            to="/search"
            size="lg"
            icon={Search}
            className="!border-white/40 !bg-white/10 !text-white hover:!bg-white/20"
          >
            Ask experience
          </Button>
        </div>
      </section>

      {/* What happens to an experience */}
      <section className="mt-10 border-b border-rule py-10" aria-labelledby="pipeline-heading">
        <h2 id="pipeline-heading" className="text-heading text-ink">
          What happens to an experience
        </h2>

                        <ol className="mt-6 grid gap-px overflow-hidden rounded-2xl border border-rule bg-rule shadow-soft md:grid-cols-3">
          {PIPELINE.map((step, index) => (
            <li key={step.term} className="bg-royal-tint p-7">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white font-mono text-xs text-royal-dark shadow-sm">
                  {index + 1}
                </span>
                <h3 className="font-serif text-lg text-ink">{step.term}</h3>
              </div>
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-ink-2">{step.detail}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Primary actions */}
      <section className="border-b border-rule py-10" aria-labelledby="actions-heading">
        <h2 id="actions-heading" className="sr-only">
          Start here
        </h2>

        <div className="grid gap-4 md:grid-cols-3">
                    {PRIMARY_ACTIONS.map(({ to, icon: Icon, title, body, tint }) => (
            <Card key={to} interactive className="group">
              <Link to={to} className="block h-full rounded-2xl p-6">
                <span
                  className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ring-1 ring-inset ring-black/5 ${tint}`}
                >
                  <Icon size={20} aria-hidden="true" />
                </span>
                <h3 className="mt-4 font-serif text-lg text-ink">{title}</h3>
                <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink-2">{body}</p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-royal">
                  Open
                  <ArrowRight
                    size={14}
                    aria-hidden="true"
                    className="transition-transform duration-150 group-hover:translate-x-0.5"
                  />
                </span>
              </Link>
            </Card>
          ))}
        </div>
      </section>

      {/* Live corpus statistics */}
      <section className="pt-10" aria-labelledby="corpus-heading">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 id="corpus-heading" className="text-heading text-ink">
            In the knowledge base
          </h2>
          {data?.note && <p className="text-xs text-ink-3">{data.note}</p>}
        </div>

        {error ? (
          <div className="mt-5">
            <ErrorState error={error} onRetry={reload} />
          </div>
        ) : !loading && stats && stats.experiences_captured === 0 ? (
          <div className="mt-5">
            <EmptyState
              icon={Mic}
              title="The knowledge base is empty"
              message="No experiences have been captured yet. Record the first one and it will appear here."
              action={<Button to="/record">Record an experience</Button>}
            />
          </div>
        ) : (
          <>
            {loading && (
              <div className="mt-5">
                <InlineLoader message="Loading knowledge base statistics…" />
              </div>
            )}

            <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-7 rounded-2xl border border-rule bg-surface p-6 shadow-sm shadow-ink/[0.03] sm:grid-cols-3 lg:grid-cols-6">
              <StatLine value={stats?.experiences_captured} label="Experiences" loading={loading} />
              <StatLine value={stats?.contributors} label="Contributors" loading={loading} />
              <StatLine
                value={stats?.total_years_of_experience}
                label="Years represented"
                loading={loading}
              />
              <StatLine value={stats?.mistakes_documented} label="Mistakes" loading={loading} />
              <StatLine value={stats?.simulator_scenarios} label="Scenarios" loading={loading} />
              <StatLine value={stats?.advice_entries} label="Advice notes" loading={loading} />
            </div>

            {data?.recent_experiences?.length > 0 && (
              <div className="mt-8">
                <h3 className="text-sm font-medium text-ink-2">Most recently captured</h3>
                <ul className="mt-3 divide-y divide-rule border-y border-rule">
                  {data.recent_experiences.map((item) => (
                    <li key={item.id} className="flex flex-col gap-1 py-3.5 sm:flex-row sm:gap-6">
                      <span className="font-mono text-sm text-ink-3 sm:w-14 sm:shrink-0">
                        {item.year}
                      </span>
                      <div className="min-w-0">
                        <p className="text-[0.9375rem] text-ink">{item.title}</p>
                        {item.lesson && (
                          <p className="mt-1 max-w-prose text-sm leading-relaxed text-ink-2">
                            {item.lesson}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="mt-5">
                  <Button to="/advice" variant="secondary" size="sm" icon={Lightbulb}>
                    Read what engineers wish they had known
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
