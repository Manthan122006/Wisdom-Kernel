/**
 * Simulator.jsx
 * -------------
 * Interactive incident simulator.
 *
 * One decision at a time. Choosing an option locks that step permanently,
 * shows the feedback the backend wrote for that specific choice, and
 * explains why the decision matters before the next step opens.
 *
 * At the end the run is scored by POST /score — the frontend does not
 * invent the score — and the run is stored so the Transfer Score page can
 * compare it against a real earlier attempt.
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
/* Scenario picker                                                     */
/* ------------------------------------------------------------------ */

function ScenarioPicker({ scenarios, onStart }) {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {scenarios.map((scenario) => (
        <Card key={scenario.id} as="article" className="flex flex-col p-6">
          <div className="flex flex-wrap items-center gap-2">
            {scenario.difficulty && <Badge tone="royal">{scenario.difficulty}</Badge>}
            {scenario.domain && <Badge>{scenario.domain}</Badge>}
            {scenario.is_demo && <DemoBadge />}
          </div>

          <h2 className="mt-3 font-serif text-xl leading-snug text-ink">{scenario.title}</h2>
          <p className="mt-3 flex-1 text-[0.9375rem] leading-relaxed text-ink-2">
            {scenario.description}
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-4 border-t border-rule pt-5">
            <Button onClick={() => onStart(scenario)} icon={ArrowRight}>
              Start this incident
            </Button>
            <p className="text-sm text-ink-3">
              {scenario.steps.length} decisions
              {scenario.estimated_minutes ? ` · about ${scenario.estimated_minutes} min` : ""}
            </p>
          </div>
        </Card>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* A single decision step                                              */
/* ------------------------------------------------------------------ */

function OptionButton({ option, locked, chosen, onChoose }) {
  const isChosen = chosen === option.id;
  const revealCorrect = locked && option.correct;
  const revealWrong = locked && isChosen && !option.correct;

  let tone = "border-rule-strong bg-white hover:border-royal hover:bg-royal-tint";
  if (revealCorrect) tone = "border-correct bg-correct-tint";
  else if (revealWrong) tone = "border-wrong bg-wrong-tint";
  else if (locked) tone = "border-rule bg-white opacity-60";

  return (
    <li>
      <button
        type="button"
        disabled={locked}
        onClick={() => onChoose(option.id)}
        aria-pressed={isChosen}
        className={`flex w-full gap-3.5 rounded-lg border p-4 text-left transition-colors duration-150 disabled:cursor-default ${tone}`}
      >
        <span
          className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded font-mono text-xs font-medium ${
            revealCorrect
              ? "bg-correct text-white"
              : revealWrong
                ? "bg-wrong text-white"
                : "bg-paper text-ink-2"
          }`}
          aria-hidden="true"
        >
          {revealCorrect ? <Check size={13} /> : revealWrong ? <XIcon size={13} /> : option.id}
        </span>

        <span className="min-w-0 flex-1">
          <span className="block text-[0.9375rem] leading-relaxed text-ink">{option.text}</span>

          {/* Feedback appears for the chosen option and for the correct one,
              so a wrong answer always shows what the right move was. */}
          {locked && (isChosen || option.correct) && (
            <span className="mt-2.5 block border-t border-black/5 pt-2.5 text-sm leading-relaxed text-ink-2">
              {option.feedback}
            </span>
          )}
        </span>
      </button>
    </li>
  );
}

function StepView({ scenario, stepIndex, answer, onChoose, onContinue, isLast, submitting }) {
  const step = scenario.steps[stepIndex];
  const locked = Boolean(answer);
  const chosenOption = locked ? step.options.find((o) => o.id === answer.optionId) : null;

  return (
    <>
      {/* Situation */}
      <Card className="mb-6 p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="royal">{scenario.difficulty || "Incident"}</Badge>
          {scenario.domain && <Badge>{scenario.domain}</Badge>}
        </div>
        <h2 className="mt-3 font-serif text-xl text-ink">{scenario.title}</h2>
        <p className="mt-2.5 max-w-prose text-[0.9375rem] leading-relaxed text-ink-2">
          {scenario.description}
        </p>
      </Card>

      {/* Progress */}
      <div className="mb-6">
        <ProgressBar
          value={stepIndex + (locked ? 1 : 0)}
          max={scenario.steps.length}
          label={`Decision ${stepIndex + 1} of ${scenario.steps.length}`}
          size="sm"
        />
      </div>

      {/* Question */}
      <h3 className="mb-4 font-serif text-lg leading-snug text-ink">{step.question}</h3>

      <ul className="space-y-3">
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

      {/* Verdict + continue */}
      {locked && (
        <div className="mt-6 animate-fade-in border-t border-rule pt-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p
              className={`flex items-center gap-2 text-[0.9375rem] font-medium ${
                chosenOption?.correct ? "text-correct" : "text-wrong"
              }`}
            >
              {chosenOption?.correct ? <Check size={17} /> : <XIcon size={17} />}
              {chosenOption?.correct
                ? "That matches what the senior engineer did."
                : "That is not what the senior engineer did."}
            </p>

            <Button onClick={onContinue} icon={ArrowRight} loading={submitting}>
              {isLast ? "See results" : "Continue"}
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Results                                                             */
/* ------------------------------------------------------------------ */

function Results({ scenario, answers, score, scoreError, onRetry, onExit }) {
  const correct = answers.filter((a) => a.correct).length;
  const total = scenario.steps.length;

  return (
    <div className="animate-fade-in">
      <Card className="p-6 sm:p-8">
        <h2 className="font-serif text-xl text-ink">Results</h2>
        <p className="mt-1.5 text-sm text-ink-2">{scenario.title}</p>

        {scoreError ? (
          <div className="mt-6">
            <ErrorState
              error={scoreError}
              title="Could not score this run"
              onRetry={onRetry}
            />
            <p className="mt-3 text-sm text-ink-2">
              You answered {correct} of {total} decisions the way the senior engineer did.
            </p>
          </div>
        ) : !score ? (
          <div className="mt-6">
            <InlineLoader message="Scoring your run…" />
          </div>
        ) : (
          <>
            <div className="mt-6 grid grid-cols-2 gap-6 border-y border-rule py-6 sm:grid-cols-4">
              <Stat value={score.score} label="Transfer score" size="lg" tone="royal" />
              <Stat value={`${correct}/${total}`} label="Correct decisions" size="lg" />
              <Stat
                value={`${score.metrics.accuracy_percent}%`}
                label="Accuracy"
                size="lg"
              />
              <div>
                <p className="font-serif text-2xl text-ink">{score.band}</p>
                <p className="mt-1 text-sm text-ink-2">Band</p>
              </div>
            </div>

            <p className="mt-5 max-w-prose text-[0.9375rem] leading-relaxed text-ink-2">
              {score.band_description}
            </p>

            <p className="mt-3 font-mono text-xs text-ink-3">{score.formula}</p>
          </>
        )}
      </Card>

      {/* Senior reasoning */}
      <section className="mt-6" aria-labelledby="senior-reasoning-heading">
        <Card className="border-l-2 border-l-royal p-6 sm:p-8">
          <h2 id="senior-reasoning-heading" className="font-serif text-lg text-ink">
            Senior engineer's reasoning
          </h2>
          <p className="mt-3 max-w-prose text-[0.9375rem] leading-[1.75] text-ink-2">
            {scenario.senior_reasoning}
          </p>
        </Card>
      </section>

      {/* Key lesson */}
      <section className="mt-6" aria-labelledby="key-lesson-heading">
        <div className="rounded-lg border-2 border-royal bg-royal-tint p-6 sm:p-8">
          <h2 id="key-lesson-heading" className="text-label font-medium uppercase tracking-wide text-royal-dark">
            Key lesson
          </h2>
          <p className="mt-2 max-w-prose font-serif text-lg leading-relaxed text-ink">
            {scenario.lesson}
          </p>
        </div>
      </section>

      {score?.disclaimer && (
        <p className="mt-5 max-w-prose text-xs leading-relaxed text-ink-3">{score.disclaimer}</p>
      )}

      <div className="mt-7 flex flex-wrap gap-3">
        <Button to="/score" icon={Gauge}>
          View transfer score
        </Button>
        <Button variant="secondary" icon={RotateCcw} onClick={onExit}>
          Try another incident
        </Button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function Simulator() {
  const { data, loading, error, reload } = useApi(() => api.simulator(), []);

  const [scenario, setScenario] = useState(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [finished, setFinished] = useState(false);
  const [startedAt, setStartedAt] = useState(null);

  const [score, setScore] = useState(null);
  const [scoreError, setScoreError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const scenarios = data?.scenarios || [];
  const currentAnswer = answers[stepIndex];

  function startScenario(chosen) {
    setScenario(chosen);
    setStepIndex(0);
    setAnswers([]);
    setFinished(false);
    setScore(null);
    setScoreError(null);
    setStartedAt(Date.now());
  }

  function exitScenario() {
    setScenario(null);
    setAnswers([]);
    setStepIndex(0);
    setFinished(false);
    setScore(null);
    setScoreError(null);
  }

  /** A choice is permanent: if this step already has an answer, ignore it. */
  function chooseOption(optionId) {
    if (answers[stepIndex]) return;

    const step = scenario.steps[stepIndex];
    const option = step.options.find((o) => o.id === optionId);

    setAnswers((previous) => {
      const next = [...previous];
      next[stepIndex] = {
        stepId: step.id,
        optionId,
        correct: Boolean(option?.correct),
      };
      return next;
    });
  }

  const submitScore = useCallback(
    async (finalAnswers, activeScenario, elapsedSeconds) => {
      setSubmitting(true);
      setScoreError(null);

      const correct = finalAnswers.filter((a) => a.correct).length;
      const total = activeScenario.steps.length;

      // A real earlier run, if one exists, is the only baseline we send.
      const previousRun = runStore.latest();

      try {
        const payload = {
          scenario_id: activeScenario.id,
          correct_answers: correct,
          total_questions: total,
          time_taken_seconds: elapsedSeconds,
        };
        if (previousRun?.score != null) {
          payload.previous_score = previousRun.score;
        }

        const result = await api.score(payload);
        setScore(result);

        runStore.save({
          scenarioId: activeScenario.id,
          scenarioTitle: activeScenario.title,
          score: result.score,
          band: result.band,
          correct,
          total,
          accuracy: result.metrics.accuracy_percent,
          timeTakenSeconds: elapsedSeconds,
          avgSecondsPerQuestion: result.metrics.avg_seconds_per_question ?? null,
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
      setStepIndex((index) => index + 1);
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

  const breadcrumbs = useMemo(
    () =>
      scenario
        ? [{ label: "Home", to: "/" }, { label: "Simulator", to: "/simulator" }, { label: scenario.title }]
        : [{ label: "Home", to: "/" }, { label: "Simulator" }],
    [scenario]
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Incident simulator"
        description={
          scenario
            ? "Work the incident one decision at a time. Each choice is final, and the feedback explains why it matters."
            : "Work through a real incident the way the engineer who lived it did. Every option carries the feedback they wrote for it."
        }
        breadcrumbs={breadcrumbs}
        actions={
          scenario && !finished ? (
            <Button variant="ghost" size="sm" icon={ChevronLeft} onClick={exitScenario}>
              Leave incident
            </Button>
          ) : null
        }
      />

      {loading && <LoadingState message="Loading incident scenarios…" rows={2} />}

      {!loading && error && <ErrorState error={error} onRetry={reload} />}

      {!loading && !error && scenarios.length === 0 && (
        <EmptyState
          icon={Waypoints}
          title="No scenarios available"
          message="The backend returned no incident scenarios to run."
          action={
            <Button variant="secondary" onClick={reload}>
              Reload scenarios
            </Button>
          }
        />
      )}

      {!loading && !error && scenarios.length > 0 && !scenario && (
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
