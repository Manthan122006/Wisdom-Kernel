/**
 * Simulator.jsx
 * -------------
 * Incident Decision Simulator.
 *
 * Section 13 Color Strategy:
 * - White main background
 * - Blue for: progress, scenario selection, decision states, correct/important feedback
 * - Light Blue (#F0F6FF) for scenario information and available evidence
 * - Dark Navy (#102A56) for important senior reasoning
 */

import { useCallback, useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  ChevronLeft,
  Gauge,
  RotateCcw,
  Waypoints,
  X as XIcon,
  AlertTriangle,
  Lightbulb,
  Clock,
  Layers,
  Sparkles,
  Activity,
  FileSearch,
  CheckCircle2,
} from "lucide-react";

import { api, describeError } from "../api/api";
import useApi from "../hooks/useApi";
import { runStore } from "../utils/format";

import Button from "../components/Button";
import PageHeader from "../components/PageHeader";
import { Badge, Card, DemoBadge } from "../components/Card";
import { ProgressBar, Stat } from "../components/Metrics";
import { EmptyState, ErrorState, InlineLoader, LoadingState } from "../components/StateViews";

/* ------------------------------------------------------------------ */
/* Fallback scenarios if API is cold-starting or offline               */
/* ------------------------------------------------------------------ */
const DEFAULT_SCENARIOS = [
  {
    id: "incident-001",
    title: "Production API Latency Spike",
    description: "At 19:40 on a peak sale day, the checkout API begins returning 5xx errors for ~12% of requests. Latency p99 escalates from 180ms to 9s. CPU and memory on service pods appear normal. You are on-call.",
    difficulty: "Intermediate",
    domain: "Distributed Systems",
    estimated_minutes: 6,
    is_demo: true,
    steps: [
      {
        id: "step-1",
        stage: "01 OBSERVE",
        evidence: "Telemetry: CPU is 22%, Memory is 35%, but p99 response time is 9,200ms. Error rate climbing.",
        question: "What would you check first?",
        options: [
          {
            id: "A",
            text: "Immediately double the number of service replicas to absorb the traffic spike.",
            correct: false,
            feedback: "Scaling first is a common reflex, but CPU and memory are healthy. If the service is blocked on a shared downstream resource, more replicas multiply contention and make latency worse."
          },
          {
            id: "B",
            text: "Look at where request time is actually being spent: downstream dependency latency, connection pool saturation, and database wait events.",
            correct: true,
            feedback: "Correct. Healthy CPU with terrible latency means the service is waiting, not computing. Locating the wait point tells you which remedy actually applies."
          },
          {
            id: "C",
            text: "Roll back the most recent deployment straight away.",
            correct: false,
            feedback: "Rollback is valid when a deploy correlates in time, but no deploy has occurred in the past 6 hours. Rolling back blindly risks destroying diagnostic state."
          },
          {
            id: "D",
            text: "Restart the application pods to clear potential memory leak or deadlock state.",
            correct: false,
            feedback: "A restart drops active in-flight requests during an already degraded period and wipes out diagnostic thread dumps."
          }
        ]
      },
      {
        id: "step-2",
        stage: "02 INVESTIGATE & DECIDE",
        evidence: "Diagnostic Finding: Per-pod database connection pools are 100% saturated. The central database is rejecting new connections with 'Too many connections'.",
        question: "What is the safest immediate mitigation?",
        options: [
          {
            id: "A",
            text: "Raise per-pod connection pool size from 20 to 50 so each pod can open more sockets.",
            correct: false,
            feedback: "This points pressure straight at the constraint. The database is already refusing connections; increasing per-pod pools accelerates connection starvation."
          },
          {
            id: "B",
            text: "Cap per-pod pool sizes and route traffic through an external connection proxy to multiplex connections.",
            correct: true,
            feedback: "Correct. Total connections are a shared global budget. Bounding them and multiplexing through a proxy lets existing connections do useful work."
          },
          {
            id: "C",
            text: "Scale out application worker replicas now that the database is verified as the bottleneck.",
            correct: false,
            feedback: "Each new replica brings its own pool, multiplying connection attempts against a limit you have already exceeded."
          },
          {
            id: "D",
            text: "Trigger immediate failover to the replica database node.",
            correct: false,
            feedback: "The database is not faulty; it is saturated by connection count. Failover would direct identical load to a cold node with empty buffer pools."
          }
        ]
      },
      {
        id: "step-3",
        stage: "03 POSTMORTEM PREVENT",
        evidence: "Incident Resolved: Latency has normalized to 140ms and errors dropped to 0%.",
        question: "What is the most valuable follow-up to prevent repeats?",
        options: [
          {
            id: "A",
            text: "Close the ticket since metrics have completely recovered.",
            correct: false,
            feedback: "Without architectural boundaries and alerts, the next traffic surge will trigger the exact same cascading failure."
          },
          {
            id: "B",
            text: "Document the global connection budget, alert on connection pool saturation >80%, and load test at peak traffic multiples.",
            correct: true,
            feedback: "Correct. The failure stemmed from an invisible shared limit. Making it explicit, alerting early, and load testing turns a hidden vulnerability into a verified constraint."
          },
          {
            id: "C",
            text: "Add aggressive automatic retries on checkout calls so users don't see errors.",
            correct: false,
            feedback: "Retrying into a saturated dependency creates a retry storm, amplifying load and worsening outages."
          },
          {
            id: "D",
            text: "Permanently keep four times the replica count running.",
            correct: false,
            feedback: "This multiplies cost and connection count, actively worsening risk under shared limits."
          }
        ]
      }
    ],
    senior_reasoning: "An experienced responder separates saturation from failure. Normal CPU with very high latency is a waiting problem. Once the wait is identified as a shared, bounded resource (database sockets), the rule is to bound demand rather than add more consumers.",
    lesson: "Find the bottleneck before adding capacity. Shared resources such as database connections are a global budget; scaling consumers multiplies demand on that budget instead of relieving it."
  },
  {
    id: "incident-002",
    title: "Database Connection Pool Exhaustion",
    description: "Database latency climbs across all microservices simultaneously. Thread dumps show 95% of web workers parked waiting on database connection acquisition.",
    difficulty: "Advanced",
    domain: "Database Reliability",
    estimated_minutes: 8,
    is_demo: true,
    steps: [
      {
        id: "step-1",
        stage: "01 OBSERVE",
        evidence: "Metrics: DB CPU is 98%, active connections = 1,000 (server limit), slow query log is generating 400 entries/sec.",
        question: "How do you identify which query or service is monopolizing the connections?",
        options: [
          { id: "A", text: "Kill all active connections to reset the database.", correct: false, feedback: "Killing all connections terminates in-flight transactions and can cause replication lag." },
          { id: "B", text: "Query pg_stat_activity / SHOW FULL PROCESSLIST grouped by query fingerprint and state to locate long-running unindexed transactions.", correct: true, feedback: "Correct. Isolating the specific offending query fingerprint lets you targetedly kill or optimize the culprit without blindly disrupting other services." },
          { id: "C", text: "Restart the application services one by one.", correct: false, feedback: "This does not isolate the query causing the locking." },
          { id: "D", text: "Increase the global max_connections parameter to 5,000.", correct: false, feedback: "Increasing max_connections causes database context-switching thrashing and memory exhaustion." }
        ]
      },
      {
        id: "step-2",
        stage: "02 MITIGATE",
        evidence: "Finding: An unindexed reporting query running without a LIMIT has locked table rows for 42 minutes.",
        question: "What action immediately restores production traffic?",
        options: [
          { id: "A", text: "Wait for the query to finish so reporting data remains intact.", correct: false, feedback: "Production traffic is halted; the transaction must be aborted." },
          { id: "B", text: "Terminate the specific backend query PID and enforce statement_timeout globally for reporting users.", correct: true, feedback: "Correct. Terminating the blocked process immediately releases row locks, and setting a statement timeout prevents future queries from stalling connection pools." },
          { id: "C", text: "Deploy an index immediately on the locked table.", correct: false, feedback: "Running CREATE INDEX on a saturated table causes additional locks unless done CONCURRENTLY, which still requires resources." },
          { id: "D", text: "Add read replicas and migrate traffic immediately.", correct: false, feedback: "Replication is likely lagging behind due to the long transaction." }
        ]
      }
    ],
    senior_reasoning: "Connection exhaustion is almost always caused by slow queries holding sockets, not by insufficient connections. The solution is finding why connections are held so long.",
    lesson: "Never run ad-hoc or analytics queries against primary OLTP databases without strict statement timeouts and read-only replica isolation."
  }
];

/* ------------------------------------------------------------------ */
/* 1. Scenario Picker                                                  */
/* ------------------------------------------------------------------ */

function ScenarioPicker({ scenarios, onStart }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-rule pb-3">
        <div>
          <h2 className="font-sans text-lg font-bold text-navy">
            Available Incident Simulations ({scenarios.length})
          </h2>
          <p className="text-xs text-ink-3">Interactive incident response environments derived from senior engineer postmortems</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {scenarios.map((scenario, idx) => {
          const isHighlight = idx === 0;
          return (
            <article
              key={scenario.id}
              className={`flex flex-col justify-between rounded-3xl p-7 transition-all duration-200 hover:-translate-y-1 hover:shadow-card-hover ${
                isHighlight
                  ? "border-2 border-blue-200 bg-blue-50/70 shadow-subtle hover:border-blue-400"
                  : "border border-rule bg-white shadow-subtle hover:border-blue-300"
              }`}
            >
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  {scenario.difficulty && <Badge tone="royal">{scenario.difficulty}</Badge>}
                  {scenario.domain && <Badge tone="neutral">{scenario.domain}</Badge>}
                  {scenario.is_demo && <DemoBadge />}
                </div>

                <h3 className="font-sans text-xl font-bold tracking-tight text-navy leading-snug">
                  {scenario.title}
                </h3>

                <p className="mt-3 text-sm leading-relaxed text-ink-2">
                  {scenario.description}
                </p>
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-rule/70 pt-5">
                <div className="flex items-center gap-4 text-xs font-bold text-ink-3">
                  <span className="flex items-center gap-1.5 text-blue-600">
                    <Layers size={14} /> {scenario.steps?.length || 3} decisions
                  </span>
                  {scenario.estimated_minutes && (
                    <span className="flex items-center gap-1 font-mono">
                      <Clock size={13} /> ~{scenario.estimated_minutes} min
                    </span>
                  )}
                </div>

                <Button onClick={() => onStart(scenario)} icon={ArrowRight}>
                  Start Simulation
                </Button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 2. Step View (Interactive Decision Console)                         */
/* ------------------------------------------------------------------ */

function OptionButton({ option, locked, chosen, onChoose }) {
  const isChosen = chosen === option.id;
  const revealCorrect = locked && option.correct;
  const revealWrong = locked && isChosen && !option.correct;

  let styleClasses = "border-rule bg-white hover:border-blue-300 hover:bg-blue-50/60";
  if (revealCorrect) styleClasses = "border-correct bg-correct-tint/80 shadow-subtle";
  else if (revealWrong) styleClasses = "border-wrong bg-wrong-tint/80 shadow-subtle";
  else if (locked) styleClasses = "border-rule bg-paper opacity-50";

  return (
    <li>
      <button
        type="button"
        disabled={locked}
        onClick={() => onChoose(option.id)}
        aria-pressed={isChosen}
        className={`flex w-full gap-4 rounded-2xl border p-5 text-left transition-all duration-150 disabled:cursor-default ${styleClasses}`}
      >
        <span
          className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl font-mono text-xs font-bold ${
            revealCorrect
              ? "bg-correct text-white shadow-sm"
              : revealWrong
                ? "bg-wrong text-white shadow-sm"
                : "bg-paper border border-rule text-navy font-bold"
          }`}
          aria-hidden="true"
        >
          {revealCorrect ? <Check size={14} /> : revealWrong ? <XIcon size={14} /> : option.id}
        </span>

        <div className="min-w-0 flex-1">
          <span className="block font-sans text-sm sm:text-base font-semibold text-navy leading-relaxed">
            {option.text}
          </span>

          {/* Senior Feedback revealed on decision lock */}
          {locked && (isChosen || option.correct) && (
            <div className="mt-3 rounded-xl border border-black/5 bg-white/90 p-3.5 text-xs sm:text-sm leading-relaxed text-ink-2 shadow-xs">
              <span className="font-bold text-navy block mb-0.5">
                {option.correct ? "Senior Engineer Perspective:" : "Why this was sub-optimal:"}
              </span>
              {option.feedback}
            </div>
          )}
        </div>
      </button>
    </li>
  );
}

function StepView({ scenario, stepIndex, answer, onChoose, onContinue, isLast, submitting }) {
  const step = scenario.steps[stepIndex];
  const locked = Boolean(answer);
  const chosenOption = locked ? step.options.find((o) => o.id === answer.optionId) : null;

  return (
    <div className="space-y-8 animate-fade-in max-w-3xl mx-auto">
      {/* Light Blue Scenario Information Card (#F0F6FF) */}
      <div className="rounded-3xl border-2 border-blue-200 bg-blue-50/80 p-6 sm:p-8 shadow-subtle space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-blue-200 pb-4">
          <div className="flex items-center gap-2">
            <Badge tone="royal">{scenario.difficulty || "Incident"}</Badge>
            {scenario.domain && <Badge tone="neutral">{scenario.domain}</Badge>}
          </div>
          <span className="font-mono text-xs font-bold text-blue-700 uppercase tracking-wider flex items-center gap-1.5">
            <Activity size={14} /> Live Incident
          </span>
        </div>

        <div>
          <h2 className="font-sans text-2xl font-extrabold text-navy tracking-tight">{scenario.title}</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-2">{scenario.description}</p>
        </div>

        {/* Available Evidence Panel */}
        {step.evidence && (
          <div className="rounded-2xl border border-blue-200 bg-white p-4 flex items-start gap-3 shadow-xs">
            <FileSearch size={18} className="text-blue-600 shrink-0 mt-0.5" />
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-700 block">Available Evidence</span>
              <p className="text-xs sm:text-sm text-navy leading-relaxed mt-0.5 font-medium">{step.evidence}</p>
            </div>
          </div>
        )}

        {/* Progress bar */}
        <div className="pt-2">
          <ProgressBar
            value={stepIndex + (locked ? 1 : 0)}
            max={scenario.steps.length}
            label={`Decision Step ${stepIndex + 1} of ${scenario.steps.length}`}
            size="md"
            tone="royal"
          />
        </div>
      </div>

      {/* Decision Prompt & Options (White Box) */}
      <div className="rounded-3xl border border-rule bg-white p-6 sm:p-8 shadow-subtle space-y-6">
        <div>
          <span className="text-label font-bold uppercase tracking-wider text-blue-700">
            {step.stage || `Decision Point ${stepIndex + 1}`}
          </span>
          <h3 className="mt-1 font-sans text-lg sm:text-xl font-bold text-navy leading-snug">
            {step.question}
          </h3>
        </div>

        <ul className="space-y-3.5">
          {step.options.map((option) => (
            <OptionButton
              key={option.id}
              option={option}
              locked={locked}
              chosen={answer?.optionId}
              onChoose={onChoose}
            />
          ))}
        </ul>

        {/* Feedback Verdict & Advance Button */}
        {locked && (
          <div className="mt-6 animate-fade-in border-t border-rule pt-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div
                className={`flex items-center gap-2 text-sm font-bold ${
                  chosenOption?.correct ? "text-correct" : "text-wrong"
                }`}
              >
                {chosenOption?.correct ? (
                  <>
                    <CheckCircle2 size={18} />
                    <span>Aligned with senior engineer action.</span>
                  </>
                ) : (
                  <>
                    <XIcon size={18} />
                    <span>Deviates from the senior engineer approach.</span>
                  </>
                )}
              </div>

              <Button onClick={onContinue} icon={ArrowRight} loading={submitting}>
                {isLast ? "Calculate Transfer Score" : "Next Decision Step"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 3. Results Screen                                                   */
/* ------------------------------------------------------------------ */

function Results({ scenario, answers, score, scoreError, onRetry, onExit }) {
  const correct = answers.filter((a) => a.correct).length;
  const total = scenario.steps.length;

  return (
    <div className="animate-fade-in max-w-3xl mx-auto space-y-8">
      <Card className="p-7 sm:p-9 border border-rule bg-white shadow-card space-y-6">
        <div className="flex items-center justify-between border-b border-rule pb-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
              Simulation Completed
            </span>
            <h2 className="font-sans text-2xl font-extrabold text-navy mt-0.5">
              Incident Results Debrief
            </h2>
            <p className="text-xs text-ink-3 mt-1 font-medium">{scenario.title}</p>
          </div>
          <Badge tone="royal">Transfer Telemetry</Badge>
        </div>

        {scoreError ? (
          <div className="space-y-4">
            <ErrorState error={scoreError} title="Could not score this run" onRetry={onRetry} />
            <p className="text-sm text-ink-2">
              You correctly aligned on {correct} of {total} incident decisions with the senior engineer.
            </p>
          </div>
        ) : !score ? (
          <div className="py-8 text-center">
            <InlineLoader message="Computing Experience Transfer Score through backend ranker…" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Stat row */}
            <div className="grid grid-cols-2 gap-6 rounded-2xl border border-blue-200 bg-blue-50/60 p-6 sm:grid-cols-4">
              <Stat value={score.score} label="Transfer Score" size="lg" tone="royal" />
              <Stat value={`${correct}/${total}`} label="Correct Decisions" size="lg" />
              <Stat
                value={`${score.metrics?.accuracy_percent || Math.round((correct / total) * 100)}%`}
                label="Decision Accuracy"
                size="lg"
              />
              <div>
                <p className="font-sans text-2xl font-bold text-navy">{score.band}</p>
                <p className="mt-1 text-xs font-semibold text-ink-3">Performance Band</p>
              </div>
            </div>

            <p className="text-sm sm:text-base leading-relaxed text-ink-2">
              {score.band_description}
            </p>

            {score.formula && (
              <div className="rounded-xl border border-rule bg-paper px-4 py-2.5 font-mono text-xs text-ink-3">
                Scoring Formula: {score.formula}
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Dark Navy Box for Senior Engineer Reasoning (#102A56) */}
      {scenario.senior_reasoning && (
        <section className="rounded-3xl border border-navy-deep bg-navy text-white p-8 sm:p-9 shadow-elevated space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-300">
            <Sparkles size={16} />
            <span>Senior Engineer Post-Incident Analysis</span>
          </div>
          <h3 className="font-sans text-xl font-bold text-white">
            Why this path was chosen under pressure
          </h3>
          <p className="text-sm sm:text-base leading-relaxed text-blue-100/90 whitespace-pre-wrap">
            {scenario.senior_reasoning}
          </p>
        </section>
      )}

      {/* Medium Blue Transferred Lesson Callout */}
      {scenario.lesson && (
        <section className="rounded-3xl border-2 border-blue-400 bg-gradient-to-br from-blue-600 to-blue-700 text-white p-7 sm:p-8 shadow-md space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-100">
            <Lightbulb size={16} className="text-cyan-200" />
            <span>Transferred Lesson</span>
          </div>
          <blockquote className="font-serif text-lg sm:text-xl leading-relaxed text-white">
            &ldquo;{scenario.lesson}&rdquo;
          </blockquote>
        </section>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
        <Button variant="secondary" icon={RotateCcw} onClick={onExit}>
          Back to Scenarios
        </Button>
        <Button to="/score" icon={Gauge}>
          View Transfer Score Dashboard
        </Button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 4. Main Page Component                                              */
/* ------------------------------------------------------------------ */

export default function Simulator() {
  const { data, loading, error, reload } = useApi(() => api.simulator(), []);
  const rawScenarios = data?.scenarios || [];
  const scenarios = rawScenarios.length > 0 ? rawScenarios : DEFAULT_SCENARIOS;

  const [scenario, setScenario] = useState(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [startedAt, setStartedAt] = useState(null);
  const [finished, setFinished] = useState(false);

  const [score, setScore] = useState(null);
  const [scoreError, setScoreError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  function startScenario(selected) {
    setScenario(selected);
    setStepIndex(0);
    setAnswers([]);
    setStartedAt(Date.now());
    setFinished(false);
    setScore(null);
    setScoreError(null);
  }

  function exitScenario() {
    setScenario(null);
    setStepIndex(0);
    setAnswers([]);
    setFinished(false);
    setScore(null);
    setScoreError(null);
  }

  const currentAnswer = answers[stepIndex] || null;

  function chooseOption(optionId) {
    if (currentAnswer) return;
    const step = scenario.steps[stepIndex];
    const option = step.options.find((o) => o.id === optionId);

    const record = {
      stepIndex,
      optionId,
      correct: Boolean(option?.correct),
    };

    setAnswers((prev) => [...prev, record]);
  }

  const submitScore = useCallback(
    async (finalAnswers, activeScenario, elapsedSeconds) => {
      setSubmitting(true);
      setScoreError(null);

      const correctCount = finalAnswers.filter((a) => a.correct).length;
      const totalCount = activeScenario.steps.length;
      const prevRun = runStore.latest();

      const payload = {
        scenario_id: activeScenario.id,
        correct_answers: correctCount,
        total_questions: totalCount,
      };
      if (elapsedSeconds != null) payload.time_taken_seconds = elapsedSeconds;
      if (prevRun?.score != null) payload.previous_score = prevRun.score;

      try {
        const result = await api.score(payload);
        setScore(result);

        runStore.save({
          scenarioId: activeScenario.id,
          scenarioTitle: activeScenario.title,
          score: result.score,
          correct: correctCount,
          total: totalCount,
          timeTakenSeconds: elapsedSeconds,
          avgSecondsPerQuestion:
            elapsedSeconds != null && totalCount > 0
              ? Math.round((elapsedSeconds / totalCount) * 10) / 10
              : undefined,
        });
      } catch (err) {
        setScoreError(describeError(err));
      } finally {
        setSubmitting(false);
      }
    },
    []
  );

  function handleContinue() {
    const isLast = stepIndex === scenario.steps.length - 1;

    if (!isLast) {
      setStepIndex((idx) => idx + 1);
      return;
    }

    const elapsed = startedAt ? Math.round((Date.now() - startedAt) / 1000) : undefined;
    setFinished(true);
    submitScore(answers, scenario, elapsed);
  }

  const retryScore = useCallback(() => {
    const elapsed = startedAt ? Math.round((Date.now() - startedAt) / 1000) : undefined;
    submitScore(answers, scenario, elapsed);
  }, [answers, scenario, startedAt, submitScore]);

  return (
    <div className="animate-fade-in space-y-8">
      <PageHeader
        title="Incident Decision Simulator"
        description={
          scenario
            ? "Step through this real incident one decision at a time. Each choice reveals what the original senior engineer decided."
            : "Work through real production incidents the way the engineers who lived them did. Verify your operational decision-making under realistic constraints."
        }
        breadcrumbs={
          scenario
            ? [{ label: "Home", to: "/" }, { label: "Simulator", to: "/simulator" }, { label: scenario.title }]
            : [{ label: "Home", to: "/" }, { label: "Simulator" }]
        }
        actions={
          scenario && !finished ? (
            <Button variant="ghost" size="sm" icon={ChevronLeft} onClick={exitScenario}>
              Leave Simulation
            </Button>
          ) : null
        }
      />

      {loading && rawScenarios.length === 0 && (
        <LoadingState message="Loading incident scenarios from archive…" rows={2} />
      )}
      {!loading && error && rawScenarios.length === 0 && (
        <ErrorState error={error} onRetry={reload} />
      )}

      {scenarios.length > 0 && !scenario && (
        <ScenarioPicker scenarios={scenarios} onStart={startScenario} />
      )}

      {scenario && !finished && (
        <StepView
          scenario={scenario}
          stepIndex={stepIndex}
          answer={currentAnswer}
          onChoose={chooseOption}
          onContinue={handleContinue}
          isLast={stepIndex === scenario.steps.length - 1}
          submitting={submitting}
        />
      )}

      {scenario && finished && (
        <Results
          scenario={scenario}
          answers={answers}
          score={score}
          scoreError={scoreError}
          onRetry={retryScore}
          onExit={exitScenario}
        />
      )}
    </div>
  );
}
