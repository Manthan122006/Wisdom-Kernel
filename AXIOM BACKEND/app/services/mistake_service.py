"""
mistake_service.py
------------------
Business logic for mistakes library and details.
"""

from __future__ import annotations

from typing import Any, Optional
from sqlalchemy.orm import Session

from app.database.models.mistake import Mistake
from app.repositories.mistake_repository import MistakeRepository


def format_mistake_dict(m: Mistake) -> dict[str, Any]:
    engineer_name = m.contributor.name if m.contributor else "Anonymous"
    return {
        "id": m.id,
        "title": m.title,
        "wrong_assumption": m.wrong_assumption,
        "actual_cause": m.root_cause or m.what_happened,
        "what_we_did": m.what_we_did,
        "what_we_should_have_done": m.what_we_should_have_done,
        "lesson": m.lesson,
        "mistake_to_avoid": m.mistake_to_avoid,
        "engineer": engineer_name,
        "year": m.year,
        "domain": m.domain_name,
        "category": m.category,
        "is_demo": m.is_demo,
    }


class MistakeService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = MistakeRepository(db)

    def list_mistakes(
        self,
        domain: Optional[str] = None,
        category: Optional[str] = None,
        q: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> dict[str, Any]:
        rows, total = self.repo.list_mistakes(
            domain=domain,
            category=category,
            q=q,
            limit=limit,
            offset=offset,
        )
        categories = self.repo.get_categories()
        formatted = [format_mistake_dict(m) for m in rows]
        return {
            "count": len(formatted),
            "categories": categories,
            "mistakes": formatted,
        }

    def get_mistake_detail(self, mistake_id: str) -> Optional[dict[str, Any]]:
        m = self.repo.get_by_id(mistake_id)
        if not m:
            return None
        related_objs = self.repo.get_related(mistake_id, m.category, limit=3)
        return {
            "mistake": format_mistake_dict(m),
            "related": [format_mistake_dict(r) for r in related_objs],
        }
