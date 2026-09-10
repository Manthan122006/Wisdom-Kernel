"""
domain_tag_repository.py
------------------------
Data access for Domains and Tags.
"""

from __future__ import annotations

import uuid
from typing import Optional
from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.database.models.domain import Domain
from app.database.models.tag import Tag
from app.repositories.base_repository import BaseRepository


class DomainRepository(BaseRepository[Domain]):
    def get_or_create(self, name: str) -> Domain:
        clean_name = name.strip()
        existing = self.db.execute(
            select(Domain).where(func.lower(Domain.name) == clean_name.lower())
        ).scalar_one_or_none()
        if existing:
            return existing
        domain_id = f"dom-{uuid.uuid4().hex[:8]}"
        new_domain = Domain(id=domain_id, name=clean_name)
        self.db.add(new_domain)
        self.db.flush()
        return new_domain

    def list_all(self) -> list[Domain]:
        return list(self.db.execute(select(Domain).order_by(Domain.name)).scalars().all())


class TagRepository(BaseRepository[Tag]):
    def get_or_create(self, name: str) -> Tag:
        clean_name = name.strip()
        existing = self.db.execute(
            select(Tag).where(func.lower(Tag.name) == clean_name.lower())
        ).scalar_one_or_none()
        if existing:
            return existing
        tag_id = f"tag-{uuid.uuid4().hex[:8]}"
        new_tag = Tag(id=tag_id, name=clean_name)
        self.db.add(new_tag)
        self.db.flush()
        return new_tag

    def get_or_create_many(self, names: list[str]) -> list[Tag]:
        tags = []
        for name in names:
            if name and str(name).strip():
                tags.append(self.get_or_create(str(name)))
        return tags
