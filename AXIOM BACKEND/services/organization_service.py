"""
organization_service.py
-----------------------
Organization authentication and private knowledge vault retrieval.
Enforces strict organization data isolation.
"""

from __future__ import annotations

import hashlib
import logging
import secrets
import time
from typing import Any, Optional
from sqlalchemy.orm import Session

from app.repositories.organization_repository import OrganizationRepository
from app.repositories.knowledge_repository import KnowledgeRepository
from utils import auth

logger = logging.getLogger("wisdomkernel.org_service")


def hash_password(salt: str, password: str) -> str:
    return hashlib.sha256((salt + password).encode("utf-8")).hexdigest()


class OrganizationService:
    def __init__(self, db: Session):
        self.db = db
        self.org_repo = OrganizationRepository(db)
        self.knowledge_repo = KnowledgeRepository(db)

    def authenticate(self, organization_name: str, password: str) -> Optional[dict[str, Any]]:
        """
        Verify credentials against MySQL organizations table.
        """
        if not organization_name or not password:
            return None

        # Look up organization in MySQL
        org = self.org_repo.find_by_name_or_slug(organization_name)
        if not org:
            return None

        # Constant-time comparison
        salt = org.password_salt or ""
        expected = org.password_sha256 or ""
        actual = hash_password(salt, password)

        if expected and secrets.compare_digest(expected, actual):
            # Create session via auth helper
            session = auth.create_session({
                "id": org.id,
                "name": org.name,
                "slug": org.slug,
            })
            return {
                "token": session["token"],
                "expires_in_seconds": auth.TOKEN_TTL_SECONDS,
                "organization": {
                    "id": org.id,
                    "name": org.name,
                },
            }

        # Check for Northwind alias pointing to Northstar
        if organization_name.strip().lower() in ("northwind", "northwind power systems"):
            northstar = self.org_repo.find_by_name_or_slug("northstar")
            if northstar:
                actual_alias = hash_password(northstar.password_salt or "", password)
                if northstar.password_sha256 and secrets.compare_digest(northstar.password_sha256, actual_alias):
                    session = auth.create_session({
                        "id": northstar.id,
                        "name": northstar.name,
                        "slug": northstar.slug,
                    })
                    return {
                        "token": session["token"],
                        "expires_in_seconds": auth.TOKEN_TTL_SECONDS,
                        "organization": {
                            "id": northstar.id,
                            "name": northstar.name,
                        },
                    }

        return None

    def get_section_data(self, organization_id: str, section: str) -> Any:
        """
        Retrieve private vault data strictly bounded by organization_id.
        No public or unauthenticated user can access this.
        """
        return self.knowledge_repo.get_section(organization_id, section)
