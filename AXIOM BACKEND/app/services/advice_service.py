"""
advice_service.py
-----------------
Business logic for "What I Wish I Knew" Advice.
"""

from __future__ import annotations

from typing import Any, Optional
from sqlalchemy.orm import Session

from app.database.models.advice import Advice
from app.repositories.advice_repository import AdviceRepository


def format_advice_dict(a: Advice) -> dict[str, Any]:
    engineer_name = a.contributor.name if a.contributor else "Anonymous"
    return {
        "id": a.id,
        "engineer_name": engineer_name,
        "advice": a.advice,
        "category": a.category,
        "is_demo": a.is_demo,
    }


class AdviceService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = AdviceRepository(db)

    def list_advice(
        self,
        category: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> dict[str, Any]:
        rows, total = self.repo.list_advice(
            category=category,
            limit=limit,
            offset=offset,
        )
        categories = self.repo.get_categories()
        formatted = [format_advice_dict(a) for a in rows]
        return {
            "count": len(formatted),
            "categories": categories,
            "advice": formatted,
        }
