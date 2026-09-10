"""
models/organization_knowledge.py
--------------------------------
SQLAlchemy model for Private Organization Knowledge.
Must remain strictly private to the owning organization.
"""

from __future__ import annotations

import datetime
from datetime import timezone
from sqlalchemy import Column, DateTime, ForeignKey, String, Text, JSON
from sqlalchemy.orm import relationship

from app.database.base import Base


class OrganizationKnowledge(Base):
    __tablename__ = "organization_knowledge"

    id = Column(String(64), primary_key=True, index=True)
    organization_id = Column(
        String(64),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    title = Column(String(255), nullable=False)
    category = Column(
        String(64),
        nullable=False,
        index=True,
    )  # vault, onboarding, troubleshooting, postmortems, retirement, kri, dashboard
    content = Column(JSON, nullable=False)  # Structured payload specific to the section
    domain = Column(String(128), nullable=True, index=True)
    created_by = Column(
        String(64),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    created_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc), nullable=False)
    updated_at = Column(
        DateTime,
        default=lambda: datetime.datetime.now(datetime.timezone.utc),
        onupdate=lambda: datetime.datetime.now(datetime.timezone.utc),
        nullable=False,
    )

    # Relationships
    organization = relationship("Organization", back_populates="knowledge_records")
    creator = relationship("User")

    def __repr__(self) -> str:
        return f"<OrganizationKnowledge id={self.id} org={self.organization_id} cat={self.category}>"
