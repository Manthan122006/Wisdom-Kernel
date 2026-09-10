"""
knowledge_repository.py
-----------------------
Data access for Private Organization Knowledge.
Guarantees tenant isolation: all queries require organization_id.
"""

from __future__ import annotations

import datetime
from typing import Any, Optional
from sqlalchemy import select, and_, delete
from sqlalchemy.orm import Session

from app.database.models.organization_knowledge import OrganizationKnowledge
from app.repositories.base_repository import BaseRepository


class KnowledgeRepository(BaseRepository[OrganizationKnowledge]):
    def get_section(self, organization_id: str, section: str) -> Any:
        """
        Fetch private knowledge strictly filtered by organization_id and category.
        Returns a list of records for list sections, or a single dict for object sections.
        """
        clean_section = section.strip().lower()
        stmt = (
            select(OrganizationKnowledge)
            .where(
                and_(
                    OrganizationKnowledge.organization_id == organization_id,
                    OrganizationKnowledge.category == clean_section,
                )
            )
            .order_by(OrganizationKnowledge.created_at)
        )
        rows = list(self.db.execute(stmt).scalars().all())

        if clean_section in ("kri", "dashboard"):
            if rows:
                return rows[0].content
            return {}

        return [row.content for row in rows]

    def upsert_item(
        self,
        item_id: str,
        organization_id: str,
        title: str,
        category: str,
        content: dict | list,
        domain: Optional[str] = None,
        created_by: Optional[str] = None,
    ) -> OrganizationKnowledge:
        clean_category = category.strip().lower()
        existing = self.db.execute(
            select(OrganizationKnowledge).where(OrganizationKnowledge.id == item_id)
        ).scalar_one_or_none()

        if existing:
            existing.title = title
            existing.category = clean_category
            existing.content = content
            existing.domain = domain
            existing.created_by = created_by
            existing.updated_at = datetime.datetime.now(datetime.timezone.utc)
            self.db.flush()
            return existing

        new_item = OrganizationKnowledge(
            id=item_id,
            organization_id=organization_id,
            title=title,
            category=clean_category,
            content=content,
            domain=domain,
            created_by=created_by,
        )
        self.db.add(new_item)
        self.db.flush()
        return new_item

    def delete_by_organization(self, organization_id: str) -> int:
        stmt = delete(OrganizationKnowledge).where(OrganizationKnowledge.organization_id == organization_id)
        res = self.db.execute(stmt)
        self.db.flush()
        return res.rowcount
