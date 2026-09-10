"""
advice_repository.py
--------------------
Data access for "What I Wish I Knew" Advice.
"""

from __future__ import annotations

import datetime
from typing import Optional
from sqlalchemy import select, func, desc
from sqlalchemy.orm import Session, joinedload

from app.database.models.advice import Advice
from app.repositories.base_repository import BaseRepository


class AdviceRepository(BaseRepository[Advice]):
    def get_by_id(self, advice_id: str) -> Optional[Advice]:
        stmt = (
            select(Advice)
            .options(joinedload(Advice.contributor))
            .where(Advice.id == advice_id)
        )
        return self.db.execute(stmt).scalar_one_or_none()

    def list_advice(
        self,
        category: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> tuple[list[Advice], int]:
        stmt = select(Advice).options(joinedload(Advice.contributor))
        count_stmt = select(func.count(Advice.id))

        if category:
            stmt = stmt.where(func.lower(Advice.category) == category.strip().lower())
            count_stmt = count_stmt.where(func.lower(Advice.category) == category.strip().lower())

        total = self.db.execute(count_stmt).scalar() or 0
        stmt = stmt.order_by(desc(Advice.created_at)).limit(limit).offset(offset)
        results = list(self.db.execute(stmt).scalars().all())
        return results, total

    def get_categories(self) -> list[str]:
        rows = self.db.execute(
            select(func.distinct(Advice.category)).where(Advice.category.isnot(None)).order_by(Advice.category)
        ).all()
        categories = [r[0] for r in rows if r[0]]
        # Standard fallback categories if none in DB
        default_cats = ["Architecture", "Career", "Debugging", "Design"]
        for cat in default_cats:
            if cat not in categories:
                categories.append(cat)
        return sorted(categories)

    def create(self, data: dict) -> Advice:
        clean = {k: v for k, v in data.items() if hasattr(Advice, k)}
        advice = Advice(**clean)
        self.db.add(advice)
        self.db.flush()
        return advice

    def upsert(self, data: dict) -> Advice:
        existing = self.get_by_id(data["id"])
        if existing:
            for k, v in data.items():
                if hasattr(existing, k) and k != "id":
                    setattr(existing, k, v)
            existing.updated_at = datetime.datetime.now(datetime.timezone.utc)
            self.db.flush()
            return existing
        return self.create(data)
