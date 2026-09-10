/**
 * Record.jsx
 * ----------
 * Capture step of the pipeline.
 *
 * States rendered: ready, requesting permission, recording, processing,
 * transcript available, structured record available, and error.
 *
 * The nine extracted fields are rendered exactly as the backend returns
 * them. A null field is shown as "Not covered in this recording" — the
 * page never fills a gap in on the backend's behalf.
 */

import { useState } from "react";
import { AlertCircle, Check, Lightbulb, Mic, RotateCcw, Square, Upload } from "lucide-react";

import { api, describeError } from "../api/api";
import useRecorder from "../hooks/useRecorder";
import { formatDuration } from "../utils/format";

import Button from "../components/Button";
import PageHeader from "../components/PageHeader";
import RecordSheet, { experienceToFields } from "../components/RecordSheet";
import { Badge, Card } from "../components/Card";
import { ErrorState, InlineLoader } from "../components/StateViews";

const MODE_LABELS = {
  ai: { tone: "correct", text: "Transcribed by speech-to-text service" },
  demo_fallback: { tone: "caution", text: "Sample transcript (no speech service configured)" },
};

const EXTRACTION_LABELS = {
  ai: { tone: "correct", text: "Structured by language model" },
  rule_based_fallback: { tone: "caution", text: "Structured by offline rule-based extractor" },
};

export default function Record() {
  const recorder = useRecorder();
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [uploadError, setUploadError] = useState(null);

  const isRecording = recorder.status === "recording";
  const isRequesting = recorder.status === "requesting";
  const hasAudio = recorder.status === "stopped" && recorder.audio;

  async function handleSubmit() {
    if (!recorder.audio) return;
    setProcessing(true);
    setUploadError(null);
    setResult(null);

    try {
      const data = await api.transcribe(recorder.audio.blob, recorder.audio.filename);
      setResult(data);
    } catch (error) {
      setUploadError(describeError(error));
    } finally {
      setProcessing(false);
    }
  }

  function handleReset() {
    recorder.reset();
    setResult(null);
    setUploadError(null);
  }

  const transcriptionLabel = result && MODE_LABELS[result.meta?.transcription_mode];
  const extractionLabel = result && EXTRACTION_LABELS[result.meta?.extraction_mode];

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Record an experience"
        description="Describe one real incident out loud: what happened, what you decided, what went wrong, and what you would tell someone facing it now. Two to five minutes is usually enough."
        breadcrumbs={[{ label: "Home", to: "/" }, { label: "Record Experience" }]}
      />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        {/* Recorder + results */}
        <div className="order-2 min-w-0 lg:order-1">
          {/* Capture panel */}
          <Card className="p-6 sm:p-8">
            {!recorder.isSupported ? (
              <div className="flex gap-3 rounded-md border border-caution/25 bg-caution-tint p-4">
                <AlertCircle size={18} className="mt-0.5 shrink-0 text-caution" aria-hidden="true" />
                <div>
                  <p className="text-[0.9375rem] font-medium text-ink">
                    This browser cannot record audio
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-ink-2">
                    Audio capture needs a recent Chrome, Edge or Firefox, on a page served over
                    http://localhost or https.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-6 py-2 text-center">
                {/* Timer / status */}
                <div className="flex flex-col items-center gap-4">
                  <div
                    className={`flex h-40 w-40 flex-col items-center justify-center gap-1.5 rounded-full ring-1 ring-inset ring-black/5 transition-colors duration-300 ${
                      isRecording ? "bg-wrong-tint" : "bg-royal-tint"
                    }`}
                  >
                    {isRecording && (
                      <span
                        className="h-3 w-3 animate-pulse-record rounded-full bg-wrong"
                        aria-hidden="true"
                      />
                    )}
                    <span
                      className={`font-mono text-4xl tabular-nums ${
                        isRecording ? "text-wrong" : "text-royal-dark"
                      }`}
                    >
                      {formatDuration(recorder.seconds)}
                    </span>
                  </div>

                  <p className="text-sm text-ink-2" aria-live="polite">
                    {isRequesting && "Waiting for microphone permission…"}
                    {isRecording && "Recording. Speak naturally."}
                    {recorder.status === "idle" && "Ready to record."}
                    {hasAudio && "Recording finished. Review it, then send it for structuring."}
                  </p>
                </div>

                {/* Transport controls */}
                <div className="flex flex-wrap justify-center gap-3">
                  {!isRecording && !hasAudio && (
                    <Button
                      size="lg"
                      icon={Mic}
                      onClick={recorder.start}
                      loading={isRequesting}
                      disabled={isRequesting}
                    >
                      Start recording
                    </Button>
                  )}

                  {isRecording && (
                    <Button size="lg" variant="danger" icon={Square} onClick={recorder.stop}>
                      Stop recording
                    </Button>
                  )}

                  {hasAudio && (
                    <>
                      <Button
                        size="lg"
                        icon={Upload}
                        onClick={handleSubmit}
                        loading={processing}
                        disabled={processing}
                      >
                        {processing ? "Structuring…" : "Structure this experience"}
                      </Button>
                      <Button
                        size="lg"
                        variant="secondary"
                        icon={RotateCcw}
                        onClick={handleReset}
                        disabled={processing}
                      >
                        Record again
                      </Button>
                    </>
                  )}
                </div>

                {/* Playback */}
                {hasAudio && (
                  <audio
                    controls
                    src={recorder.audio.url}
                    className="mt-1 w-full max-w-md"
                    aria-label="Review your recording"
                  />
                )}
              </div>
            )}
          </Card>

          {/* Microphone / capture errors */}
          {recorder.error && (
            <div
              role="alert"
              className="mt-4 flex gap-3 rounded-lg border border-wrong/25 bg-wrong-tint p-4"
            >
              <AlertCircle size={18} className="mt-0.5 shrink-0 text-wrong" aria-hidden="true" />
              <p className="text-[0.9375rem] leading-relaxed text-ink">{recorder.error}</p>
            </div>
          )}

          {/* Processing */}
          {processing && (
            <Card className="mt-6 p-6">
              <InlineLoader message="Sending audio to WisdomKernel, transcribing, then extracting the record. This can take up to a minute." />
            </Card>
          )}

          {/* Upload / API error */}
          {uploadError && (
            <div className="mt-6">
              <ErrorState
                error={uploadError}
                title="Could not process this recording"
                onRetry={handleSubmit}
              />
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="mt-8 space-y-8">
              {result.meta?.notices?.length > 0 && (
                <div className="rounded-lg border border-caution/25 bg-caution-tint p-4">
                  <p className="text-sm font-medium text-ink">How this result was produced</p>
                  <ul className="mt-2 space-y-1.5">
                    {result.meta.notices.map((notice, index) => (
                      <li key={index} className="text-sm leading-relaxed text-ink-2">
                        {notice}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <section aria-labelledby="transcript-heading">
                <div className="mb-3 flex flex-wrap items-center gap-3">
                  <h2 id="transcript-heading" className="text-heading text-ink">
                    Transcript
                  </h2>
                  {transcriptionLabel && (
                    <Badge tone={transcriptionLabel.tone}>{transcriptionLabel.text}</Badge>
                  )}
                </div>
                <Card className="p-5 sm:p-6">
                  <p className="max-w-prose whitespace-pre-wrap text-[0.9375rem] leading-[1.75] text-ink">
                    {result.transcript}
                  </p>
                </Card>
              </section>

              <section aria-labelledby="record-heading">
                <div className="mb-3 flex flex-wrap items-center gap-3">
                  <h2 id="record-heading" className="text-heading text-ink">
                    Experience record
                  </h2>
                  {extractionLabel && (
                    <Badge tone={extractionLabel.tone} icon={Check}>
                      {extractionLabel.text}
                    </Badge>
                  )}
                </div>

                <p className="mb-5 max-w-prose text-sm leading-relaxed text-ink-2">
                  Only what you said appears below. A field left blank means the recording did not
                  cover it — WisdomKernel does not fill in the gap.
                </p>

                <Card className="px-5 pb-1 pt-1 sm:px-7">
                  <RecordSheet
                    fields={experienceToFields(result.experience, "Not covered in this recording")}
                  />
                </Card>
              </section>

              <div className="flex flex-wrap gap-3">
                <Button variant="secondary" icon={RotateCcw} onClick={handleReset}>
                  Record another experience
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Guidance */}
        <aside className="order-1 lg:order-2">
          <Card className="!bg-royal-tint p-6">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-royal-dark shadow-sm">
              <Lightbulb size={20} aria-hidden="true" />
            </span>
            <h2 className="mt-4 font-serif text-lg text-ink">What makes a good recording</h2>
            <ul className="mt-4 space-y-3 text-[0.9375rem] leading-relaxed text-ink-2">
              <li>Pick one specific incident rather than a general topic.</li>
              <li>Say what you first assumed, and when you realised it was wrong.</li>
              <li>Name the real root cause, not just the symptom.</li>
              <li>End with what you wish someone had told you on day one.</li>
            </ul>

            <div className="mt-6 border-t border-royal/15 pt-5">
              <h3 className="text-sm font-medium text-ink">Microphone</h3>
              <p className="mt-1.5 text-sm text-ink-2">
                {recorder.permission === "granted" && "Permission granted."}
                {recorder.permission === "denied" &&
                  "Permission blocked. Allow microphone access in your browser's site settings."}
                {recorder.permission === "unknown" &&
                  "Your browser will ask for permission when you start."}
              </p>
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}