"""
search_service.py
-----------------
Ranked retrieval over the structured experience corpus.

Two ranking paths:

  1. EMBEDDINGS (optional) -- when USE_EMBEDDINGS=true and an API key exists,
     documents and the query are embedded and compared with cosine similarity.
     Document vectors are computed once and cached in memory.

  2. KEYWORD (always available) -- a deterministic IDF-weighted overlap score
     with field boosts and a phrase bonus. No network, no model, no surprises.

The keyword path is the default and the guaranteed fallback, so a demo can
never break because an external AI service is down. Filters are applied before
ranking, and every result carries a relevance score plus the field the match
came from, so the ranking is explainable to a judge.
"""

from __future__ import annotations

import logging
import math
import os
import re
import threading
from typing import Optional

import numpy as np

from utils import data_loader

logger = logging.getLogger("wisdomkernel.search")

REQUEST_TIMEOUT = float(os.getenv("AI_TIMEOUT_SECONDS", "60"))

# Fields searched, with the weight each contributes to the keyword score.
FIELD_WEIGHTS = {
    "title": 3.0,
    "problem": 2.5,
    "lesson": 2.0,
    "what_i_wish_i_knew": 1.5,
    "tags": 2.0,
    "decision": 1.5,
    "root_cause": 1.5,
    "mistake": 1.2,
    "reasoning": 1.0,
    "context": 1.0,
    "outcome": 1.0,
    "domain": 1.5,
    "expertise": 1.5,
}

STOPWORDS = {
    "a", "an", "and", "are", "as", "at", "be", "but", "by", "can", "did", "do", "does",
    "for", "from", "had", "has", "have", "how", "i", "if", "in", "is", "it", "its",
    "me", "my", "of", "on", "or", "our", "should", "so", "than", "that", "the", "their",
    "then", "there", "these", "they", "this", "to", "was", "we", "were", "what", "when",
    "where", "which", "who", "why", "will", "with", "you", "your",
}

_TOKEN_RE = re.compile(r"[a-z0-9]+")

_index_lock = threading.Lock()
_keyword_index: Optional[dict] = None
_embedding_cache: Optional[dict] = None


# ---------------------------------------------------------------------------
# Tokenisation and index construction
# ---------------------------------------------------------------------------

def tokenize(text: str) -> list[str]:
    if not text:
        return []
    return [t for t in _TOKEN_RE.findall(str(text).lower()) if t not in STOPWORDS and len(t) > 1]


def _field_text(experience: dict, field: str) -> str:
    value = experience.get(field)
    if isinstance(value, (list, tuple)):
        return " ".join(str(v) for v in value)
    return str(value) if value is not None else ""


def _document_text(experience: dict) -> str:
    return " ".join(_field_text(experience, field) for field in FIELD_WEIGHTS)


def _build_keyword_index() -> dict:
    """Precompute per-document field token sets and corpus IDF values."""
    experiences = data_loader.get_experiences()
    docs = []
    doc_freq: dict[str, int] = {}

    for experience in experiences:
        field_tokens = {
            field: tokenize(_field_text(experience, field)) for field in FIELD_WEIGHTS
        }
        all_tokens = {tok for tokens in field_tokens.values() for tok in tokens}
        for token in all_tokens:
            doc_freq[token] = doc_freq.get(token, 0) + 1
        docs.append(
            {
                "id": experience.get("id"),
                "field_tokens": field_tokens,
                "all_tokens": all_tokens,
                "text_lower": _document_text(experience).lower(),
            }
        )

    total = max(len(docs), 1)
    idf = {
        token: math.log((total + 1) / (freq + 0.5)) + 1.0
        for token, freq in doc_freq.items()
    }
    return {"docs": {d["id"]: d for d in docs}, "idf": idf, "total": total}


def get_keyword_index() -> dict:
    global _keyword_index
    with _index_lock:
        if _keyword_index is None:
            _keyword_index = _build_keyword_index()
        return _keyword_index


def reset_index() -> None:
    """Drop cached indexes (used on startup and by tests)."""
    global _keyword_index, _embedding_cache
    with _index_lock:
        _keyword_index = None
        _embedding_cache = None


# ---------------------------------------------------------------------------
# Keyword ranking
# ---------------------------------------------------------------------------

def keyword_score(query: str, experience: dict) -> tuple[float, list[str]]:
    """
    Score one experience against the query.

    Returns (relevance in 0..1, matched tokens). Relevance is the share of the
    query's IDF mass that the document matches, boosted by which fields hit and
    by an exact phrase match.
    """
    query_tokens = tokenize(query)
    if not query_tokens:
        return 0.0, []

    index = get_keyword_index()
    idf = index["idf"]
    doc = index["docs"].get(experience.get("id"))
    if doc is None:
        # Experience outside the cached index (e.g. after a data reload).
        field_tokens = {f: tokenize(_field_text(experience, f)) for f in FIELD_WEIGHTS}
        doc = {
            "field_tokens": field_tokens,
            "all_tokens": {t for ts in field_tokens.values() for t in ts},
            "text_lower": _document_text(experience).lower(),
        }

    # Unseen query words are still informative: give them the max observed IDF.
    default_idf = max(idf.values(), default=1.0)
    total_mass = sum(idf.get(token, default_idf) for token in set(query_tokens))
    if total_mass <= 0:
        return 0.0, []

    earned = 0.0
    matched: list[str] = []

    for token in set(query_tokens):
        if token not in doc["all_tokens"]:
            continue
        matched.append(token)
        weight = max(
            (FIELD_WEIGHTS[field] for field, tokens in doc["field_tokens"].items() if token in tokens),
            default=1.0,
        )
        # Field weight scaled into a modest 1.0-1.6 multiplier.
        boost = 1.0 + (weight - 1.0) * 0.3
        earned += idf.get(token, default_idf) * boost

    if not matched:
        return 0.0, []

    phrase = " ".join(query_tokens)
    if len(query_tokens) > 1 and phrase in doc["text_lower"]:
        earned *= 1.25

    return min(earned / total_mass, 1.0), sorted(matched)


# ---------------------------------------------------------------------------
# Optional embedding ranking
# ---------------------------------------------------------------------------

def _embeddings_enabled() -> bool:
    flag = (os.getenv("USE_EMBEDDINGS", "false") or "").strip().lower() in {"1", "true", "yes"}
    key = os.getenv("AI_API_KEY") or os.getenv("OPENAI_API_KEY")
    return flag and bool(key and key.strip())


def _embed(texts: list[str]) -> Optional[np.ndarray]:
    """Call an OpenAI-compatible embeddings endpoint. Returns None on failure."""
    try:
        import httpx

        base = (os.getenv("AI_BASE_URL") or "https://api.openai.com/v1").rstrip("/")
        key = os.getenv("AI_API_KEY") or os.getenv("OPENAI_API_KEY")
        model = os.getenv("EMBEDDING_MODEL", "text-embedding-3-small")

        response = httpx.post(
            f"{base}/embeddings",
            headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
            json={"model": model, "input": texts},
            timeout=REQUEST_TIMEOUT,
        )
        response.raise_for_status()
        vectors = [item["embedding"] for item in response.json()["data"]]
        return np.array(vectors, dtype=np.float32)
    except Exception as exc:  # noqa: BLE001
        logger.error("Embedding request failed (%s): %s", type(exc).__name__, exc)
        return None


def _document_embeddings() -> Optional[dict]:
    global _embedding_cache
    with _index_lock:
        if _embedding_cache is not None:
            return _embedding_cache

    experiences = data_loader.get_experiences()
    if not experiences:
        return None

    matrix = _embed([_document_text(e) for e in experiences])
    if matrix is None:
        return None

    norms = np.linalg.norm(matrix, axis=1, keepdims=True)
    norms[norms == 0] = 1.0
    cache = {"ids": [e.get("id") for e in experiences], "matrix": matrix / norms}

    with _index_lock:
        _embedding_cache = cache
    return cache


def embedding_scores(query: str) -> Optional[dict[str, float]]:
    """experience_id -> cosine similarity, or None when unavailable."""
    if not _embeddings_enabled() or not query.strip():
        return None

    cache = _document_embeddings()
    if cache is None:
        return None

    query_vector = _embed([query])
    if query_vector is None:
        return None

    vector = query_vector[0]
    norm = float(np.linalg.norm(vector)) or 1.0
    similarities = cache["matrix"] @ (vector / norm)
    # Map cosine [-1, 1] onto [0, 1] so it is comparable with keyword relevance.
    similarities = (similarities + 1.0) / 2.0
    return {doc_id: float(score) for doc_id, score in zip(cache["ids"], similarities)}


# ---------------------------------------------------------------------------
# Filtering
# ---------------------------------------------------------------------------

def _matches_text_filter(value, wanted: Optional[str]) -> bool:
    if not wanted:
        return True
    needle = wanted.strip().lower()
    if isinstance(value, (list, tuple)):
        return any(needle in str(v).lower() for v in value)
    return needle in str(value or "").lower()


def apply_filters(
    rows: list[dict],
    engineering_type: Optional[str] = None,
    company: Optional[str] = None,
    domain: Optional[str] = None,
    expertise: Optional[str] = None,
    years_min: Optional[int] = None,
    years_max: Optional[int] = None,
) -> list[dict]:
    """Filter joined experience+engineer rows. All filters are optional."""
    result = []
    for row in rows:
        engineer = row["engineer"]
        experience = row["experience"]

        if not _matches_text_filter(engineer.get("engineering_type"), engineering_type):
            continue
        if not _matches_text_filter(engineer.get("company"), company):
            continue
        if not (
            _matches_text_filter(experience.get("domain"), domain)
            or _matches_text_filter(engineer.get("domain"), domain)
        ):
            continue
        if not (
            _matches_text_filter(experience.get("expertise"), expertise)
            or _matches_text_filter(engineer.get("expertise"), expertise)
        ):
            continue

        years = engineer.get("years_experience")
        if years_min is not None and (years is None or years < years_min):
            continue
        if years_max is not None and (years is None or years > years_max):
            continue

        result.append(row)
    return result


# ---------------------------------------------------------------------------
# Public search entry point
# ---------------------------------------------------------------------------

def _join_rows() -> list[dict]:
    engineers = data_loader.get_engineer_map()
    rows = []
    for experience in data_loader.get_experiences():
        engineer = engineers.get(experience.get("engineer_id"), {})
        rows.append({"experience": experience, "engineer": engineer})
    return rows


def _format_result(row: dict, relevance: float, matched: list[str], method: str) -> dict:
    experience = row["experience"]
    engineer = row["engineer"]
    return {
        "id": experience.get("id"),
        "title": experience.get("title"),
        "contributor_name": engineer.get("name", "Unknown contributor"),
        "years_experience": engineer.get("years_experience"),
        "company": engineer.get("company"),
        "engineering_type": engineer.get("engineering_type"),
        "domain": experience.get("domain") or engineer.get("domain"),
        "expertise": experience.get("expertise"),
        "problem": experience.get("problem"),
        "decision": experience.get("decision"),
        "lesson": experience.get("lesson"),
        "root_cause": experience.get("root_cause"),
        "what_i_wish_i_knew": experience.get("what_i_wish_i_knew"),
        "year": experience.get("year"),
        "source": experience.get("source"),
        "relevance": round(float(relevance), 4),
        "matched_terms": matched,
        "ranking_method": method,
        "is_demo": experience.get("is_demo", True),
    }


def search(
    query: Optional[str] = None,
    engineering_type: Optional[str] = None,
    company: Optional[str] = None,
    domain: Optional[str] = None,
    expertise: Optional[str] = None,
    years_min: Optional[int] = None,
    years_max: Optional[int] = None,
    limit: int = 10,
    min_relevance: float = 0.05,
) -> dict:
    """
    Filter, rank and return experiences.

    Returns {"results": [...], "count": int, "ranking_method": str,
             "filters_applied": {...}, "message": str|None}
    """
    rows = apply_filters(
        _join_rows(),
        engineering_type=engineering_type,
        company=company,
        domain=domain,
        expertise=expertise,
        years_min=years_min,
        years_max=years_max,
    )

    filters_applied = {
        k: v
        for k, v in {
            "engineering_type": engineering_type,
            "company": company,
            "domain": domain,
            "expertise": expertise,
            "years_min": years_min,
            "years_max": years_max,
        }.items()
        if v is not None and v != ""
    }

    # No query: this is a browse request, so order by seniority then recency.
    if not query or not query.strip():
        rows.sort(
            key=lambda r: (
                r["engineer"].get("years_experience") or 0,
                r["experience"].get("year") or 0,
            ),
            reverse=True,
        )
        results = [_format_result(r, 0.0, [], "browse") for r in rows[:limit]]
        return {
            "results": results,
            "count": len(results),
            "ranking_method": "browse",
            "filters_applied": filters_applied,
            "message": None if results else "No experiences match the selected filters.",
        }

    semantic = embedding_scores(query)
    method = "embeddings" if semantic else "keyword"

    scored = []
    for row in rows:
        relevance, matched = keyword_score(query, row["experience"])
        if semantic:
            # Blend: semantic meaning leads, exact terms confirm.
            semantic_score = semantic.get(row["experience"].get("id"), 0.0)
            relevance = 0.7 * semantic_score + 0.3 * relevance
        if relevance >= min_relevance:
            scored.append((relevance, matched, row))

    scored.sort(
        key=lambda item: (item[0], item[2]["engineer"].get("years_experience") or 0),
        reverse=True,
    )

    results = [_format_result(row, rel, matched, method) for rel, matched, row in scored[:limit]]

    message = None
    if not results:
        message = (
            f"No experiences matched '{query}'"
            + (" with the selected filters." if filters_applied else ".")
            + " Try broader wording or fewer filters."
        )

    return {
        "results": results,
        "count": len(results),
        "ranking_method": method,
        "filters_applied": filters_applied,
        "message": message,
    }
