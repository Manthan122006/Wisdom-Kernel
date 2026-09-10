"""
models/organization.py
----------------------
SQLAlchemy models for Organizations and Organization Members.
"""

from __future__ import annotations

import datetime
from datetime import timezone
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import relationship

from app.database.base import Base


class Organization(Base):
    __tablename__ = "organizations"

    id = Column(String(64), primary_key=True, index=True)
    name = Column(String(255), unique=True, nullable=False)
    slug = Column(String(128), unique=True, index=True, nullable=False)
    industry = Column(String(128), nullable=True)
    description = Column(Text, nullable=True)
    password_salt = Column(String(64), nullable=True)
    password_sha256 = Column(String(128), nullable=True)
    is_demo = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc), nullable=False)
    updated_at = Column(
        DateTime,
        default=lambda: datetime.datetime.now(datetime.timezone.utc),
        onupdate=lambda: datetime.datetime.now(datetime.timezone.utc),
        nullable=False,
    )

    # Relationships
    members = relationship(
        "OrganizationMember", back_populates="organization", cascade="all, delete-orphan"
    )
    knowledge_records = relationship(
        "OrganizationKnowledge", back_populates="organization", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Organization id={self.id} name={self.name} slug={self.slug}>"


class OrganizationMember(Base):
    __tablename__ = "organization_members"

    id = Column(String(64), primary_key=True, index=True)
    organization_id = Column(
        String(64),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id = Column(
        String(64),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    role = Column(String(64), default="member", nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc), nullable=False)

    # Relationships
    organization = relationship("Organization", back_populates="members")
    user = relationship("User", back_populates="organization_memberships")

    def __repr__(self) -> str:
        return f"<OrganizationMember org={self.organization_id} user={self.user_id} role={self.role}>"
