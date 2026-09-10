/**
 * Home.jsx
 * --------
 * Editorial & Human Knowledge Product Experience for WisdomKernel.
 *
 * Visual Rhythm (White + Multiple Shades of Blue + Dark Navy):
 * 1. Hero: Light Blue gradient (#EAF3FF to White) with Dark Navy typography
 * 2. Incident Shortcuts: Alternating White & Light Blue (#F0F6FF) cards
 * 3. 5-Stage Pipeline: Soft Blue container with crisp White stage nodes
 * 4. Featured Spotlight: White container with Soft Blue lesson callout
 * 5. Platform Metrics: Subtle Light Blue backdrop with deep blue counters
 * 6. Dual Pillars: White Mistakes Pillar + Light Blue Simulator Pillar
 * 7. Advice Highlight: Soft Blue gradient card
 * 8. Private Organization Gateway: Dark Navy (#102A56) enterprise block
 */

import { Link } from "react-router-dom";
import {
  ArrowRight,
  Lightbulb,
  Mic,
  Search,
  ShieldAlert,
  BookOpen,
  Waypoints,
  Building2,
  Calendar,
  User,
  ShieldCheck,
  CheckCircle2,
  Layers,
  Sparkles,
  Target,
  FileText,
  Clock,
  Lock,
} from "lucide-react";

import { api } from "../api/api";
import useApi from "../hooks/useApi";
import { useAuth } from "../context/AuthContext";
import Button from "../components/Button";
import { Badge, Card, DemoBadge } from "../components/Card";
import { LoadingState, ErrorState } from "../components/StateViews";

const REAL_EXPERIENCE_EXAMPLES = [
  {
    title: "Production API suddenly became slow",
    tag: "Latency Spike",
    path: "/search?q=Production+API+suddenly+became+slow",
    desc: "How database connection pool exhaustion caused cascading thread starvation.",
    tone: "white",
  },
  {
    title: "Lessons from a failed database migration",
    tag: "Data Integrity",
    path: "/search?q=failed+database+migration",
    desc: "Why index rebuild locks during peak traffic led to an unrecoverable timeout.",
    tone: "blue",
  },
  {
    title: "What I wish I knew before scaling our system",
    tag: "Architecture",
    path: "/advice",
    desc: "The myth of horizontal scaling before optimizing hot query paths.",
    tone: "white",
  },
  {
    title: "How a senior engineer diagnosed a production outage",
    tag: "Incident Debrief",
    path: "/simulator",
    desc: "Step through the live telemetry decisions that isolated a transient network partition.",
    tone: "blue",
  },
];

const FIVE_STAGE_PIPELINE = [
  {
    step: "01",
    name: "CAPTURE",
    subtitle: "Raw Human Memory",
    detail: "A veteran engineer describes a critical incident out loud or in writing, capturing nuance and intuition documentation leaves behind.",
  },
  {
    step: "02",
    name: "STRUCTURE",
    subtitle: "9-Field Schema",
    detail: "Extracted into problem, context, decision, reasoning, mistake, root cause, outcome, lesson, and what they wish they knew.",
  },
  {
    step: "03",
    name: "VERIFY",
    subtitle: "Peer Validation",
    detail: "Verified against domain postmortems to ensure reproducibility and remove unverified folklore.",
  },
  {
    step: "04",
    name: "CONNECT",
    subtitle: "Semantic Graph",
    detail: "Cross-indexed by symptoms, system architectures, and error modes for instant discovery during active incidents.",
  },
  {
    step: "05",
    name: "REUSE",
    subtitle: "Active Transfer",
    detail: "Retrieved in active outages and transferred through interactive incident simulation for new engineers.",
  },
];

export default function Home() {
  const { activeMode } = useAuth();
  const { data: dashboardData, loading: dashLoading, error: dashError, reload: reloadDash } = useApi(
    () => api.dashboard(),
    []
  );

  const { data: mistakesData } = useApi(() => api.mistakes({ limit: 2 }), []);
  const { data: simulatorData } = useApi(() => api.simulator({ limit: 2 }), []);
  const { data: adviceData } = useApi(() => api.advice(), []);

  const stats = dashboardData?.stats;
  const recentExperiences = dashboardData?.recent_experiences || [];
  const featuredExp = recentExperiences[0] || null;
  const featuredMistake = mistakesData?.mistakes?.[0] || null;
  const featuredScenario = simulatorData?.scenarios?.[0] || null;
  const featuredAdvice = adviceData?.advice?.[0] || null;

  return (
    <div className="animate-fade-in space-y-16 sm:space-y-20">
      {/* 1. HERO SECTION: Main Homepage Anchor in Noticeably Darker, Richer Blue */}
      <section className="relative overflow-hidden rounded-3xl border border-blue-700/60 bg-gradient-to-br from-[#0B2149] via-[#102A56] to-[#1E3A8A] p-8 sm:p-12 lg:p-16 shadow-elevated">
        {/* Subtle decorative background auras */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-16 h-80 w-80 rounded-full bg-blue-500/20 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-16 -bottom-16 h-64 w-64 rounded-full bg-blue-400/15 blur-2xl"
        />

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-white/10 backdrop-blur-sm px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-blue-200 shadow-xs">
            <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)] animate-pulse" />
            <span>Human Engineering Knowledge Platform</span>
          </div>

          <h1 className="mt-6 font-sans text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.08]">
            Experience should never retire.
          </h1>

          <p className="mt-5 max-w-2xl text-lg sm:text-xl leading-relaxed text-blue-100 font-normal">
            Turn real-world experience into knowledge that the next generation can actually use. Structured lessons from senior engineers who faced the outages first.
          </p>

          {/* Primary & Secondary Actions */}
          <div className="mt-8 flex flex-wrap items-center gap-4">
            {activeMode === "SENIOR" && (
              <Link
                to="/record"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-base font-extrabold text-[#102A56] hover:bg-blue-50 hover:text-blue-700 shadow-lg shadow-black/25 transition-all"
              >
                <Mic size={18} className="text-blue-600" />
                <span>Capture an Experience</span>
              </Link>
            )}
            <Link
              to="/experiences"
              className="inline-flex items-center gap-2 rounded-xl border-2 border-white/40 bg-white/10 backdrop-blur-sm px-6 py-3.5 text-base font-bold text-white hover:bg-white/20 hover:border-white transition-all shadow-sm"
            >
              <BookOpen size={18} />
              <span>Explore Experiences</span>
            </Link>
            <Link
              to="/search"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-200 hover:text-white hover:underline px-2 py-2 transition-colors"
            >
              <Search size={15} />
              <span>Ask the Archive</span>
            </Link>
          </div>
        </div>

        {/* Real Experience Shortcuts Ribbon: High-Contrast White & Light Blue Cards */}
        <div className="relative z-10 mt-12 border-t border-blue-700/60 pt-8">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-200">
              Real-world incident cases in this archive
            </span>
            <span className="text-xs text-blue-300/80 font-medium hidden sm:inline">
              Click any case to inspect senior diagnosis
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {REAL_EXPERIENCE_EXAMPLES.map((ex) => (
              <Link
                key={ex.title}
                to={ex.path}
                className={`group flex flex-col justify-between rounded-2xl p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover ${
                  ex.tone === "blue"
                    ? "border border-blue-200 bg-blue-50/95 shadow-md hover:bg-white hover:border-blue-400"
                    : "border border-white/90 bg-white shadow-md hover:border-blue-300 hover:bg-blue-50/30"
                }`}
              >
                <div>
                  <span
                    className={`inline-block rounded px-2 py-0.5 text-[0.6875rem] font-bold tracking-wide uppercase ${
                      ex.tone === "blue"
                        ? "bg-white text-blue-700 border border-blue-200"
                        : "bg-blue-50 text-blue-600 border border-blue-100"
                    }`}
                  >
                    {ex.tag}
                  </span>
                  <h3 className="mt-2.5 font-sans text-sm font-bold text-navy group-hover:text-blue-600 transition-colors line-clamp-2">
                    {ex.title}
                  </h3>
                  <p className="mt-1 text-xs text-navy font-medium line-clamp-2 leading-relaxed">
                    {ex.desc}
                  </p>
                </div>
                <div className="mt-3 flex items-center gap-1 text-[0.6875rem] font-bold text-blue-600">
                  <span>Inspect case</span>
                  <ArrowRight size={11} className="transition-transform group-hover:translate-x-0.5" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 2. THE FIVE-STAGE EXPERIENCE PIPELINE: Soft Blue (#F0F6FF) Section with White Cards */}
      <section
        aria-labelledby="pipeline-heading"
        className="rounded-3xl border border-blue-200/80 bg-blue-50/70 p-8 sm:p-10 shadow-subtle space-y-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-blue-200 pb-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
              Operational Knowledge Lifecycle
            </span>
            <h2 id="pipeline-heading" className="mt-1 font-sans text-2xl sm:text-3xl font-extrabold text-navy">
              From unwritten memory to institutional asset
            </h2>
          </div>
          <p className="max-w-md text-xs sm:text-sm text-ink-2 leading-relaxed">
            WisdomKernel prevents knowledge retirement by turning verbal stories into reproducible engineering rules.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {FIVE_STAGE_PIPELINE.map((stage, idx) => (
            <div
              key={stage.step}
              className="relative flex flex-col justify-between rounded-2xl border border-blue-200/60 bg-white p-5 shadow-sm transition-all duration-200 hover:border-blue-400 hover:shadow-subtle"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-600 font-mono text-xs font-extrabold text-white">
                    {stage.step}
                  </span>
                  <span className="text-[0.6875rem] font-bold text-ink-3 uppercase tracking-wider">
                    Stage {idx + 1}
                  </span>
                </div>
                <h3 className="font-sans text-base font-extrabold text-navy">
                  {stage.name}
                </h3>
                <p className="font-mono text-[0.6875rem] font-semibold text-blue-600 mt-0.5">
                  {stage.subtitle}
                </p>
                <p className="mt-3 text-xs leading-relaxed text-ink-2">
                  {stage.detail}
                </p>
              </div>

              {idx < FIVE_STAGE_PIPELINE.length - 1 && (
                <div className="hidden lg:block absolute -right-2.5 top-1/2 -translate-y-1/2 z-20 text-blue-300">
                  <span className="font-mono text-xs font-bold">→</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 3. FEATURED EXPERIENCE SPOTLIGHT: Crisp White Container with Soft Blue Lesson */}
      {featuredExp && (
        <section aria-labelledby="featured-heading" className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-navy">
              Spotlight Incident Debrief
            </span>
            <Link to="/experiences" className="text-xs font-semibold text-blue-600 hover:underline">
              View all {dashboardData?.stats?.experiences_captured || 18} experiences →
            </Link>
          </div>

          <article className="rounded-3xl border border-rule bg-white p-7 sm:p-10 shadow-card transition-all duration-200 hover:border-blue-300">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {featuredExp.domain && <Badge tone="royal">{featuredExp.domain}</Badge>}
              <span className="font-mono text-xs text-ink-3">Captured Year {featuredExp.year}</span>
              <DemoBadge />
            </div>

            <h3 className="font-sans text-2xl sm:text-3xl font-extrabold tracking-tight text-navy leading-tight">
              <Link to={`/experiences/${featuredExp.id}`} className="hover:text-blue-600 transition-colors">
                {featuredExp.title}
              </Link>
            </h3>

            {/* Contributor Row */}
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-2">
              <span className="font-semibold text-navy flex items-center gap-1.5">
                <User size={13} className="text-blue-600" /> {featuredExp.contributor_name}
              </span>
              <span>· {featuredExp.role}</span>
              {featuredExp.years_experience != null && (
                <span className="text-ink-3 font-mono">({featuredExp.years_experience} yrs experience)</span>
              )}
            </div>

            {/* Situation & Decision in two clean columns */}
            <div className="mt-6 grid gap-6 sm:grid-cols-2 border-t border-rule pt-6">
              <div className="rounded-xl border border-rule bg-paper p-4">
                <span className="text-label font-bold uppercase tracking-wider text-ink-3">
                  The Problem & Symptoms
                </span>
                <p className="mt-1 text-sm leading-relaxed text-ink-2 line-clamp-3">
                  {featuredExp.problem}
                </p>
              </div>
              <div className="rounded-xl border border-rule bg-paper p-4">
                <span className="text-label font-bold uppercase tracking-wider text-ink-3">
                  The Decision Taken
                </span>
                <p className="mt-1 text-sm leading-relaxed text-navy font-semibold line-clamp-3">
                  {featuredExp.decision}
                </p>
              </div>
            </div>

            {/* Standout Transferred Lesson in Medium Blue (#2563EB) Callout */}
            {featuredExp.lesson && (
              <div className="mt-6 rounded-2xl border-2 border-blue-400 bg-gradient-to-br from-blue-600 to-blue-700 text-white p-6 sm:p-7 shadow-md">
                <span className="text-label font-bold uppercase tracking-wider text-blue-100 flex items-center gap-1.5">
                  <Lightbulb size={16} className="text-cyan-200" />
                  <span>The Transferred Engineering Lesson</span>
                </span>
                <p className="mt-2.5 font-serif text-lg sm:text-xl font-medium leading-relaxed text-white">
                  &ldquo;{featuredExp.lesson}&rdquo;
                </p>
              </div>
            )}

            <div className="mt-7 flex flex-wrap items-center justify-between gap-4 border-t border-rule pt-5">
              <span className="text-xs text-ink-3">
                Full 9-field engineering record available with root cause and postmortem
              </span>
              <Button to={`/experiences/${featuredExp.id}`} icon={ArrowRight}>
                Read full incident record
              </Button>
            </div>
          </article>
        </section>
      )}

      {/* 4. LIVE PLATFORM METRICS: Light Blue Backdrop */}
      <section
        aria-labelledby="platform-metrics-heading"
        className="rounded-3xl border border-blue-200/80 bg-blue-50/50 p-7 sm:p-9 shadow-subtle"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-blue-200 pb-4 mb-6">
          <div>
            <h2 id="platform-metrics-heading" className="font-sans text-xl sm:text-2xl font-extrabold text-navy">
              Live Knowledge Base Corpus
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-ink-2">
              All records backed by persistent storage and structured engineering postmortems.
            </p>
          </div>
          {dashboardData?.note && <span className="text-xs text-navy font-semibold">{dashboardData.note}</span>}
        </div>

        {dashError ? (
          <ErrorState error={dashError} onRetry={reloadDash} />
        ) : (
          <div className="grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-3 lg:grid-cols-6">
            <div className="rounded-xl border border-rule bg-white p-4 shadow-xs">
              <p className="font-mono text-3xl sm:text-4xl font-extrabold text-blue-600 tabular-nums">
                {dashLoading ? "—" : stats?.experiences_captured || 18}
              </p>
              <p className="mt-1 text-xs font-bold text-navy">Experiences</p>
              <p className="text-[0.6875rem] text-ink-3">Peer-reviewed</p>
            </div>

            <div className="rounded-xl border border-rule bg-white p-4 shadow-xs">
              <p className="font-mono text-3xl sm:text-4xl font-extrabold text-navy tabular-nums">
                {dashLoading ? "—" : stats?.contributors || 12}
              </p>
              <p className="mt-1 text-xs font-bold text-navy">Contributors</p>
              <p className="text-[0.6875rem] text-ink-3">Domain veterans</p>
            </div>

            <div className="rounded-xl border border-rule bg-white p-4 shadow-xs">
              <p className="font-mono text-3xl sm:text-4xl font-extrabold text-navy tabular-nums">
                {dashLoading ? "—" : `${stats?.total_years_of_experience || 285}+`}
              </p>
              <p className="mt-1 text-xs font-bold text-navy">Years Experience</p>
              <p className="text-[0.6875rem] text-ink-3">Preserved knowledge</p>
            </div>

            <div className="rounded-xl border border-rule bg-white p-4 shadow-xs">
              <p className="font-mono text-3xl sm:text-4xl font-extrabold text-wrong tabular-nums">
                {dashLoading ? "—" : stats?.mistakes_documented || 18}
              </p>
              <p className="mt-1 text-xs font-bold text-navy">Mistakes</p>
              <p className="text-[0.6875rem] text-ink-3">Belief vs Reality</p>
            </div>

            <div className="rounded-xl border border-rule bg-white p-4 shadow-xs">
              <p className="font-mono text-3xl sm:text-4xl font-extrabold text-blue-600 tabular-nums">
                {dashLoading ? "—" : stats?.simulator_scenarios || 5}
              </p>
              <p className="mt-1 text-xs font-bold text-navy">Scenarios</p>
              <p className="text-[0.6875rem] text-ink-3">Interactive practice</p>
            </div>

            <div className="rounded-xl border border-rule bg-white p-4 shadow-xs">
              <p className="font-mono text-3xl sm:text-4xl font-extrabold text-navy tabular-nums">
                {dashLoading ? "—" : stats?.advice_entries || 28}
              </p>
              <p className="mt-1 text-xs font-bold text-navy">Advice Entries</p>
              <p className="text-[0.6875rem] text-ink-3">What I wish I knew</p>
            </div>
          </div>
        )}
      </section>

      {/* 5. DUAL PILLARS: White Mistakes Pillar + Light Blue Simulator Pillar */}
      <section className="grid gap-8 lg:grid-cols-2">
        {/* Mistakes Pillar: White Box */}
        <div className="flex flex-col justify-between rounded-3xl border border-rule bg-white p-7 sm:p-9 shadow-subtle">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-wrong">
                <ShieldAlert size={15} />
                <span>Mistakes & Postmortems</span>
              </span>
              <Badge tone="wrong">Wrong Assumption vs Reality</Badge>
            </div>

            <h3 className="font-sans text-2xl font-extrabold text-navy">
              Learn from real production failures
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-2">
              Every mistake is documented with the wrong assumption, what actually happened, and what should have been done instead.
            </p>

            {featuredMistake && (
              <div className="mt-6 rounded-2xl border border-rule bg-paper/60 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="font-sans text-sm font-bold text-navy">{featuredMistake.title}</p>
                  <span className="font-mono text-[0.6875rem] text-ink-3">{featuredMistake.year}</span>
                </div>
                <div className="text-xs text-ink-2">
                  <span className="font-bold text-wrong uppercase">Wrong assumption: </span>
                  <span>{featuredMistake.wrong_assumption}</span>
                </div>
                <div className="rounded-xl border border-blue-200 bg-blue-50 p-3.5 text-xs text-navy">
                  <span className="font-bold text-blue-700 uppercase block mb-0.5">Lesson:</span>
                  <span className="font-serif text-sm italic">&ldquo;{featuredMistake.lesson}&rdquo;</span>
                </div>
              </div>
            )}
          </div>

          <div className="mt-8 flex items-center justify-between border-t border-rule pt-4">
            <span className="text-xs text-ink-3">18 catalogued engineering postmortems</span>
            <Button to="/mistakes" variant="secondary" size="sm" icon={ArrowRight}>
              Open Mistakes Library
            </Button>
          </div>
        </div>

        {/* Simulator Pillar: Soft / Medium Blue Box with Blue Border */}
        <div className="flex flex-col justify-between rounded-3xl border-2 border-blue-300 bg-gradient-to-br from-blue-100/90 via-blue-50 to-blue-100/60 p-7 sm:p-9 shadow-subtle">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-700">
                <Waypoints size={15} />
                <span>Incident Decision Simulator</span>
              </span>
              <Badge tone="royal">Interactive Simulation</Badge>
            </div>

            <h3 className="font-sans text-2xl font-extrabold text-navy">
              Practice high-stakes decisions under pressure
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-2">
              Step through real incidents one decision at a time. Compare your diagnostic instincts against what veteran engineers did during the outage.
            </p>

            {featuredScenario && (
              <div className="mt-6 rounded-2xl border border-blue-200 bg-white p-5 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <p className="font-sans text-sm font-bold text-navy">{featuredScenario.title}</p>
                  <span className="rounded bg-blue-100 px-2 py-0.5 text-[0.6875rem] font-bold text-blue-700">
                    {featuredScenario.difficulty}
                  </span>
                </div>
                <p className="text-xs text-ink-2 line-clamp-2 leading-relaxed">
                  {featuredScenario.description}
                </p>
                <div className="flex items-center gap-3 text-xs text-ink-3 font-medium">
                  <span>{featuredScenario.steps?.length || 3} decision points</span>
                  <span>·</span>
                  <span>~{featuredScenario.estimated_minutes || 5} min incident</span>
                </div>
              </div>
            )}
          </div>

          <div className="mt-8 flex items-center justify-between border-t border-blue-200 pt-4">
            <span className="text-xs font-semibold text-navy">Generates verified Transfer Score</span>
            <Button to="/simulator" size="sm" icon={ArrowRight}>
              Launch Incident Simulator
            </Button>
          </div>
        </div>
      </section>

      {/* 6. WHAT I WISH I KNEW & PRIVATE ORGANIZATION GATEWAY */}
      <section className="grid gap-8 lg:grid-cols-2">
        {/* Advice Highlight: Crisp White Card with Light Blue Quote */}
        <div className="flex flex-col justify-between rounded-3xl border border-rule bg-white p-7 sm:p-9 shadow-subtle">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-700 mb-3">
              <Lightbulb size={15} />
              <span>What I Wish I Knew</span>
            </div>
            <h3 className="font-sans text-2xl font-extrabold text-navy">
              Unvarnished engineering wisdom
            </h3>
            {featuredAdvice && (
              <blockquote className="mt-4 rounded-2xl border-l-4 border-blue-600 bg-blue-50/70 p-5 font-serif text-base sm:text-lg italic text-navy leading-relaxed shadow-xs border-y border-r border-blue-100">
                &ldquo;{featuredAdvice.advice}&rdquo;
                <footer className="mt-3 font-sans not-italic text-xs font-bold text-ink-2">
                  — {featuredAdvice.engineer}, {featuredAdvice.role} ({featuredAdvice.years_experience} yrs experience)
                </footer>
              </blockquote>
            )}
          </div>

          <div className="mt-8 flex items-center justify-between border-t border-blue-200 pt-4">
            <span className="text-xs text-ink-3">28 practical lessons across 7 categories</span>
            <Button to="/advice" variant="secondary" size="sm" icon={ArrowRight}>
              Read All Advice
            </Button>
          </div>
        </div>

        {/* Private Organization Vault Gateway: Deep Dark Navy (#102A56) Box */}
        <div className="flex flex-col justify-between rounded-3xl border border-navy-deep bg-navy text-white p-8 sm:p-10 shadow-elevated">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-300 mb-3">
              <Building2 size={16} />
              <span>Enterprise Knowledge Vault</span>
            </div>
            <h3 className="font-sans text-2xl sm:text-3xl font-extrabold text-white">
              Private organization repositories
            </h3>
            <p className="mt-2 text-sm text-blue-100/90 leading-relaxed">
              Protect proprietary institutional knowledge, onboarding pathways, troubleshooting runbooks, and staff retirement knowledge transfer.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-2.5 text-xs font-medium text-white">
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-2.5">
                <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                <span>Confidential Runbooks</span>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-2.5">
                <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                <span>Onboarding Curriculum</span>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-2.5">
                <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                <span>Retirement Risk Register</span>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-2.5">
                <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                <span>KRI Telemetry Dashboard</span>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-5">
            <span className="text-xs font-mono text-blue-200">Demo Org: Northstar Engineering</span>
            <Link
              to="/organization"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-navy hover:bg-blue-50 transition-colors shadow-sm"
            >
              <ShieldCheck size={16} className="text-blue-600" />
              <span>Access Organization Vault</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
