"""
groq_voice_service.py
---------------------
Service layer for Groq AI Voice Note Structuring pipeline.

Stage 1: Whisper speech-to-text transcription via `whisper-large-v3-turbo`
Stage 2: Structuring transcript into actionable JSON data via `llama-3.3-70b-versatile`
         with JSON mode (response_format={"type": "json_object"}).
"""

from __future__ import annotations

import json
import logging
import os
import re
from typing import Any, Optional

import httpx

logger = logging.getLogger("wisdomkernel.groq_voice")

ALLOWED_EXTENSIONS = {".webm", ".wav", ".mp3", ".mp4", ".m4a", ".ogg", ".flac", ".mpeg"}
MAX_UPLOAD_BYTES = int(os.getenv("MAX_UPLOAD_MB", "25")) * 1024 * 1024
REQUEST_TIMEOUT = float(os.getenv("AI_TIMEOUT_SECONDS", "60"))


class VoiceNoteValidationError(Exception):
    """Raised for bad user upload input (400 Bad Request)."""
    pass


class GroqServiceError(Exception):
    """Raised when Groq API calls fail or return error statuses (500/503)."""
    pass


def _get_api_key() -> str:
    key = os.getenv("GROQ_API_KEY") or os.getenv("AI_API_KEY")
    if not key or not key.strip():
        raise GroqServiceError(
            "Groq API key is not configured on the backend server. "
            "Please set GROQ_API_KEY in backend environment variables."
        )
    return key.strip()


def _get_base_url() -> str:
    url = os.getenv("GROQ_BASE_URL") or "https://api.groq.com/openai/v1"
    return url.rstrip("/")


def _get_stt_model() -> str:
    return os.getenv("GROQ_STT_MODEL", "whisper-large-v3-turbo")


def _get_llm_model() -> str:
    return os.getenv("GROQ_LLM_MODEL", "llama-3.3-70b-versatile")


def validate_upload(filename: str, size_bytes: int) -> str:
    """Validate uploaded audio file format and size."""
    if not filename:
        raise VoiceNoteValidationError("No audio file was uploaded.")

    ext = os.path.splitext(filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        allowed = ", ".join(sorted(ALLOWED_EXTENSIONS))
        raise VoiceNoteValidationError(
            f"Unsupported audio format '{ext or 'unknown'}'. Supported formats: {allowed}."
        )

    if size_bytes <= 0:
        raise VoiceNoteValidationError("The uploaded audio file is empty (0 bytes).")

    if size_bytes > MAX_UPLOAD_BYTES:
        max_mb = MAX_UPLOAD_BYTES // (1024 * 1024)
        size_mb = size_bytes / (1024 * 1024)
        raise VoiceNoteValidationError(
            f"Audio file is too large ({size_mb:.1f} MB). Maximum allowed limit is {max_mb} MB."
        )

    return ext


def transcribe_audio(file_path: str, filename: str) -> str:
    """
    Stage 1: Transcribe audio using Groq Whisper model (whisper-large-v3-turbo).
    """
    api_key = _get_api_key()
    base_url = _get_base_url()
    stt_model = _get_stt_model()

    url = f"{base_url}/audio/transcriptions"
    logger.info("Calling Groq Whisper STT (%s) for file %s", stt_model, filename)

    try:
        with open(file_path, "rb") as audio_file:
            files = {"file": (filename, audio_file, "application/octet-stream")}
            data = {
                "model": stt_model,
                "response_format": "json",
                "temperature": 0.0,
            }
            headers = {"Authorization": f"Bearer {api_key}"}

            response = httpx.post(
                url,
                headers=headers,
                files=files,
                data=data,
                timeout=REQUEST_TIMEOUT,
            )

        if response.status_code == 429:
            raise GroqServiceError("Groq API rate limit exceeded. Please wait a moment and try again.")
        elif response.status_code != 200:
            err_msg = response.text
            try:
                err_json = response.json()
                if "error" in err_json:
                    err_msg = err_json["error"].get("message", err_msg)
            except Exception:
                pass
            raise GroqServiceError(f"Groq Whisper STT error ({response.status_code}): {err_msg}")

        result = response.json()
        transcript = (result.get("text") or "").strip()

        if not transcript:
            raise VoiceNoteValidationError(
                "The speech-to-text service produced an empty transcript. "
                "The audio recording may contain no audible speech."
            )

        return transcript

    except httpx.TimeoutException:
        raise GroqServiceError("Groq speech-to-text request timed out after 60 seconds. Please try a shorter audio clip.")
    except httpx.RequestError as exc:
        raise GroqServiceError(f"Network error reaching Groq API: {type(exc).__name__}")
    except (VoiceNoteValidationError, GroqServiceError):
        raise
    except Exception as exc:
        logger.exception("Unexpected error in Groq STT transcription: %s", exc)
        raise GroqServiceError(f"Speech transcription failed: {str(exc)}")


SYSTEM_STRUCTURING_PROMPT = """You are an expert AI voice note analyzer. Your task is to process a raw transcript recorded by a user and structure it into clean, actionable, high-value data.

You MUST respond with a single, raw valid JSON object. Do not include markdown code fences or conversational prose.

Required JSON Schema:
{
  "title": "Concise, descriptive title summarizing the voice note (max 8-10 words)",
  "category": "Work | Personal | Project | Meeting | Idea",
  "summary": "1 to 2 sentence executive summary of the voice note",
  "key_points": [
    "Key takeaway point 1",
    "Key takeaway point 2"
  ],
  "action_items": [
    {
      "task": "Actionable task description starting with an action verb",
      "owner": "Person name or team mentioned in note, or null if unassigned",
      "priority": "High | Medium | Low",
      "deadline": "Specific date/time string mentioned, or null if omitted"
    }
  ]
}

Rules:
1. "category" MUST be exactly one of: "Work", "Personal", "Project", "Meeting", "Idea". Pick the single best match.
2. "priority" for action items MUST be exactly one of: "High", "Medium", "Low".
3. Extract ALL key takeaways mentioned in the note.
4. Extract ALL actionable tasks mentioned or implied in the note as items in "action_items".
5. If no specific action items exist, return an empty array `[]` for "action_items".
6. Keep summary concise, professional, and directly grounded in what was said.
"""


def structure_transcript(transcript: str) -> dict[str, Any]:
    """
    Stage 2: Structure transcript into JSON data using Groq LLM in JSON mode.
    Tries primary configured model first (e.g. llama-3.3-70b-versatile), falling back
    to available models (e.g. openai/gpt-oss-120b, qwen/qwen3.6-27b) if needed.
    """
    api_key = _get_api_key()
    base_url = _get_base_url()
    primary_model = _get_llm_model()

    candidate_models = [primary_model, "openai/gpt-oss-120b", "qwen/qwen3.6-27b", "groq/compound-mini"]
    # De-duplicate while preserving order
    seen = set()
    models = [m for m in candidate_models if m and not (m in seen or seen.add(m))]

    url = f"{base_url}/chat/completions"
    last_error = None

    for model in models:
        logger.info("Calling Groq LLM Structuring with model '%s'", model)
        payload = {
            "model": model,
            "temperature": 0.1,
            "response_format": {"type": "json_object"},
            "messages": [
                {"role": "system", "content": SYSTEM_STRUCTURING_PROMPT},
                {"role": "user", "content": f"TRANSCRIPT TO STRUCTURE:\n\"\"\"\n{transcript}\n\"\"\""},
            ],
        }

        try:
            response = httpx.post(
                url,
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json=payload,
                timeout=REQUEST_TIMEOUT,
            )

            if response.status_code == 404:
                logger.warning("Groq model '%s' returned 404, trying next candidate...", model)
                last_error = f"Model '{model}' not available (404)"
                continue

            if response.status_code == 429:
                raise GroqServiceError("Groq API rate limit exceeded during structuring. Please try again.")
            elif response.status_code != 200:
                err_msg = response.text
                try:
                    err_json = response.json()
                    if "error" in err_json:
                        err_msg = err_json["error"].get("message", err_msg)
                except Exception:
                    pass
                raise GroqServiceError(f"Groq LLM Structuring error ({response.status_code}): {err_msg}")

            res_json = response.json()
            content = res_json["choices"][0]["message"]["content"]

            parsed = _clean_and_parse_json(content)
            return _normalize_voice_note_schema(parsed)

        except (httpx.TimeoutException, httpx.RequestError) as exc:
            logger.warning("Network issue calling model '%s': %s", model, exc)
            last_error = str(exc)
            continue
        except GroqServiceError:
            raise
        except Exception as exc:
            logger.exception("Unexpected error in Groq LLM structuring with model '%s': %s", model, exc)
            last_error = str(exc)
            continue

    raise GroqServiceError(f"Voice note structuring failed across models. Last error: {last_error}")


def _clean_and_parse_json(content: str) -> dict[str, Any]:
    """Parse JSON output tolerate markdown code blocks."""
    if not content:
        raise GroqServiceError("Groq LLM returned an empty response.")

    text = content.strip()
    text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.MULTILINE)
    text = re.sub(r"\s*```$", "", text, flags=re.MULTILINE)

    try:
        data = json.loads(text)
        if isinstance(data, dict):
            return data
    except json.JSONDecodeError:
        pass

    match = re.search(r"\{.*\}", text, re.DOTALL)
    if match:
        try:
            data = json.loads(match.group(0))
            if isinstance(data, dict):
                return data
        except json.JSONDecodeError:
            pass

    raise GroqServiceError("Groq LLM failed to return a valid structured JSON object.")


def _normalize_voice_note_schema(raw: dict[str, Any]) -> dict[str, Any]:
    """Coerce and sanitize fields into the exact required schema."""
    title = str(raw.get("title") or "Voice Note Summary").strip()

    valid_categories = {"Work", "Personal", "Project", "Meeting", "Idea"}
    category_raw = str(raw.get("category") or "Work").strip().title()
    category = category_raw if category_raw in valid_categories else "Work"

    summary = str(raw.get("summary") or "").strip()

    key_points_raw = raw.get("key_points") or []
    if isinstance(key_points_raw, str):
        key_points = [k.strip() for k in key_points_raw.split("\n") if k.strip()]
    elif isinstance(key_points_raw, list):
        key_points = [str(k).strip() for k in key_points_raw if str(k).strip()]
    else:
        key_points = []

    action_items_raw = raw.get("action_items") or []
    action_items = []
    if isinstance(action_items_raw, list):
        for item in action_items_raw:
            if not isinstance(item, dict):
                continue
            task = str(item.get("task") or "").strip()
            if not task:
                continue

            owner = item.get("owner")
            if owner is not None:
                owner = str(owner).strip()
                if owner.lower() in {"null", "none", "unassigned", ""}:
                    owner = None

            priority_raw = str(item.get("priority") or "Medium").strip().title()
            priority = priority_raw if priority_raw in {"High", "Medium", "Low"} else "Medium"

            deadline = item.get("deadline")
            if deadline is not None:
                deadline = str(deadline).strip()
                if deadline.lower() in {"null", "none", "n/a", ""}:
                    deadline = None

            action_items.append({
                "task": task,
                "owner": owner,
                "priority": priority,
                "deadline": deadline,
            })

    return {
        "title": title,
        "category": category,
        "summary": summary,
        "key_points": key_points,
        "action_items": action_items,
    }


def process_voice_note(file_path: str, filename: str) -> dict[str, Any]:
    """Full 2-stage execution: transcribe audio and structure into JSON data."""
    transcript = transcribe_audio(file_path, filename)
    structured_data = structure_transcript(transcript)
    return {
        "transcript": transcript,
        "data": structured_data,
        "filename": filename,
    }
