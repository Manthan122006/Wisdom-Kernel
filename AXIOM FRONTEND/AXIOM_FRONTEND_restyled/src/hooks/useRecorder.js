/**
 * useRecorder.js
 * --------------
 * Wraps the browser MediaRecorder API for the Record Experience page.
 *
 * States: idle -> requesting -> recording -> stopped
 * Also reports microphone permission and any capture error.
 *
 * The caller owns what happens to the resulting blob; this hook only
 * captures audio and releases the microphone when it is done.
 */

import { useCallback, useEffect, useRef, useState } from "react";

// Formats chosen in the order browsers actually support them.
const PREFERRED_TYPES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/ogg;codecs=opus",
  "audio/mp4",
];

function pickMimeType() {
  if (typeof MediaRecorder === "undefined") return null;
  return PREFERRED_TYPES.find((type) => MediaRecorder.isTypeSupported(type)) || "";
}

function extensionFor(mimeType) {
  if (!mimeType) return "webm";
  if (mimeType.includes("mp4")) return "m4a";
  if (mimeType.includes("ogg")) return "ogg";
  return "webm";
}

export function useRecorder() {
  const [status, setStatus] = useState("idle"); // idle | requesting | recording | stopped
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState(null);
  const [permission, setPermission] = useState("unknown"); // unknown | granted | denied
  const [audio, setAudio] = useState(null); // { blob, url, filename, mimeType }

  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const audioUrlRef = useRef(null);

  const isSupported =
    typeof navigator !== "undefined" &&
    Boolean(navigator.mediaDevices?.getUserMedia) &&
    typeof MediaRecorder !== "undefined";

  const releaseStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Release the microphone and any object URL when the page unmounts.
  useEffect(() => {
    return () => {
      clearTimer();
      releaseStream();
      if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
    };
  }, [clearTimer, releaseStream]);

  const start = useCallback(async () => {
    if (!isSupported) {
      setError(
        "This browser cannot record audio. Try the latest Chrome, Edge or Firefox on a page served over http://localhost or https."
      );
      return;
    }

    setError(null);
    setStatus("requesting");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      setPermission("granted");

      const mimeType = pickMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) chunksRef.current.push(event.data);
      };

      recorder.onstop = () => {
        const type = recorder.mimeType || mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type });

        if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
        const url = URL.createObjectURL(blob);
        audioUrlRef.current = url;

        setAudio({
          blob,
          url,
          mimeType: type,
          filename: `experience-${Date.now()}.${extensionFor(type)}`,
        });
        setStatus("stopped");
        releaseStream();
      };

      recorder.onerror = () => {
        setError("Recording stopped unexpectedly. Try again.");
        setStatus("idle");
        clearTimer();
        releaseStream();
      };

      recorderRef.current = recorder;
      recorder.start();

      setSeconds(0);
      setStatus("recording");
      clearTimer();
      timerRef.current = setInterval(() => setSeconds((value) => value + 1), 1000);
    } catch (err) {
      releaseStream();
      setStatus("idle");

      if (err?.name === "NotAllowedError" || err?.name === "SecurityError") {
        setPermission("denied");
        setError(
          "Microphone access was blocked. Allow it in your browser's site settings, then start again."
        );
      } else if (err?.name === "NotFoundError") {
        setError("No microphone was found. Connect one and try again.");
      } else {
        setError("The microphone could not be started. Check that no other app is using it.");
      }
    }
  }, [isSupported, clearTimer, releaseStream]);

  const stop = useCallback(() => {
    clearTimer();
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
  }, [clearTimer]);

  const reset = useCallback(() => {
    clearTimer();
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
    releaseStream();
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
    chunksRef.current = [];
    recorderRef.current = null;
    setAudio(null);
    setSeconds(0);
    setError(null);
    setStatus("idle");
  }, [clearTimer, releaseStream]);

  return { status, seconds, error, permission, audio, isSupported, start, stop, reset };
}

export default useRecorder;
