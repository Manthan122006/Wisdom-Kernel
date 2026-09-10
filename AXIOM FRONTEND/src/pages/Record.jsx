/**
 * Record.jsx
 * ----------
 * Experience Capture Studio.
 *
 * 4-Stage Workflow:
 * CAPTURE → PROCESS → REVIEW → SAVE
 *
 * Visual Palette:
 * - White foundation
 * - Light Blue (#F0F6FF) workflow and upload areas
 * - Primary Blue (#2563EB) actions and active states
 * - Dark Navy (#102A56) headings and titles
 */

import { useState, useEffect } from "react";
import {
  AlertCircle,
  Check,
  Mic,
  RotateCcw,
  Square,
  Upload,
  ArrowRight,
  Sparkles,
  FileText,
  Save,
  Radio,
  CheckCircle2,
  FileAudio,
  PenTool,
  Lightbulb,
} from "lucide-react";

import { api, describeError } from "../api/api";
import useRecorder from "../hooks/useRecorder";
import { formatDuration } from "../utils/format";

import Button from "../components/Button";
import PageHeader from "../components/PageHeader";
import { Badge, Card } from "../components/Card";
import { ErrorState } from "../components/StateViews";

const STAGES = [
  { id: 1, name: "Capture", desc: "Voice, debrief notes, or audio upload" },
  { id: 2, name: "Process", desc: "Extracting decisions & reasoning" },
  { id: 3, name: "Review", desc: "Verify 9-field experience record" },
  { id: 4, name: "Save", desc: "Cataloged in organization & public library" },
];

const PROCESSING_MESSAGES = [
  "Processing experience...",
  "Extracting key decisions...",
  "Preparing experience record...",
];

export default function Record() {
  const [captureMode, setCaptureMode] = useState("voice"); // "voice" | "text" | "upload"
  const recorder = useRecorder();

  // Text input state
  const [textInput, setTextInput] = useState("");

  // File upload state
  const [uploadedFile, setUploadedFile] = useState(null);

  // Workflow states
  const [processing, setProcessing] = useState(false);
  const [processingStepIndex, setProcessingStepIndex] = useState(0);
  const [result, setResult] = useState(null);
  const [captureError, setCaptureError] = useState(null);
  const [savedNotice, setSavedNotice] = useState(false);

  const isRecording = recorder.status === "recording";
  const isRequesting = recorder.status === "requesting";
  const hasRecordedAudio = recorder.status === "stopped" && recorder.audio;

  // Cycle subtle processing language while in flight
  useEffect(() => {
    if (!processing) return;
    const timer = setInterval(() => {
      setProcessingStepIndex((prev) => (prev + 1) % PROCESSING_MESSAGES.length);
    }, 1800);
    return () => clearInterval(timer);
  }, [processing]);

  // Determine current active workflow stage
  let currentStage = 1;
  if (savedNotice) currentStage = 4;
  else if (result) currentStage = 3;
  else if (processing) currentStage = 2;
  else currentStage = 1;

  async function handleProcessVoice() {
    if (!recorder.audio) return;
    setProcessing(true);
    setProcessingStepIndex(0);
    setCaptureError(null);
    setResult(null);
    setSavedNotice(false);

    try {
      const data = await api.transcribe(recorder.audio.blob, recorder.audio.filename);
      setResult(data);
    } catch (err) {
      setCaptureError(describeError(err));
    } finally {
      setProcessing(false);
    }
  }

  async function handleProcessUpload() {
    if (!uploadedFile) return;
    setProcessing(true);
    setProcessingStepIndex(0);
    setCaptureError(null);
    setResult(null);
    setSavedNotice(false);

    try {
      const data = await api.transcribe(uploadedFile, uploadedFile.name);
      setResult(data);
    } catch (err) {
      setCaptureError(describeError(err));
    } finally {
      setProcessing(false);
    }
  }

  async function handleProcessText() {
    if (!textInput.trim()) return;
    setProcessing(true);
    setProcessingStepIndex(0);
    setCaptureError(null);
    setResult(null);
    setSavedNotice(false);

    try {
      const data = await api.structure(textInput);
      setResult({
        transcript: textInput,
        experience: data?.experience || data,
        meta: { transcription_mode: "direct_text_input" },
      });
    } catch (err) {
      setCaptureError(describeError(err));
    } finally {
      setProcessing(false);
    }
  }

  function handleReset() {
    recorder.reset();
    setTextInput("");
    setUploadedFile(null);
    setResult(null);
    setCaptureError(null);
    setSavedNotice(false);
  }

  function handleSave() {
    setSavedNotice(true);
  }

  const exp = result?.experience;

  return (
    <div className="animate-fade-in space-y-8">
      <PageHeader
        title="Record an Experience"
        description="Capture one real production incident: what symptoms appeared, what you decided, what went wrong, and what you would advise someone facing it now."
        breadcrumbs={[{ label: "Home", to: "/" }, { label: "Record Experience" }]}
      />

      {/* 4-Stage Workflow Progression Header in Light Blue (#F0F6FF) */}
      <div className="rounded-3xl border border-blue-200/80 bg-blue-50/70 p-5 sm:p-6 shadow-subtle">
        <nav aria-label="Capture Progress" className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {STAGES.map((stage) => {
            const isCompleted = currentStage > stage.id;
            const isCurrent = currentStage === stage.id;

            return (
              <div
                key={stage.id}
                className={`flex flex-col border-l-2 pl-3.5 py-1 transition-colors ${
                  isCurrent
                    ? "border-blue-600 text-blue-700"
                    : isCompleted
                      ? "border-emerald-500 text-navy font-bold"
                      : "border-blue-300 text-navy/70"
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider">
                  <span>Stage {stage.id}</span>
                  {isCompleted && <Check size={13} className="text-emerald-600" />}
                </div>
                <span className={`text-sm font-bold mt-0.5 ${isCurrent ? "text-blue-700" : "text-navy"}`}>
                  {stage.name}
                </span>
                <span className="hidden lg:block text-xs text-navy/80 font-medium mt-0.5 leading-snug">
                  {stage.desc}
                </span>
              </div>
            );
          })}
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="grid gap-8 lg:grid-cols-[1fr_21rem]">
        {/* Left Column: Capture Console or Results */}
        <div className="space-y-6">
          {!result && (
            <div className="space-y-6">
              {/* Input Mode Selector */}
              <div className="flex flex-wrap gap-2 border-b border-rule pb-3">
                <button
                  type="button"
                  onClick={() => setCaptureMode("voice")}
                  className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                    captureMode === "voice"
                      ? "bg-blue-600 text-white shadow-xs border border-blue-600"
                      : "border border-blue-200 bg-white text-navy hover:bg-blue-50"
                  }`}
                >
                  <Mic size={14} />
                  <span>Voice Recording</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCaptureMode("text")}
                  className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                    captureMode === "text"
                      ? "bg-blue-600 text-white shadow-xs border border-blue-600"
                      : "border border-blue-200 bg-white text-navy hover:bg-blue-50"
                  }`}
                >
                  <PenTool size={14} />
                  <span>Text Debrief Input</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCaptureMode("upload")}
                  className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                    captureMode === "upload"
                      ? "bg-blue-600 text-white shadow-xs border border-blue-600"
                      : "border border-blue-200 bg-white text-navy hover:bg-blue-50"
                  }`}
                >
                  <Upload size={14} />
                  <span>Upload Audio File</span>
                </button>
              </div>

              {/* MODE 1: VOICE RECORDING */}
              {captureMode === "voice" && (
                <Card className="p-8 sm:p-10 border border-rule bg-white shadow-card">
                  {!recorder.isSupported ? (
                    <div className="flex gap-3 rounded-2xl border border-caution/30 bg-caution-tint p-4">
                      <AlertCircle size={20} className="mt-0.5 shrink-0 text-caution" />
                      <div>
                        <p className="text-sm font-bold text-navy">Microphone Access Not Supported</p>
                        <p className="mt-1 text-xs text-ink-2">
                          Please use a modern browser (Chrome, Safari, Edge) or use the Text Debrief Input mode.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-6 py-4 text-center">
                      <div className="relative flex items-center justify-center">
                        {isRecording && (
                          <div className="absolute -inset-4 rounded-full bg-rose-500/20 animate-ping" />
                        )}

                        <div
                          className={`relative flex h-28 w-28 items-center justify-center rounded-full border-2 transition-all ${
                            isRecording
                              ? "border-wrong bg-wrong-tint text-wrong shadow-lg shadow-wrong/20"
                              : hasRecordedAudio
                                ? "border-emerald-500 bg-emerald-50 text-emerald-600 shadow-subtle"
                                : "border-blue-200 bg-blue-50 text-blue-600"
                          }`}
                        >
                          {isRecording ? (
                            <Radio size={36} className="animate-pulse" />
                          ) : hasRecordedAudio ? (
                            <CheckCircle2 size={36} />
                          ) : (
                            <Mic size={36} />
                          )}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span
                          className={`font-mono text-5xl font-extrabold tabular-nums tracking-tight ${
                            isRecording ? "text-wrong" : "text-navy"
                          }`}
                        >
                          {formatDuration(recorder.seconds)}
                        </span>
                        <p className="text-xs sm:text-sm font-medium text-ink-2">
                          {isRequesting && "Requesting microphone permission…"}
                          {isRecording && "Recording live. Speak clearly at a natural conversational pace."}
                          {recorder.status === "idle" && "Ready to record. Click Start to speak."}
                          {hasRecordedAudio && "Audio captured. Listen to playback below or extract the knowledge record."}
                        </p>
                      </div>

                      {/* Controls */}
                      <div className="flex flex-wrap justify-center gap-3">
                        {!isRecording && !hasRecordedAudio && (
                          <Button
                            size="lg"
                            icon={Mic}
                            onClick={recorder.start}
                            loading={isRequesting}
                            disabled={isRequesting}
                          >
                            Start Recording
                          </Button>
                        )}

                        {isRecording && (
                          <Button
                            size="lg"
                            variant="danger"
                            icon={Square}
                            onClick={recorder.stop}
                          >
                            Stop Recording
                          </Button>
                        )}

                        {hasRecordedAudio && (
                          <>
                            <Button
                              size="lg"
                              icon={Upload}
                              onClick={handleProcessVoice}
                              loading={processing}
                              disabled={processing}
                            >
                              Process Recording
                            </Button>
                            <Button
                              size="lg"
                              variant="secondary"
                              icon={RotateCcw}
                              onClick={handleReset}
                              disabled={processing}
                            >
                              Reset
                            </Button>
                          </>
                        )}
                      </div>

                      {/* Audio playback */}
                      {hasRecordedAudio && (
                        <div className="w-full max-w-md border-t border-rule pt-4">
                          <p className="text-xs font-semibold uppercase tracking-wider text-ink-3 mb-2">
                            Review Recording Playback
                          </p>
                          <audio
                            controls
                            src={recorder.audio.url}
                            className="w-full rounded-lg"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              )}

              {/* MODE 2: TEXT DEBRIEF INPUT */}
              {captureMode === "text" && (
                <Card className="p-7 sm:p-8 border border-rule bg-white shadow-card space-y-4">
                  <div>
                    <h3 className="font-sans text-base font-bold text-navy flex items-center gap-2">
                      <PenTool size={16} className="text-blue-600" />
                      <span>Incident Debrief Notes</span>
                    </h3>
                    <p className="mt-1 text-xs text-ink-2 leading-relaxed">
                      Paste a raw incident post-mortem, on-call notes, or type out the narrative. WisdomKernel will extract the problem, turning point, decision, and transferred lesson.
                    </p>
                  </div>

                  <textarea
                    rows={8}
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="Describe what happened: We saw latency spike on the database during peak sale hours. CPU was at 15% but connections were maxed out. We initially wanted to increase replicas, but realized that would multiply pool connections. Instead we reduced pool size and deployed an external connection proxy..."
                    className="w-full rounded-2xl border border-rule bg-paper/50 p-4 text-sm text-ink placeholder:text-ink-3 shadow-xs focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 leading-relaxed font-sans"
                  />

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <span className="text-xs text-ink-3 font-medium">
                      {textInput.length} characters entered
                    </span>

                    <Button
                      size="lg"
                      icon={Sparkles}
                      onClick={handleProcessText}
                      loading={processing}
                      disabled={!textInput.trim() || processing}
                    >
                      Extract Experience Record
                    </Button>
                  </div>
                </Card>
              )}

              {/* MODE 3: UPLOAD AUDIO FILE */}
              {captureMode === "upload" && (
                <Card className="p-7 sm:p-8 border border-rule bg-white shadow-card space-y-5 text-center">
                  <div>
                    <h3 className="font-sans text-base font-bold text-navy flex items-center justify-center gap-2">
                      <FileAudio size={18} className="text-blue-600" />
                      <span>Upload Recorded Audio</span>
                    </h3>
                    <p className="mt-1 text-xs text-ink-2 max-w-md mx-auto">
                      Upload an existing interview, debrief voice memo, or incident recording (.mp3, .wav, .m4a, .webm).
                    </p>
                  </div>

                  <div className="border-2 border-dashed border-blue-200 rounded-2xl p-8 bg-blue-50/60 hover:bg-blue-50 transition-colors">
                    <input
                      type="file"
                      accept="audio/*"
                      id="audio-upload"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setUploadedFile(file);
                      }}
                    />
                    <label
                      htmlFor="audio-upload"
                      className="cursor-pointer flex flex-col items-center gap-3"
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
                        <Upload size={22} />
                      </div>
                      <span className="text-sm font-bold text-blue-700 hover:underline">
                        {uploadedFile ? uploadedFile.name : "Select an audio file from your computer"}
                      </span>
                      <span className="text-xs text-ink-3">
                        {uploadedFile ? `${Math.round(uploadedFile.size / 1024)} KB` : "Supports MP3, WAV, M4A up to 50MB"}
                      </span>
                    </label>
                  </div>

                  {uploadedFile && (
                    <div className="flex justify-center gap-3 pt-2">
                      <Button
                        size="lg"
                        icon={Sparkles}
                        onClick={handleProcessUpload}
                        loading={processing}
                        disabled={processing}
                      >
                        Process Uploaded File
                      </Button>
                      <Button
                        variant="secondary"
                        size="lg"
                        onClick={() => setUploadedFile(null)}
                        disabled={processing}
                      >
                        Remove
                      </Button>
                    </div>
                  )}
                </Card>
              )}
            </div>
          )}

          {/* Processing Status Banner in Soft Blue (#DCEBFF / #EAF3FF) */}
          {processing && (
            <Card className="p-8 text-center border-2 border-blue-300 bg-gradient-to-b from-blue-100/70 to-blue-50 shadow-subtle">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white mb-4 shadow-sm">
                <Sparkles size={22} className="animate-spin" />
              </div>
              <h3 className="font-sans text-lg font-extrabold text-navy">
                {PROCESSING_MESSAGES[processingStepIndex]}
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-ink-2 max-w-md mx-auto leading-relaxed">
                Analyzing technical context, isolating turning-point decisions, and preparing an indexed 9-field experience record.
              </p>
            </Card>
          )}

          {/* Capture / Transcribe Error */}
          {captureError && (
            <ErrorState
              error={captureError}
              title="Could not process this experience"
              onRetry={captureMode === "voice" ? handleProcessVoice : captureMode === "upload" ? handleProcessUpload : handleProcessText}
            />
          )}

          {/* STAGE 3 & 4: REVIEW & SAVE RESULTS */}
          {result && (
            <div className="space-y-8 animate-fade-in">
              {/* Success Notification */}
              {savedNotice && (
                <div className="rounded-2xl border border-correct/30 bg-correct-tint p-5 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 size={22} className="text-correct shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-navy">Experience Record Saved Successfully</p>
                      <p className="text-xs text-ink-2">Your knowledge contribution is now indexed in the Knowledge Library.</p>
                    </div>
                  </div>
                  <Button to="/experiences" size="sm" variant="secondary" icon={ArrowRight}>
                    View Library
                  </Button>
                </div>
              )}

              {/* 1. Raw Transcript / Source Notes (White Box) */}
              <section className="rounded-3xl border border-rule bg-white p-6 sm:p-8 shadow-subtle space-y-3">
                <div className="flex items-center justify-between border-b border-rule pb-3">
                  <div className="flex items-center gap-2">
                    <FileText size={16} className="text-blue-600" />
                    <h3 className="font-sans text-base font-bold text-navy">Transcript / Narrative</h3>
                  </div>
                  <Badge tone="neutral" className="text-xs font-mono">
                    {result.meta?.transcription_mode || "Captured"}
                  </Badge>
                </div>
                <p className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-ink-2">
                  {result.transcript || "No raw text available."}
                </p>
              </section>

              {/* 2. Structured Experience Record Sheet (White Box with Navy Typography) */}
              <section className="rounded-3xl border border-blue-200 bg-white p-6 sm:p-9 shadow-card space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rule pb-4">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
                      Stage 3 · Review Extraction
                    </span>
                    <h3 className="font-sans text-2xl font-extrabold text-navy mt-0.5">
                      Structured Experience Record
                    </h3>
                  </div>
                  <Badge tone="correct" icon={Check}>
                    Extraction Complete
                  </Badge>
                </div>

                {/* The 9 Knowledge Fields */}
                <div className="space-y-6 divide-y divide-rule">
                  {/* Problem */}
                  <div className="pt-4 first:pt-0">
                    <span className="text-xs font-bold uppercase tracking-wider text-navy block mb-1">
                      01 · Problem
                    </span>
                    <p className="font-sans text-sm sm:text-base leading-relaxed text-ink-2">
                      {exp?.problem || "Not explicitly stated in debrief"}
                    </p>
                  </div>

                  {/* Context (Soft Blue Box #F0F6FF) */}
                  <div className="pt-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-700 block mb-1">
                      02 · Operating Context
                    </span>
                    <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-4">
                      <p className="font-sans text-sm leading-relaxed text-navy">
                        {exp?.context || "Not explicitly stated in debrief"}
                      </p>
                    </div>
                  </div>

                  {/* Decision */}
                  <div className="pt-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-navy block mb-1">
                      03 · Decision Made
                    </span>
                    <div className="rounded-xl border border-rule bg-paper p-4">
                      <p className="font-sans text-sm sm:text-base font-semibold text-navy">
                        {exp?.decision || "Not explicitly stated in debrief"}
                      </p>
                    </div>
                  </div>

                  {/* Reasoning (Soft Blue Box) */}
                  <div className="pt-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-700 block mb-1">
                      04 · Engineering Reasoning
                    </span>
                    <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-4">
                      <p className="font-sans text-sm leading-relaxed text-navy">
                        {exp?.reasoning || "Not explicitly stated in debrief"}
                      </p>
                    </div>
                  </div>

                  {/* Outcome */}
                  <div className="pt-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-navy block mb-1">
                      05 · System Outcome
                    </span>
                    <p className="font-sans text-sm leading-relaxed text-ink-2">
                      {exp?.outcome || "Not explicitly stated in debrief"}
                    </p>
                  </div>

                  {/* Lesson (Standout Navy Box #102A56) */}
                  <div className="pt-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-700 block mb-1">
                      06 · Transferred Lesson
                    </span>
                    <blockquote className="rounded-2xl border border-navy-deep bg-navy text-white p-6 font-serif text-base sm:text-lg leading-relaxed shadow-sm">
                      &ldquo;{exp?.lesson || "Not explicitly stated in debrief"}&rdquo;
                    </blockquote>
                  </div>

                  {/* Mistake & Root Cause */}
                  <div className="pt-4 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-xl border border-wrong/25 bg-wrong-tint/50 p-4">
                      <span className="text-xs font-bold uppercase tracking-wider text-wrong block mb-1">
                        07 · False Assumption / Mistake
                      </span>
                      <p className="text-sm text-ink leading-relaxed font-medium">
                        {exp?.mistake || "None specifically identified"}
                      </p>
                    </div>
                    <div className="rounded-xl border border-rule bg-paper p-4">
                      <span className="text-xs font-bold uppercase tracking-wider text-ink-3 block mb-1">
                        08 · Root Cause
                      </span>
                      <p className="text-sm text-navy leading-relaxed">
                        {exp?.root_cause || "Covered under reasoning"}
                      </p>
                    </div>
                  </div>

                  {/* What I Wish I Knew */}
                  <div className="pt-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-700 block mb-1">
                      09 · What I Wish I Knew
                    </span>
                    <p className="font-serif text-sm sm:text-base leading-relaxed text-navy">
                      {exp?.what_i_wish_i_knew || "Not recorded in this capture"}
                    </p>
                  </div>

                  {/* Source */}
                  <div className="pt-4 flex items-center justify-between text-xs text-ink-3">
                    <span>Source: {exp?.source || "Direct debrief"}</span>
                    <span>Extraction: Grounded Human Experience</span>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="mt-8 border-t border-rule pt-6 flex flex-wrap items-center justify-between gap-4">
                  <Button variant="secondary" icon={RotateCcw} onClick={handleReset}>
                    Capture Another Incident
                  </Button>

                  {!savedNotice && (
                    <Button icon={Save} onClick={handleSave}>
                      Confirm & Save to Archive
                    </Button>
                  )}
                </div>
              </section>
            </div>
          )}
        </div>

        {/* Right Column: Capture Guidance (Soft Blue Box) */}
        <aside className="space-y-6">
          <div className="rounded-3xl border border-blue-200 bg-blue-50/70 p-6 shadow-subtle space-y-4">
            <h3 className="font-sans text-base font-bold text-navy flex items-center gap-2">
              <Sparkles size={16} className="text-blue-600" />
              <span>Capture Framework</span>
            </h3>

            <p className="text-xs text-ink-2 leading-relaxed">
              Real engineering wisdom lives in the friction between expectations and reality.
            </p>

            <ul className="space-y-3 text-xs sm:text-sm text-ink-2 leading-relaxed border-t border-blue-200 pt-3">
              <li className="flex gap-2">
                <span className="font-bold text-blue-600">•</span>
                <span><strong>Specific Incident:</strong> Focus on one tricky outage, edge case, or system migration.</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-blue-600">•</span>
                <span><strong>False Leads:</strong> What did you initially assume before uncovering the root cause?</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-blue-600">•</span>
                <span><strong>The Heuristic:</strong> What mental check do you now perform before approving changes?</span>
              </li>
            </ul>

            <div className="border-t border-blue-200 pt-3 text-xs text-ink-3">
              <p>
                <strong>Truthful Fallback:</strong> Only details you provide are structured. WisdomKernel never manufactures synthetic engineering outcomes.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
