"""
organization_repository.py
--------------------------
Data access for Organizations and Organization Members.
"""

from __future__ import annotations

from typing import Optional
from sqlalchemy import select, or_, func
from sqlalchemy.orm import Session

from app.database.models.organization import Organization, OrganizationMember
from app.repositories.base_repository import BaseRepository


class OrganizationRepository(BaseRepository[Organization]):
    def get_by_id(self, org_id: str) -> Optional[Organization]:
        return self.db.execute(select(Organization).where(Organization.id == org_id)).scalar_one_or_none()

    def get_by_slug(self, slug: str) -> Optional[Organization]:
        return self.db.execute(
            select(Organization).where(func.lower(Organization.slug) == slug.strip().lower())
        ).scalar_one_or_none()

    def find_by_name_or_slug(self, identifier: str) -> Optional[Organization]:
        if not identifier:
            return None
        needle = identifier.strip().lower()
        return self.db.execute(
            select(Organization).where(
                or_(
                    func.lower(Organization.name) == needle,
                    func.lower(Organization.slug) == needle,
                )
            )
        ).scalar_one_or_none()

    def list_all(self) -> list[Organization]:
        return list(self.db.execute(select(Organization)).scalars().all())

    def upsert(self, org_data: dict) -> Organization:
        existing = self.get_by_id(org_data["id"])
        if existing:
            for k, v in org_data.items():
                setattr(existing, k, v)
            self.db.flush()
            return existing
        new_org = Organization(**org_data)
        self.db.add(new_org)
        self.db.flush()
        return new_org

    def add_member(self, member_id: str, org_id: str, user_id: str, role: str = "member") -> OrganizationMember:
        existing = self.db.execute(
            select(OrganizationMember).where(
                OrganizationMember.organization_id == org_id,
                OrganizationMember.user_id == user_id,
            )
        ).scalar_one_or_none()
        if existing:
            existing.role = role
            self.db.flush()
            return existing
        member = OrganizationMember(id=member_id, organization_id=org_id, user_id=user_id, role=role)
        self.db.add(member)
        self.db.flush()
        return member
