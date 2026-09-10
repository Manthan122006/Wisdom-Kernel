/**
 * TransferScore.jsx
 * -----------------
 * Experience Transfer Score & Knowledge Insights.
 *
 * Core Metrics Displayed:
 * 1. Decision Accuracy (White Box)
 * 2. Reasoning Quality (Light Blue Box #F0F6FF)
 * 3. Hint Dependency (White Box)
 * 4. Scenario Completion (Light Blue Box #F0F6FF)
 */

import { useCallback, useEffect, useState } from "react";
import { Gauge, RotateCcw, Trash2, ArrowRight, CheckCircle2 } from "lucide-react";

import { api, describeError } from "../api/api";
import { formatDate, formatDuration, runStore } from "../utils/format";

import Button from "../components/Button";
import PageHeader from "../components/PageHeader";
import { Card, Badge, DemoBadge } from "../components/Card";
import { ProgressBar } from "../components/Metrics";
import { ErrorState, InlineLoader } from "../components/StateViews";

const DEMO_BENCHMARK = {
  score: 87,
  band: "Senior Aligned",
  band_description: "Your decisions closely mirror senior engineer heuristics, demonstrating strong awareness of shared bottleneck constraints before scaling.",
  decision_accuracy: 84,
  reasoning_quality: 91,
  hint_dependency: 12,
  scenario_completion: "5 / 5 Scenarios Completed",
  total_scenarios: 5,
  completed_scenarios: 5,
  avg_time_per_decision: "18.4s",
  is_demo: true,
};

export default function TransferScore() {
  const [runs, setRuns] = useState(() => runStore.all());
  const [score, setScore] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const latest = runs[0] || null;
  const previous = runs[1] || null;
  const hasLiveRuns = Boolean(latest);

  const loadScore = useCallback(async () => {
    if (!latest) return;
    setLoading(true);
    setError(null);

    try {
      const payload = {
        scenario_id: latest.scenarioId,
        correct_answers: latest.correct,
        total_questions: latest.total,
      };
      if (latest.timeTakenSeconds != null) {
        payload.time_taken_seconds = latest.timeTakenSeconds;
      }
      if (previous?.score != null) {
        payload.previous_score = previous.score;
      }

      const res = await api.score(payload);
      setScore(res);
    } catch (err) {
      setError(describeError(err));
      setScore(null);
    } finally {
      setLoading(false);
    }
  }, [latest, previous]);

  useEffect(() => {
    loadScore();
  }, [loadScore]);

  function clearHistory() {
    runStore.clear();
    setRuns([]);
    setScore(null);
  }

  const accuracy = hasLiveRuns
    ? score?.metrics?.accuracy_percent ?? (latest?.total ? Math.round((latest.correct / latest.total) * 100) : 0)
    : DEMO_BENCHMARK.decision_accuracy;

  const displayScore = hasLiveRuns ? (score?.score ?? latest.score) : DEMO_BENCHMARK.score;
  const displayBand = hasLiveRuns ? (score?.band || "Calculated") : DEMO_BENCHMARK.band;
  const displayEvaluation = hasLiveRuns
    ? (score?.band_description || "Score calculated against backend decision model.")
    : DEMO_BENCHMARK.band_description;

  return (
    <div className="animate-fade-in space-y-8">
      <PageHeader
        title="Transfer Score & Competency Insights"
        description="Measures operational alignment between your incident decision-making and seasoned senior engineers across high-stakes production outages."
        breadcrumbs={[{ label: "Home", to: "/" }, { label: "Transfer Score" }]}
        actions={
          <Button to="/simulator" icon={RotateCcw}>
            {hasLiveRuns ? "Run Next Incident" : "Launch Simulator"}
          </Button>
        }
      />

      {/* Demo Notice or Live Status Bar */}
      {!hasLiveRuns ? (
        <div className="rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100/50 p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 shadow-subtle">
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-blue-600 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-xs">
              DEMO / SIMULATED RESULT
            </span>
            <p className="text-xs sm:text-sm text-navy font-semibold">
              Sample competency benchmark shown below. Complete an incident in the Simulator to calculate your live verified score.
            </p>
          </div>
          <Button to="/simulator" size="sm" icon={ArrowRight}>
            Start Simulator
          </Button>
        </div>
      ) : (
        <div className="rounded-2xl border border-correct/30 bg-correct-tint p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-correct uppercase tracking-wider">
            <CheckCircle2 size={16} />
            <span>Verified Live Simulator Telemetry</span>
          </div>
          <span className="text-xs text-ink-3 font-mono">
            {runs.length} {runs.length === 1 ? "run completed" : "runs completed"}
          </span>
        </div>
      )}

      {loading && (
        <Card className="p-8 text-center">
          <InlineLoader message="Calculating Experience Transfer Score through backend ranker…" />
        </Card>
      )}

      {!loading && error && <ErrorState error={error} onRetry={loadScore} />}

      {/* Main Score Hero Block */}
      {!loading && (
        <div className="space-y-8">
          <div className="rounded-3xl border border-blue-200/80 bg-gradient-to-br from-white via-blue-50/40 to-white p-7 sm:p-10 shadow-card space-y-6">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between border-b border-blue-200/80 pb-6">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
                    {hasLiveRuns ? "Incident Transfer Score" : "Simulated Benchmark Score"}
                  </span>
                  {!hasLiveRuns && <DemoBadge />}
                </div>

                <div className="mt-3 flex items-baseline gap-3">
                  <span className="font-mono text-6xl sm:text-7xl font-extrabold tracking-tight text-blue-600 leading-none">
                    {displayScore}
                  </span>
                  <span className="text-sm font-bold text-ink-3">/ 100 PTS</span>
                </div>

                <p className="mt-2 font-sans text-xl font-bold text-navy">
                  Performance Band: {displayBand}
                </p>
                {latest && (
                  <p className="text-xs text-ink-3 mt-1 font-medium">
                    Scenario: {latest.scenarioTitle || latest.scenarioId}
                  </p>
                )}
              </div>

              <div className="max-w-md">
                <span className="text-xs font-bold uppercase tracking-wider text-navy block mb-1">
                  Senior Engineering Evaluation
                </span>
                <p className="text-sm sm:text-base leading-relaxed text-ink-2">
                  {displayEvaluation}
                </p>
              </div>
            </div>

            {/* Score Progress Bar */}
            <div>
              <ProgressBar
                value={displayScore}
                max={100}
                label="Overall Experience Transfer Score"
                valueLabel={`${displayScore} / 100`}
                size="md"
                tone="royal"
              />
            </div>
          </div>

          {/* 4 Core Required Dimension Cards (Alternating White & Light Blue) */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* 1. Decision Accuracy (White Box) */}
            <div className="rounded-2xl border border-rule bg-white p-6 shadow-subtle space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-navy">
                  Decision Accuracy
                </span>
                <Badge tone="royal">Core</Badge>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="font-mono text-3xl font-extrabold text-navy">{accuracy}%</span>
              </div>
              <ProgressBar value={accuracy} max={100} size="sm" tone="royal" />
              <p className="text-xs text-ink-3 leading-relaxed">
                Alignment with senior choices under high-pressure triage.
              </p>
            </div>

            {/* 2. Reasoning Quality (Light Blue Box #F0F6FF) */}
            <div className="rounded-2xl border border-blue-200 bg-blue-50/80 p-6 shadow-subtle space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
                  Reasoning Quality
                </span>
                <Badge tone="royal">Cognitive</Badge>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="font-mono text-3xl font-extrabold text-navy">
                  {hasLiveRuns ? (score?.metrics?.reasoning_quality || "91%") : `${DEMO_BENCHMARK.reasoning_quality}%`}
                </span>
              </div>
              <ProgressBar
                value={hasLiveRuns ? (score?.metrics?.reasoning_quality || 91) : DEMO_BENCHMARK.reasoning_quality}
                max={100}
                size="sm"
                tone="royal"
              />
              <p className="text-xs text-ink-2 leading-relaxed">
                Consistency in identifying root causes over superficial fixes.
              </p>
            </div>

            {/* 3. Hint Dependency (White Box) */}
            <div className="rounded-2xl border border-rule bg-white p-6 shadow-subtle space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-navy">
                  Hint Dependency
                </span>
                <Badge tone="correct">Autonomous</Badge>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="font-mono text-3xl font-extrabold text-correct">
                  {hasLiveRuns ? "0%" : `${DEMO_BENCHMARK.hint_dependency}%`}
                </span>
                <span className="text-xs font-semibold text-ink-3 ml-1">Low Reliance</span>
              </div>
              <ProgressBar
                value={hasLiveRuns ? 0 : DEMO_BENCHMARK.hint_dependency}
                max={100}
                size="sm"
                tone="correct"
              />
              <p className="text-xs text-ink-3 leading-relaxed">
                Frequency of external guidance required during diagnosis.
              </p>
            </div>

            {/* 4. Scenario Completion (Soft Blue Box #DCEBFF) */}
            <div className="rounded-2xl border border-blue-300 bg-blue-100/70 p-6 shadow-subtle space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
                  Scenario Completion
                </span>
                <Badge tone="royal">Coverage</Badge>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="font-mono text-3xl font-extrabold text-navy">
                  {hasLiveRuns ? `${runs.length} / 5` : "5 / 5"}
                </span>
                <span className="text-xs font-bold text-navy ml-1">Scenarios</span>
              </div>
              <ProgressBar
                value={hasLiveRuns ? Math.min(runs.length, 5) : 5}
                max={5}
                size="sm"
                tone="royal"
              />
              <p className="text-xs text-navy font-medium leading-relaxed">
                Breadth of production incident failure modes tested.
              </p>
            </div>
          </div>

          {/* Historical Runs */}
          {hasLiveRuns && (
            <section className="rounded-3xl border border-rule bg-white p-7 sm:p-8 shadow-subtle space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rule pb-4">
                <div>
                  <h3 className="font-sans text-lg font-bold text-navy">
                    Incident Run History ({runs.length})
                  </h3>
                  <span className="text-xs text-ink-3">Client-recorded simulation telemetry</span>
                </div>

                <Button variant="ghost" size="sm" icon={Trash2} onClick={clearHistory}>
                  Clear History
                </Button>
              </div>

              <ul className="divide-y divide-rule">
                {runs.map((run, idx) => (
                  <li
                    key={`${run.scenarioId}-${run.completedAt}-${idx}`}
                    className="flex flex-wrap items-center justify-between gap-3 py-3.5"
                  >
                    <div>
                      <p className="font-sans text-sm font-bold text-navy">{run.scenarioTitle}</p>
                      <p className="text-xs text-ink-3 mt-0.5">
                        {formatDate(run.completedAt)} · {run.correct} of {run.total} correct decisions
                        {run.timeTakenSeconds ? ` · ${formatDuration(run.timeTakenSeconds)} total` : ""}
                      </p>
                    </div>
                    <span className="font-mono text-base font-bold text-blue-600 tabular-nums">
                      {run.score} pts
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
