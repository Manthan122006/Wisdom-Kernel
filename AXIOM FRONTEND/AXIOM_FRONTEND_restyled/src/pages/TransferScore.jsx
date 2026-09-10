/**
 * TransferScore.jsx
 * -----------------
 * Experience Transfer Score.
 *
 * DATA INTEGRITY NOTE
 * Everything on this page comes from simulator runs the user actually
 * completed, scored by the backend. There is no invented "before" figure:
 * a baseline appears only once a second run exists, and metrics the
 * backend does not measure are shown as not measured rather than filled in.
 */

import { useCallback, useEffect, useState } from "react";
import { Gauge, Info, RotateCcw, Trash2 } from "lucide-react";

import { api, describeError } from "../api/api";
import { formatDate, formatDuration, runStore } from "../utils/format";

import Button from "../components/Button";
import PageHeader from "../components/PageHeader";
import { Card } from "../components/Card";
import { ProgressBar, Stat } from "../components/Metrics";
import { EmptyState, ErrorState, InlineLoader } from "../components/StateViews";

/** A metric the backend does not currently measure. Never guessed at. */
function UnmeasuredMetric({ label, reason }) {
  return (
    <div className="border-t border-rule py-4 first:border-t-0">
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-sm text-ink-2">{label}</span>
        <span className="text-sm text-ink-3">Not measured</span>
      </div>
      <p className="mt-1 text-xs leading-relaxed text-ink-3">{reason}</p>
    </div>
  );
}

export default function TransferScore() {
  const [runs, setRuns] = useState(() => runStore.all());
  const [score, setScore] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const latest = runs[0] || null;
  const previous = runs[1] || null;

  /**
   * Re-scores the latest run through the backend, passing the previous run
   * as a real baseline when one exists. The backend owns the arithmetic.
   */
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

      setScore(await api.score(payload));
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

  // Real improvement figures, only when two runs exist.
  const improvement = score?.improvement;
  const timeDelta =
    latest?.avgSecondsPerQuestion != null && previous?.avgSecondsPerQuestion != null
      ? previous.avgSecondsPerQuestion - latest.avgSecondsPerQuestion
      : null;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Experience Transfer Score"
        description="How closely your decisions matched the senior engineer's, measured across the incidents you have completed."
        breadcrumbs={[{ label: "Home", to: "/" }, { label: "Transfer Score" }]}
        actions={
          runs.length > 0 ? (
            <Button to="/simulator" icon={RotateCcw}>
              Try another simulation
            </Button>
          ) : null
        }
      />

      {!latest && (
        <EmptyState
          icon={Gauge}
          title="No completed incidents yet"
          message="Finish an incident in the simulator and your score appears here. Nothing is shown until you have a real result."
          action={<Button to="/simulator">Open the simulator</Button>}
        />
      )}

      {latest && (
        <>
          {loading && (
            <Card className="p-6">
              <InlineLoader message="Scoring your latest run…" />
            </Card>
          )}

          {!loading && error && <ErrorState error={error} onRetry={loadScore} />}

          {!loading && !error && score && (
            <>
              {/* Headline score */}
              <Card className="p-6 sm:p-8">
                <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-sm text-ink-2">Latest run — {latest.scenarioTitle}</p>
                    <p className="mt-2 font-mono text-6xl tabular-nums leading-none text-royal">
                      {score.score}
                    </p>
                    <p className="mt-3 font-serif text-lg text-ink">{score.band}</p>
                  </div>
                  <p className="max-w-sm text-[0.9375rem] leading-relaxed text-ink-2">
                    {score.band_description}
                  </p>
                </div>

                <div className="mt-7">
                  <ProgressBar value={score.score} max={100} valueLabel={`${score.score} / 100`} />
                </div>
              </Card>

              {/* Before / after / improvement */}
              <section className="mt-6" aria-labelledby="progress-heading">
                <h2 id="progress-heading" className="text-heading text-ink">
                  Progress across runs
                </h2>

                {previous ? (
                  <div className="mt-4 grid grid-cols-2 gap-6 rounded-lg border border-rule bg-surface p-6 sm:grid-cols-3">
                    <Stat
                      value={previous.score}
                      label="Before"
                      hint={formatDate(previous.completedAt)}
                    />
                    <Stat
                      value={score.score}
                      label="After"
                      hint={formatDate(latest.completedAt)}
                      tone="royal"
                    />
                    <Stat
                      value={
                        improvement == null
                          ? "—"
                          : `${improvement > 0 ? "+" : ""}${improvement}`
                      }
                      label="Improvement"
                      hint="Points, measured by the backend"
                      tone={improvement > 0 ? "correct" : improvement < 0 ? "wrong" : "ink"}
                    />
                  </div>
                ) : (
                  <Card className="mt-4 p-6">
                    <div className="flex gap-3">
                      <Info size={18} className="mt-0.5 shrink-0 text-ink-3" aria-hidden="true" />
                      <div>
                        <p className="text-[0.9375rem] font-medium text-ink">
                          No baseline to compare against yet
                        </p>
                        <p className="mt-1.5 max-w-prose text-sm leading-relaxed text-ink-2">
                          {score.improvement_note}
                        </p>
                        <div className="mt-4">
                          <Button variant="secondary" size="sm" to="/simulator">
                            Complete a second incident
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                )}
              </section>

              {/* Measured metrics */}
              <section className="mt-6 grid gap-6 lg:grid-cols-2" aria-labelledby="metrics-heading">
                <Card className="p-6">
                  <h2 id="metrics-heading" className="text-heading text-ink">
                    Measured this run
                  </h2>

                  <div className="mt-5 space-y-5">
                    <ProgressBar
                      label="Decision accuracy"
                      value={score.metrics.accuracy_percent}
                      max={100}
                      valueLabel={`${score.metrics.accuracy_percent}%`}
                      tone="royal"
                    />

                    <div className="grid grid-cols-2 gap-6 border-t border-rule pt-5">
                      <Stat
                        value={`${score.metrics.correct_answers}/${score.metrics.total_questions}`}
                        label="Correct decisions"
                      />
                      {score.metrics.avg_seconds_per_question != null && (
                        <Stat
                          value={`${score.metrics.avg_seconds_per_question}s`}
                          label="Average per decision"
                          hint={
                            timeDelta == null
                              ? undefined
                              : timeDelta > 0
                                ? `${timeDelta.toFixed(1)}s faster than last run`
                                : `${Math.abs(timeDelta).toFixed(1)}s slower than last run`
                          }
                        />
                      )}
                    </div>

                    {latest.timeTakenSeconds != null && (
                      <p className="border-t border-rule pt-4 text-sm text-ink-2">
                        Total time: {formatDuration(latest.timeTakenSeconds)}
                      </p>
                    )}
                  </div>
                </Card>

                {/* Honest gaps */}
                <Card className="p-6">
                  <h2 className="text-heading text-ink">Not yet measured</h2>
                  <p className="mt-2 text-sm leading-relaxed text-ink-2">
                    These would need the backend to track them. They are listed rather than
                    estimated, because a made-up number here would be worse than an empty one.
                  </p>

                  <div className="mt-4">
                    <UnmeasuredMetric
                      label="Faster resolution"
                      reason="Needs timing on real incidents at work, not simulator runs."
                    />
                    <UnmeasuredMetric
                      label="Fewer hints"
                      reason="The simulator has no hint feature, so there is nothing to count."
                    />
                    <UnmeasuredMetric
                      label="Reasoning quality"
                      reason="Needs written reasoning per decision, which the current scenarios do not collect."
                    />
                  </div>
                </Card>
              </section>

              <p className="mt-5 max-w-prose text-xs leading-relaxed text-ink-3">
                {score.disclaimer}
              </p>

              {/* Run history */}
              {runs.length > 1 && (
                <section className="mt-8" aria-labelledby="history-heading">
                  <div className="flex flex-wrap items-baseline justify-between gap-3">
                    <h2 id="history-heading" className="text-heading text-ink">
                      Your completed runs
                    </h2>
                    <Button variant="ghost" size="sm" icon={Trash2} onClick={clearHistory}>
                      Clear history
                    </Button>
                  </div>

                  <ul className="mt-4 divide-y divide-rule border-y border-rule">
                    {runs.map((run, index) => (
                      <li
                        key={`${run.scenarioId}-${run.completedAt}-${index}`}
                        className="flex flex-wrap items-center justify-between gap-3 py-3.5"
                      >
                        <div className="min-w-0">
                          <p className="text-[0.9375rem] text-ink">{run.scenarioTitle}</p>
                          <p className="text-sm text-ink-3">
                            {formatDate(run.completedAt)} · {run.correct} of {run.total} correct
                          </p>
                        </div>
                        <span className="font-mono text-lg tabular-nums text-ink">{run.score}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              <div className="mt-8">
                <Button to="/simulator" icon={RotateCcw}>
                  Try another simulation
                </Button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
