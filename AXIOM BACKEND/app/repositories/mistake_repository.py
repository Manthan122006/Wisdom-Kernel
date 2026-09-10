"""
mistake_repository.py
---------------------
Data access for Mistakes library with database filtering and pagination.
"""

from __future__ import annotations

import datetime
from typing import Optional
from sqlalchemy import select, func, or_, and_, desc
from sqlalchemy.orm import Session, joinedload

from app.database.models.mistake import Mistake
from app.database.models.domain import Domain
from app.repositories.base_repository import BaseRepository
from app.repositories.domain_tag_repository import DomainRepository


class MistakeRepository(BaseRepository[Mistake]):
    def get_by_id(self, mistake_id: str) -> Optional[Mistake]:
        stmt = (
            select(Mistake)
            .options(joinedload(Mistake.contributor), joinedload(Mistake.domain_rel))
            .where(Mistake.id == mistake_id)
        )
        return self.db.execute(stmt).scalar_one_or_none()

    def get_related(self, mistake_id: str, category: Optional[str], limit: int = 3) -> list[Mistake]:
        if not category:
            return []
        stmt = (
            select(Mistake)
            .options(joinedload(Mistake.contributor))
            .where(Mistake.id != mistake_id, func.lower(Mistake.category) == category.strip().lower())
            .order_by(desc(Mistake.year), desc(Mistake.created_at))
            .limit(limit)
        )
        return list(self.db.execute(stmt).scalars().all())

    def list_mistakes(
        self,
        domain: Optional[str] = None,
        category: Optional[str] = None,
        q: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> tuple[list[Mistake], int]:
        stmt = select(Mistake).options(joinedload(Mistake.contributor))
        count_stmt = select(func.count(Mistake.id))

        conditions = []
        if category:
            conditions.append(func.lower(Mistake.category) == category.strip().lower())
        if domain:
            conditions.append(Mistake.domain_name.ilike(f"%{domain.strip()}%"))
        if q:
            needle = f"%{q.strip()}%"
            conditions.append(
                or_(
                    Mistake.title.ilike(needle),
                    Mistake.lesson.ilike(needle),
                    Mistake.mistake_to_avoid.ilike(needle),
                    Mistake.root_cause.ilike(needle),
                )
            )

        if conditions:
            stmt = stmt.where(and_(*conditions))
            count_stmt = count_stmt.where(and_(*conditions))

        total = self.db.execute(count_stmt).scalar() or 0
        stmt = stmt.order_by(desc(Mistake.year), desc(Mistake.created_at)).limit(limit).offset(offset)
        results = list(self.db.execute(stmt).scalars().all())
        return results, total

    def get_categories(self) -> list[str]:
        rows = self.db.execute(
            select(func.distinct(Mistake.category)).where(Mistake.category.isnot(None)).order_by(Mistake.category)
        ).all()
        return [r[0] for r in rows if r[0]]

    def create(self, data: dict) -> Mistake:
        domain_name = data.get("domain_name") or data.get("domain")
        if domain_name:
            dom_repo = DomainRepository(self.db)
            domain_obj = dom_repo.get_or_create(domain_name)
            data["domain_id"] = domain_obj.id
            data["domain_name"] = domain_obj.name

        clean = {k: v for k, v in data.items() if hasattr(Mistake, k)}
        mistake = Mistake(**clean)
        self.db.add(mistake)
        self.db.flush()
        return mistake

    def upsert(self, data: dict) -> Mistake:
        existing = self.get_by_id(data["id"])
        if existing:
            for k, v in data.items():
                if hasattr(existing, k) and k != "id":
                    setattr(existing, k, v)
            existing.updated_at = datetime.datetime.now(datetime.timezone.utc)
            self.db.flush()
            return existing
        return self.create(data)
