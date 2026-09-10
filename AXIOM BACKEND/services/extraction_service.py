"""
extraction_service.py
---------------------
Converts a raw transcript into the WisdomKernel structured experience schema.

The whole point of WisdomKernel is to PRESERVE what a human actually said, not
to generate plausible-sounding expertise. Two safeguards enforce that:

1. The system prompt forbids invention and requires null for absent fields.
2. The offline fallback extractor never writes a sentence of its own -- it only
   routes sentences that are literally present in the transcript into fields,
   and returns null for anything it cannot find.

Every response carries an `extraction_mode` so the caller can tell whether an
LLM or the deterministic fallback produced it.
"""

from __future__ import annotations

import json
import logging
import os
import re
from typing import Optional

import httpx

logger = logging.getLogger("wisdomkernel.extraction")

REQUEST_TIMEOUT = float(os.getenv("AI_TIMEOUT_SECONDS", "60"))

# The canonical structured-experience fields, in display order.
EXPERIENCE_FIELDS = [
    "problem",
    "context",
    "decision",
    "reasoning",
    "mistake",
    "root_cause",
    "outcome",
    "lesson",
    "what_i_wish_i_knew",
]

SYSTEM_PROMPT = """You are a careful knowledge-extraction assistant for WisdomKernel, \
a platform that preserves the real experience of senior engineers.

Your only job is to reorganise what the speaker actually said into fixed fields.

ABSOLUTE RULES:
1. Do NOT invent, infer beyond the text, embellish, or add facts that are not in the transcript.
2. Only extract information that is explicitly present in the transcript.
3. If a field is not covered in the transcript, return null for that field. Never guess.
4. Preserve the expert's meaning, terminology, numbers and units exactly.
5. Do NOT convert the account into generic best-practice advice. If the speaker did not
   say it, it does not belong in the output.
6. Light editing for readability is allowed (removing filler words, fixing grammar).
   Rewriting the substance is not.

Return ONLY a JSON object with exactly these keys, each a string or null:
problem, context, decision, reasoning, mistake, root_cause, outcome, lesson, what_i_wish_i_knew

Field meanings:
- problem: the situation or failure the speaker faced
- context: system, environment, timeframe, constraints
- decision: what the speaker chose to do
- reasoning: why they chose it, in their own logic
- mistake: what was done wrong or an assumption that proved false
- root_cause: the underlying technical cause finally identified
- outcome: what happened as a result
- lesson: the transferable lesson the speaker states
- what_i_wish_i_knew: what the speaker says they wish they had known earlier

Output raw JSON only. No markdown fences, no commentary."""


def _api_key() -> Optional[str]:
    key = os.getenv("AI_API_KEY") or os.getenv("OPENAI_API_KEY")
    return key.strip() if key and key.strip() else None


def _base_url() -> str:
    return (os.getenv("AI_BASE_URL") or "https://api.openai.com/v1").rstrip("/")


def is_configured() -> bool:
    return _api_key() is not None


def _empty_experience() -> dict:
    return {field: None for field in EXPERIENCE_FIELDS}


def _normalise(raw: dict) -> dict:
    """Coerce an LLM object into exactly our schema, dropping extra keys."""
    result = _empty_experience()
    for field in EXPERIENCE_FIELDS:
        value = raw.get(field)
        if value is None:
            continue
        if isinstance(value, (list, tuple)):
            value = " ".join(str(v) for v in value)
        text = str(value).strip()
        # Treat the model saying "null"/"n/a"/"" as a genuine absence.
        if text.lower() in {"", "null", "none", "n/a", "na", "not mentioned", "unknown"}:
            continue
        result[field] = text
    return result


def _parse_json_block(content: str) -> Optional[dict]:
    """Parse the model's reply, tolerating markdown fences or surrounding prose."""
    if not content:
        return None
    text = content.strip()
    text = re.sub(r"^```(?:json)?\s*", "", text)
    text = re.sub(r"\s*```$", "", text)
    try:
        parsed = json.loads(text)
        return parsed if isinstance(parsed, dict) else None
    except json.JSONDecodeError:
        pass
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if match:
        try:
            parsed = json.loads(match.group(0))
            return parsed if isinstance(parsed, dict) else None
        except json.JSONDecodeError:
            return None
    return None


# ---------------------------------------------------------------------------
# Deterministic offline fallback
# ---------------------------------------------------------------------------

# Cue phrases -> field. Ordered so more specific cues win.
# Cue phrases mapped to fields. Matching is by SPECIFICITY, not by list order:
# for each sentence every cue is tested, and the longest matching phrase wins.
# That stops a short generic cue from stealing a sentence that a precise cue
# also matches -- e.g. "always " must never outrank "the problem was".
#
# Cues are therefore deliberately phrase-like. Single common words such as
# "always", "never", "problem" or "failed" are not cues, because they appear
# everywhere and produce confident nonsense.
_CUES: list[tuple[str, str]] = [
    # (cue phrase, field)
    ("the problem was", "problem"),
    ("the issue was", "problem"),
    ("the problem is", "problem"),
    ("we had a problem", "problem"),
    ("what happened was", "problem"),
    ("the symptom was", "problem"),
    ("kept tripping", "problem"),
    ("kept failing", "problem"),
    ("started failing", "problem"),
    ("we were seeing", "problem"),

    ("at the time", "context"),
    ("the system was", "context"),
    ("we were running", "context"),
    ("the setup was", "context"),
    ("the site was", "context"),
    ("the environment was", "context"),
    ("commissioned in", "context"),
    ("back then", "context"),

    ("so i decided", "decision"),
    ("so we decided", "decision"),
    ("i decided", "decision"),
    ("we decided", "decision"),
    ("what i did was", "decision"),
    ("our decision was", "decision"),
    ("we chose", "decision"),
    ("we opted", "decision"),
    ("we went with", "decision"),
    ("instead of", "decision"),

    ("made me change my mind", "reasoning"),
    ("my reasoning was", "reasoning"),
    ("the logic was", "reasoning"),
    ("the reason was", "reasoning"),
    ("does not wait", "reasoning"),
    ("which told me", "reasoning"),
    ("that meant", "reasoning"),
    ("because", "reasoning"),

    ("turned out to be completely unnecessary", "mistake"),
    ("the mistake was", "mistake"),
    ("we were wrong", "mistake"),
    ("we assumed", "mistake"),
    ("i assumed", "mistake"),
    ("we should have", "mistake"),
    ("we wasted", "mistake"),
    ("we blamed", "mistake"),

    ("what we found was", "root_cause"),
    ("the root cause", "root_cause"),
    ("the actual cause", "root_cause"),
    ("the real cause", "root_cause"),
    ("it turned out that", "root_cause"),
    ("was caused by", "root_cause"),
    ("the cause was", "root_cause"),

    ("stopped completely", "outcome"),
    ("the result was", "outcome"),
    ("as a result", "outcome"),
    ("the outcome was", "outcome"),
    ("we cancelled", "outcome"),
    ("in the end", "outcome"),
    ("ended up", "outcome"),
    ("after that", "outcome"),

    ("the lesson for me", "lesson"),
    ("you should suspect", "lesson"),
    ("what i learned", "lesson"),
    ("the takeaway", "lesson"),
    ("the lesson", "lesson"),
    ("the rule is", "lesson"),
    ("if you ever", "lesson"),

    ("if only i had known", "what_i_wish_i_knew"),
    ("wish somebody", "what_i_wish_i_knew"),
    ("wish someone", "what_i_wish_i_knew"),
    ("nobody told me", "what_i_wish_i_knew"),
    ("i wish", "what_i_wish_i_knew"),
    ("wish i", "what_i_wish_i_knew"),
]

_SENTENCE_SPLIT = re.compile(r"(?<=[.!?])\s+")


def fallback_extract(transcript: str) -> dict:
    """
    Deterministic, offline extraction.

    Routes sentences that literally appear in the transcript into fields.
    For each sentence, every cue is tested and the LONGEST matching phrase
    decides the field, so a precise cue always beats a generic one. A field
    keeps its first assignment, and any field with no match stays null.

    It never authors new content: a field is either a verbatim sentence from
    the transcript or null.
    """
    experience = _empty_experience()
    if not transcript or not transcript.strip():
        return experience

    sentences = [s.strip() for s in _SENTENCE_SPLIT.split(transcript.strip()) if s.strip()]
    if not sentences:
        return experience

    used: set[int] = set()

    for index, sentence in enumerate(sentences):
        lowered = sentence.lower()

        best_field = None
        best_length = 0
        for cue, field in _CUES:
            if cue in lowered and len(cue) > best_length:
                best_field, best_length = field, len(cue)

        if best_field and experience[best_field] is None:
            experience[best_field] = sentence
            used.add(index)

    # If the problem was never stated with a cue phrase, the opening sentence
    # is the best available stand-in -- still verbatim, still not invented.
    if experience["problem"] is None:
        for index, sentence in enumerate(sentences):
            if index not in used:
                experience["problem"] = sentence
                break

    return experience


# ---------------------------------------------------------------------------
# Public entry point
# ---------------------------------------------------------------------------

def extract_experience(transcript: str) -> dict:
    """
    Extract structured knowledge from a transcript.

    Returns:
      {
        "experience": {<the nine fields>},
        "extraction_mode": "ai" | "rule_based_fallback",
        "notice": str | None
      }
    """
    if not transcript or not transcript.strip():
        return {
            "experience": _empty_experience(),
            "extraction_mode": "rule_based_fallback",
            "notice": "The transcript was empty, so no fields could be extracted.",
        }

    if not is_configured():
        logger.warning("No AI_API_KEY configured -- using rule-based extraction.")
        return {
            "experience": fallback_extract(transcript),
            "extraction_mode": "rule_based_fallback",
            "notice": (
                "No LLM API key is configured. Fields were filled using a deterministic "
                "rule-based extractor that copies sentences verbatim from the transcript."
            ),
        }

    model = os.getenv("LLM_MODEL", "gpt-4o-mini")
    try:
        response = httpx.post(
            f"{_base_url()}/chat/completions",
            headers={
                "Authorization": f"Bearer {_api_key()}",
                "Content-Type": "application/json",
            },
            json={
                "model": model,
                "temperature": 0,
                "messages": [
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": f"TRANSCRIPT:\n\"\"\"\n{transcript}\n\"\"\""},
                ],
            },
            timeout=REQUEST_TIMEOUT,
        )
        response.raise_for_status()
        content = response.json()["choices"][0]["message"]["content"]

        parsed = _parse_json_block(content)
        if parsed is None:
            raise ValueError("The model did not return parsable JSON.")

        return {
            "experience": _normalise(parsed),
            "extraction_mode": "ai",
            "notice": None,
        }

    except Exception as exc:  # noqa: BLE001 - degrade, never crash the demo
        logger.error("LLM extraction failed (%s): %s", type(exc).__name__, exc)
        return {
            "experience": fallback_extract(transcript),
            "extraction_mode": "rule_based_fallback",
            "notice": (
                "The extraction service could not be reached, so a deterministic "
                "rule-based extractor was used instead. Reason: "
                f"{type(exc).__name__}."
            ),
        }
