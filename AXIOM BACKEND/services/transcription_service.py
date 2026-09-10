"""
transcription_service.py
------------------------
Turns an uploaded audio file into a transcript.

Only path: POST <AI_BASE_URL>/audio/transcriptions on any OpenAI-compatible
speech-to-text service, using the key from the environment.

This module NEVER fabricates a transcript. If no provider is configured, or
the provider fails, it raises and the API reports that plainly. Inventing
words a person did not say would defeat the entire point of WisdomKernel.

When speech-to-text is unavailable, the demo path is POST /structure, where
the user types or pastes a real transcript and the pipeline runs on that.
"""

from __future__ import annotations

import logging
import os
from typing import Optional

import httpx

logger = logging.getLogger("wisdomkernel.transcription")

ALLOWED_EXTENSIONS = {".mp3", ".mp4", ".mpeg", ".mpga", ".m4a", ".wav", ".webm", ".ogg", ".flac"}
MAX_UPLOAD_BYTES = int(os.getenv("MAX_UPLOAD_MB", "25")) * 1024 * 1024
REQUEST_TIMEOUT = float(os.getenv("AI_TIMEOUT_SECONDS", "60"))

# Offered on the Record page as something the user can paste when no
# speech-to-text provider is configured. It is a SAMPLE SCRIPT to read or
# paste by choice -- it is never returned as if it were their audio.
SAMPLE_SCRIPT = (
    "So the problem was that a 220 kV transformer kept tripping on differential "
    "protection, roughly twice a week, and always during the evening load peak after "
    "heavy rain. For about three weeks we assumed the winding was failing, and we even "
    "scheduled an oil test and a dissolved gas analysis, which was expensive and turned "
    "out to be completely unnecessary. What made me change my mind was that a real "
    "internal fault does not wait for the rain. So I decided to instrument the CT "
    "secondary circuits in the marshalling kiosk before touching the transformer at all. "
    "What we found was a cracked cable gland letting water into the box, and that was "
    "intermittently shorting one CT secondary, which unbalanced the differential relay. "
    "We replaced the gland and re-sealed the kiosk and the trips stopped completely, and "
    "we cancelled the planned outage. The lesson for me is that when a trip correlates "
    "with weather or with a time of day, you should suspect the secondary wiring and the "
    "enclosures long before you suspect the primary plant. I really wish somebody had "
    "told me on day one to just plot the trip timestamps against the rainfall and the "
    "load curve. That one graph would have saved us three weeks."
)


class TranscriptionError(Exception):
    """Raised for input problems the caller should report as a 4xx."""


class SpeechToTextUnavailable(Exception):
    """
    Raised when no transcript can be produced: either no provider is
    configured, or the configured provider failed. Never fall back to
    invented text.
    """

    def __init__(self, message: str, configured: bool):
        super().__init__(message)
        self.configured = configured


def _api_key() -> Optional[str]:
    key = os.getenv("AI_API_KEY") or os.getenv("OPENAI_API_KEY")
    return key.strip() if key and key.strip() else None


def _base_url() -> str:
    return (os.getenv("AI_BASE_URL") or "https://api.openai.com/v1").rstrip("/")


def is_configured() -> bool:
    """True when a real speech-to-text service can be called."""
    return _api_key() is not None


def validate_upload(filename: str, size_bytes: int) -> str:
    """
    Validate an uploaded audio file. Returns the lowercase extension.
    Raises TranscriptionError with a human-readable message on failure.
    """
    if not filename:
        raise TranscriptionError("No filename was provided with the upload.")

    ext = os.path.splitext(filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        allowed = ", ".join(sorted(ALLOWED_EXTENSIONS))
        raise TranscriptionError(
            f"Unsupported audio format '{ext or 'unknown'}'. Supported formats: {allowed}."
        )

    if size_bytes <= 0:
        raise TranscriptionError("The uploaded audio file is empty.")

    if size_bytes > MAX_UPLOAD_BYTES:
        raise TranscriptionError(
            f"Audio file is too large ({size_bytes / 1_048_576:.1f} MB). "
            f"Maximum allowed is {MAX_UPLOAD_BYTES // 1_048_576} MB."
        )
    return ext


def transcribe(file_path: str, filename: str) -> dict:
    """
    Transcribe a saved audio file.

    Returns {"transcript": str, "mode": "ai"}.
    Raises SpeechToTextUnavailable when no transcript can be produced.
    """
    if not is_configured():
        logger.warning("Transcription requested but no AI_API_KEY is configured.")
        raise SpeechToTextUnavailable(
            "Speech-to-text provider not configured. Set AI_API_KEY in the backend "
            ".env file to transcribe audio, or paste a transcript instead.",
            configured=False,
        )

    url = f"{_base_url()}/audio/transcriptions"
    model = os.getenv("STT_MODEL", "whisper-1")

    try:
        with open(file_path, "rb") as handle:
            files = {"file": (filename, handle, "application/octet-stream")}
            data = {"model": model, "response_format": "json"}
            response = httpx.post(
                url,
                headers={"Authorization": f"Bearer {_api_key()}"},
                files=files,
                data=data,
                timeout=REQUEST_TIMEOUT,
            )
        response.raise_for_status()
        transcript = (response.json().get("text") or "").strip()

        if not transcript:
            raise SpeechToTextUnavailable(
                "The speech-to-text service returned an empty transcript. The "
                "recording may contain no audible speech.",
                configured=True,
            )

        return {"transcript": transcript, "mode": "ai"}

    except SpeechToTextUnavailable:
        raise
    except Exception as exc:  # noqa: BLE001
        logger.error("Transcription failed (%s): %s", type(exc).__name__, exc)
        raise SpeechToTextUnavailable(
            "The speech-to-text service could not be reached "
            f"({type(exc).__name__}). Check AI_BASE_URL and your network, or "
            "paste a transcript instead.",
            configured=True,
        ) from exc
