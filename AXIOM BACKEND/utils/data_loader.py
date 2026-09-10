"""
data_loader.py
--------------
Single place where WisdomKernel reads its JSON "database".

For the MVP the persistence layer is plain JSON files on disk. This module:

  * resolves paths relative to the backend package (not the shell's cwd)
  * caches parsed files in memory so every request does not hit the disk
  * never raises on a missing or malformed file -- it logs and returns an
    empty default, so one bad data file can never take the whole API down
"""

from __future__ import annotations

import json
import logging
import os
import threading
from typing import Any

logger = logging.getLogger("wisdomkernel.data_loader")

# backend/utils/data_loader.py -> backend/
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")

_cache: dict[str, Any] = {}
_lock = threading.Lock()

# Known data files. Keys are the names used everywhere else in the codebase.
FILES = {
    "engineers": "engineers.json",
    "experiences": "experiences.json",
    "mistakes": "mistakes.json",
    "simulator_scenarios": "simulator_scenarios.json",
    "advice": "advice.json",
    "organizations": "organizations.json",
    "organization_data": "organization_data.json",
}


def _read_json(path: str, default: Any) -> Any:
    """Read a JSON file, returning `default` on any failure."""
    if not os.path.exists(path):
        logger.error("Data file not found: %s", path)
        return default
    try:
        with open(path, "r", encoding="utf-8") as handle:
            return json.load(handle)
    except json.JSONDecodeError as exc:
        logger.error("Malformed JSON in %s: %s", path, exc)
        return default
    except OSError as exc:
        logger.error("Could not read %s: %s", path, exc)
        return default


def load(name: str, default: Any = None, use_cache: bool = True) -> Any:
    """
    Load a named data file.

    name      -- a key from FILES, e.g. "experiences"
    default   -- value returned when the file is missing/unreadable
                 (defaults to [] for lists, callers may pass {})
    use_cache -- set False to force a re-read from disk
    """
    if default is None:
        default = {} if name == "organization_data" else []

    filename = FILES.get(name)
    if filename is None:
        logger.error("Unknown data file requested: %s", name)
        return default

    if use_cache:
        with _lock:
            if name in _cache:
                return _cache[name]

    data = _read_json(os.path.join(DATA_DIR, filename), default)

    with _lock:
        _cache[name] = data
    return data


def clear_cache() -> None:
    """Drop the in-memory cache (used by tests and on startup)."""
    with _lock:
        _cache.clear()


# ---------------------------------------------------------------------------
# Convenience accessors -- these keep the rest of the code free of string keys
# ---------------------------------------------------------------------------

def get_engineers() -> list[dict]:
    return load("engineers", [])


def get_experiences() -> list[dict]:
    return load("experiences", [])


def get_mistakes() -> list[dict]:
    return load("mistakes", [])


def get_scenarios() -> list[dict]:
    return load("simulator_scenarios", [])


def get_advice() -> list[dict]:
    return load("advice", [])


def get_organizations() -> list[dict]:
    return load("organizations", [])


def get_organization_data() -> dict:
    return load("organization_data", {})


def get_engineer_map() -> dict[str, dict]:
    """engineer_id -> engineer record, for joining onto experiences."""
    return {e.get("id"): e for e in get_engineers() if e.get("id")}


def get_organization_section(org_id: str, section: str) -> Any:
    """
    Fetch one section ("vault", "onboarding", ...) of one organization's
    private data. Returns [] / {} when the org or section is absent.
    """
    org_block = get_organization_data().get(org_id)
    if not isinstance(org_block, dict):
        logger.warning("No private data block for organization %s", org_id)
        return [] if section != "kri" and section != "dashboard" else {}
    return org_block.get(section, [] if section not in ("kri", "dashboard") else {})
