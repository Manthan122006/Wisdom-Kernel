/**
 * VoiceNoteStructurer.jsx
 * -----------------------
 * End-to-end Voice Note Structuring component powered by Groq AI.
 * 
 * Pipeline:
 * 1. Capture microphone audio via MediaRecorder API or audio upload
 * 2. Send audio blob to POST /api/voice-notes/structure
 * 3. Groq Whisper (whisper-large-v3-turbo) transcribes speech to text
 * 4. Groq Llama 3.3 (llama-3.3-70b-versatile) structures raw text into JSON
 * 5. Interactive UI rendering: Title, Summary, Key Takeaways, and Action Items checklist
 */

import { useState, useEffect, useRef } from "react";
import {
  Mic,
  Square,
  Upload,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  Radio,
  FileAudio,
  CheckSquare,
  Square as UncheckedSquare,
  User,
  Calendar,
  ChevronDown,
  ChevronUp,
  Tag,
  ListTodo,
  FileText,
  Volume2,
} from "lucide-react";

import { api, describeError } from "../api/api";
import Button from "./Button";
import { Badge, Card } from "./Card";
import { formatDuration } from "../utils/format";

const CATEGORY_COLORS = {
  Work: "bg-blue-100 text-blue-800 border-blue-300",
  Personal: "bg-purple-100 text-purple-800 border-purple-300",
  Project: "bg-emerald-100 text-emerald-800 border-emerald-300",
  Meeting: "bg-amber-100 text-amber-800 border-amber-300",
  Idea: "bg-rose-100 text-rose-800 border-rose-300",
};

const PRIORITY_BADGES = {
  High: { bg: "bg-rose-500/10 text-rose-700 border-rose-200", label: "High" },
  Medium: { bg: "bg-amber-500/10 text-amber-700 border-amber-200", label: "Medium" },
  Low: { bg: "bg-blue-500/10 text-blue-700 border-blue-200", label: "Low" },
};

const PROCESSING_STEPS = [
  "Uploading audio blob to backend...",
  "Transcribing audio with Groq Whisper (whisper-large-v3-turbo)...",
  "Structuring takeaways & action items with Groq Llama 3.3...",
  "Formatting interactive checklist & results...",
];

export default function VoiceNoteStructurer() {
  const [inputMode, setInputMode] = useState("mic"); // "mic" | "upload"
  const [recState, setRecState] = useState("idle"); // "idle" | "requesting" | "recording" | "stopped"
  const [seconds, setSeconds] = useState(0);
  const [audioUrl, setAudioUrl] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);

  // Processing & result state
  const [processing, setProcessing] = useState(false);
  const [processingMsgIndex, setProcessingMsgIndex] = useState(0);
  const [result, setResult] = useState(null);
  const [completedTasks, setCompletedTasks] = useState({});
  const [showTranscript, setShowTranscript] = useState(false);
  const [error, setError] = useState(null);

  // MediaRecorder references
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);

  // Timer tick for recording duration
  useEffect(() => {
    if (recState === "recording") {
      timerRef.current = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [recState]);

  // Cycle processing messages
  useEffect(() => {
    if (!processing) return;
    const interval = setInterval(() => {
      setProcessingMsgIndex((prev) => (prev + 1) % PROCESSING_STEPS.length);
    }, 1500);
    return () => clearInterval(interval);
  }, [processing]);

  // Clean up audio blob URL on unmount
  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  async function startRecording() {
    setError(null);
    setAudioUrl(null);
    setAudioBlob(null);
    audioChunksRef.current = [];
    setSeconds(0);
    setRecState("requesting");

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Microphone access is not supported by your browser environment.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      let mimeType = "audio/webm";
      if (!MediaRecorder.isTypeSupported("audio/webm")) {
        if (MediaRecorder.isTypeSupported("audio/mp4")) mimeType = "audio/mp4";
        else if (MediaRecorder.isTypeSupported("audio/wav")) mimeType = "audio/wav";
        else mimeType = "";
      }

      const options = mimeType ? { mimeType } : undefined;
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: mimeType || "audio/webm" });
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioUrl(url);
        setRecState("stopped");
        // Stop stream tracks to release microphone
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(250);
      setRecState("recording");
    } catch (err) {
      setRecState("idle");
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setError("Microphone permission was denied. Please allow microphone access in your browser settings.");
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        setError("No microphone device was detected on your computer.");
      } else {
        setError(err.message || "Failed to start recording audio.");
      }
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
  }

  async function handleProcessAudio() {
    const blobToUpload = inputMode === "mic" ? audioBlob : uploadedFile;
    const filename = inputMode === "mic" ? "voice_note.webm" : uploadedFile?.name || "audio.mp3";

    if (!blobToUpload) return;

    setProcessing(true);
    setProcessingMsgIndex(0);
    setError(null);
    setResult(null);

    try {
      const res = await api.structureVoiceNote(blobToUpload, filename);
      setResult(res);
      setCompletedTasks({});
    } catch (err) {
      setError(describeError(err).message);
    } finally {
      setProcessing(false);
    }
  }

  function handleReset() {
    if (recState === "recording") stopRecording();
    setRecState("idle");
    setSeconds(0);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setAudioBlob(null);
    setUploadedFile(null);
    setResult(null);
    setError(null);
    setCompletedTasks({});
    setShowTranscript(false);
  }

  function toggleTaskCompletion(index) {
    setCompletedTasks((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  }

  const voiceData = result?.data;
  const actionItems = voiceData?.action_items || [];
  const completedCount = Object.values(completedTasks).filter(Boolean).length;

  return (
    <div className="space-y-8">
      {/* 1. INPUT CONSOLE (Only shown when no result is rendered) */}
      {!result && (
        <Card className="p-6 sm:p-8 border border-blue-200/90 bg-white shadow-card space-y-6">
          {/* Mode Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-rule pb-4">
            <div>
              <h2 className="font-sans text-xl font-extrabold text-navy flex items-center gap-2">
                <Sparkles size={22} className="text-blue-600 animate-pulse" />
                <span>Groq Voice Note Structurer</span>
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-ink-2">
                Record your voice or upload audio. Powered by Groq Whisper & Llama 3.3.
              </p>
            </div>

            <div className="flex rounded-xl bg-paper p-1 border border-rule">
              <button
                type="button"
                onClick={() => {
                  setInputMode("mic");
                  setError(null);
                }}
                className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
                  inputMode === "mic"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-navy hover:text-blue-600"
                }`}
              >
                <Mic size={14} />
                <span>Microphone</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setInputMode("upload");
                  setError(null);
                }}
                className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
                  inputMode === "upload"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-navy hover:text-blue-600"
                }`}
              >
                <Upload size={14} />
                <span>Upload File</span>
              </button>
            </div>
          </div>

          {/* MODE A: LIVE MICROPHONE RECORDING */}
          {inputMode === "mic" && (
            <div className="flex flex-col items-center gap-6 py-6 text-center">
              <div className="relative flex items-center justify-center">
                {recState === "recording" && (
                  <div className="absolute -inset-5 rounded-full bg-rose-500/20 animate-ping" />
                )}

                <div
                  className={`relative flex h-28 w-28 items-center justify-center rounded-full border-2 transition-all shadow-md ${
                    recState === "recording"
                      ? "border-rose-500 bg-rose-50 text-rose-600 shadow-rose-500/20"
                      : recState === "stopped"
                        ? "border-emerald-500 bg-emerald-50 text-emerald-600"
                        : "border-blue-300 bg-blue-50 text-blue-600 hover:border-blue-500"
                  }`}
                >
                  {recState === "recording" ? (
                    <Radio size={40} className="animate-pulse" />
                  ) : recState === "stopped" ? (
                    <CheckCircle2 size={40} />
                  ) : (
                    <Mic size={40} />
                  )}
                </div>
              </div>

              {/* Status & Timer */}
              <div className="space-y-1">
                <span
                  className={`font-mono text-5xl font-extrabold tabular-nums tracking-tight ${
                    recState === "recording" ? "text-rose-600" : "text-navy"
                  }`}
                >
                  {formatDuration(seconds)}
                </span>
                <p className="text-xs sm:text-sm font-medium text-ink-2 max-w-md mx-auto">
                  {recState === "requesting" && "Requesting microphone permission..."}
                  {recState === "recording" && "Recording live. Speak clearly into your microphone."}
                  {recState === "idle" && "Click Start Recording to dictate your meeting notes, ideas, or work updates."}
                  {recState === "stopped" && "Audio captured! Play back below or click Structure Note."}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap justify-center gap-3">
                {recState === "idle" && (
                  <Button size="lg" icon={Mic} onClick={startRecording}>
                    Start Recording
                  </Button>
                )}

                {recState === "recording" && (
                  <Button size="lg" variant="danger" icon={Square} onClick={stopRecording}>
                    Stop Recording
                  </Button>
                )}

                {recState === "stopped" && (
                  <>
                    <Button
                      size="lg"
                      icon={Sparkles}
                      onClick={handleProcessAudio}
                      loading={processing}
                      disabled={processing}
                    >
                      Structure Voice Note
                    </Button>
                    <Button
                      size="lg"
                      variant="secondary"
                      icon={RotateCcw}
                      onClick={handleReset}
                      disabled={processing}
                    >
                      Record Again
                    </Button>
                  </>
                )}
              </div>

              {/* Audio Playback Controls */}
              {audioUrl && (
                <div className="w-full max-w-md rounded-2xl border border-blue-200 bg-blue-50/60 p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-navy">
                    <span className="flex items-center gap-1.5">
                      <Volume2 size={15} className="text-blue-600" /> Playback Preview
                    </span>
                    <span className="font-mono text-ink-3">{formatDuration(seconds)}</span>
                  </div>
                  <audio controls src={audioUrl} className="w-full rounded-lg h-9" />
                </div>
              )}
            </div>
          )}

          {/* MODE B: AUDIO FILE UPLOAD */}
          {inputMode === "upload" && (
            <div className="space-y-5 text-center py-4">
              <div className="border-2 border-dashed border-blue-200 rounded-2xl p-8 bg-blue-50/50 hover:bg-blue-50 transition-colors">
                <input
                  type="file"
                  accept="audio/*"
                  id="voice-note-file"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setUploadedFile(file);
                      setError(null);
                    }
                  }}
                />
                <label htmlFor="voice-note-file" className="cursor-pointer flex flex-col items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
                    <FileAudio size={24} />
                  </div>
                  <span className="text-sm font-bold text-blue-700 hover:underline">
                    {uploadedFile ? uploadedFile.name : "Choose an audio recording file"}
                  </span>
                  <span className="text-xs text-ink-3">
                    {uploadedFile
                      ? `${(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB`
                      : "Supports MP3, WAV, M4A, WEBM up to 25MB"}
                  </span>
                </label>
              </div>

              {uploadedFile && (
                <div className="flex justify-center gap-3 pt-2">
                  <Button
                    size="lg"
                    icon={Sparkles}
                    onClick={handleProcessAudio}
                    loading={processing}
                    disabled={processing}
                  >
                    Structure Audio File
                  </Button>
                  <Button
                    variant="secondary"
                    size="lg"
                    onClick={() => setUploadedFile(null)}
                    disabled={processing}
                  >
                    Remove File
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 flex items-start gap-3 text-rose-800">
              <AlertCircle size={20} className="shrink-0 text-rose-600 mt-0.5" />
              <div className="text-xs sm:text-sm font-medium leading-relaxed">
                <strong>Structuring Error:</strong> {error}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* 2. PROCESSING SPINNER */}
      {processing && (
        <Card className="p-10 text-center border-2 border-blue-300 bg-gradient-to-b from-blue-100/70 via-blue-50 to-white shadow-subtle space-y-4 animate-fade-in">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md">
            <Sparkles size={28} className="animate-spin" />
          </div>
          <div className="space-y-1">
            <h3 className="font-sans text-lg font-extrabold text-navy">
              {PROCESSING_STEPS[processingMsgIndex]}
            </h3>
            <p className="text-xs sm:text-sm text-ink-2 max-w-md mx-auto">
              Running Groq 2-Stage Pipeline: Speech-to-Text Whisper + JSON Mode Structuring with Llama 3.3 70B.
            </p>
          </div>
        </Card>
      )}

      {/* 3. STRUCTURED RESULT PRESENTATION */}
      {result && voiceData && (
        <div className="space-y-8 animate-fade-in">
          {/* Main Structured Result Card */}
          <Card className="p-6 sm:p-10 border border-blue-200/90 bg-white shadow-card space-y-8">
            {/* Top Bar: Title & Category */}
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-rule pb-6">
              <div className="space-y-2 max-w-2xl">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-extrabold uppercase tracking-wider ${
                      CATEGORY_COLORS[voiceData.category] || CATEGORY_COLORS.Work
                    }`}
                  >
                    <Tag size={12} />
                    {voiceData.category}
                  </span>
                  <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 size={13} /> Processed by Groq AI
                  </span>
                </div>
                <h1 className="font-sans text-2xl sm:text-3xl font-extrabold text-navy leading-tight">
                  {voiceData.title}
                </h1>
              </div>

              <Button size="sm" variant="secondary" icon={RotateCcw} onClick={handleReset}>
                New Voice Note
              </Button>
            </div>

            {/* Executive Summary Banner */}
            <div className="rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50 via-indigo-50/50 to-blue-50 p-6 shadow-xs space-y-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-blue-700 flex items-center gap-1.5">
                <Sparkles size={14} className="text-blue-600" /> Executive Summary
              </span>
              <p className="font-sans text-base sm:text-lg font-medium text-navy leading-relaxed">
                &ldquo;{voiceData.summary}&rdquo;
              </p>
            </div>

            {/* Two-Column Grid: Key Points & Action Items */}
            <div className="grid gap-8 lg:grid-cols-2">
              {/* Column 1: Key Takeaways */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-rule pb-2">
                  <h3 className="font-sans text-base font-extrabold text-navy flex items-center gap-2">
                    <Sparkles size={18} className="text-blue-600" />
                    <span>Key Takeaways</span>
                  </h3>
                  <Badge tone="neutral" className="text-xs">
                    {voiceData.key_points.length} points
                  </Badge>
                </div>

                {voiceData.key_points.length === 0 ? (
                  <p className="text-sm text-ink-3 italic">No key points extracted from this voice note.</p>
                ) : (
                  <ul className="space-y-3">
                    {voiceData.key_points.map((point, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-3 rounded-xl border border-rule bg-paper/60 p-3.5 text-sm text-navy leading-relaxed font-medium transition-colors hover:border-blue-200 hover:bg-white"
                      >
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-mono text-xs font-bold">
                          {idx + 1}
                        </span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Column 2: Interactive Action Items Checklist */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-rule pb-2">
                  <h3 className="font-sans text-base font-extrabold text-navy flex items-center gap-2">
                    <ListTodo size={18} className="text-blue-600" />
                    <span>Action Items Checklist</span>
                  </h3>
                  <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">
                    {completedCount} / {actionItems.length} Done
                  </span>
                </div>

                {actionItems.length === 0 ? (
                  <div className="rounded-xl border border-rule bg-paper p-4 text-center text-sm text-ink-3">
                    No explicit action items identified in this note.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {actionItems.map((item, idx) => {
                      const isDone = !!completedTasks[idx];
                      const priorityInfo =
                        PRIORITY_BADGES[item.priority] || PRIORITY_BADGES.Medium;

                      return (
                        <div
                          key={idx}
                          onClick={() => toggleTaskCompletion(idx)}
                          className={`cursor-pointer rounded-2xl border p-4 transition-all duration-150 ${
                            isDone
                              ? "border-emerald-200 bg-emerald-50/60 text-ink-3 line-through"
                              : "border-rule bg-white hover:border-blue-300 hover:shadow-xs"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <button
                              type="button"
                              className="mt-0.5 shrink-0 text-blue-600 focus:outline-none"
                              aria-label={isDone ? "Mark incomplete" : "Mark complete"}
                            >
                              {isDone ? (
                                <CheckSquare size={20} className="text-emerald-600" />
                              ) : (
                                <UncheckedSquare size={20} className="text-ink-3 hover:text-blue-600" />
                              )}
                            </button>

                            <div className="space-y-2 flex-1">
                              <p className={`text-sm font-semibold leading-snug ${isDone ? "text-ink-3" : "text-navy"}`}>
                                {item.task}
                              </p>

                              {/* Badges for priority, owner, deadline */}
                              <div className="flex flex-wrap items-center gap-2 text-xs">
                                <span className={`px-2 py-0.5 rounded-md border font-bold ${priorityInfo.bg}`}>
                                  {priorityInfo.label} Priority
                                </span>

                                {item.owner && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-paper border border-rule text-ink-2 font-medium">
                                    <User size={11} className="text-blue-600" />
                                    {item.owner}
                                  </span>
                                )}

                                {item.deadline && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-paper border border-rule text-ink-2 font-medium">
                                    <Calendar size={11} className="text-blue-600" />
                                    {item.deadline}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Raw Transcript Drawer */}
            <div className="border-t border-rule pt-4">
              <button
                type="button"
                onClick={() => setShowTranscript(!showTranscript)}
                className="flex items-center justify-between w-full rounded-xl bg-paper/70 p-3 text-xs font-bold text-navy hover:bg-paper transition-colors"
              >
                <span className="flex items-center gap-2">
                  <FileText size={15} className="text-blue-600" />
                  <span>Inspect Raw Groq Whisper Transcript</span>
                </span>
                {showTranscript ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              {showTranscript && (
                <div className="mt-3 rounded-xl border border-rule bg-white p-4 font-sans text-xs sm:text-sm text-ink-2 leading-relaxed whitespace-pre-wrap animate-fade-in">
                  {result.transcript || "No transcript returned."}
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
