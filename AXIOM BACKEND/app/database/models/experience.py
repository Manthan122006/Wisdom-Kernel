"""
models/experience.py
--------------------
SQLAlchemy model for Experience records -- the core entity of WisdomKernel.
Preserves the complete 9-field experience structure:
problem, context, decision, reasoning, outcome, lesson, mistake, root_cause, what_i_wish_i_knew.
"""

from __future__ import annotations

import datetime
from datetime import timezone
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.database.base import Base
from app.database.models.tag import experience_tags


class Experience(Base):
    __tablename__ = "experiences"

    id = Column(String(64), primary_key=True, index=True)
    title = Column(String(255), nullable=False, index=True)
    contributor_id = Column(
        String(64),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    domain_id = Column(
        String(64),
        ForeignKey("domains.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    domain_name = Column(String(128), nullable=True, index=True)

    # The 9 canonical WisdomKernel experience fields
    problem = Column(Text, nullable=True)
    context = Column(Text, nullable=True)
    decision = Column(Text, nullable=True)
    reasoning = Column(Text, nullable=True)
    outcome = Column(Text, nullable=True)
    lesson = Column(Text, nullable=True)
    mistake = Column(Text, nullable=True)
    root_cause = Column(Text, nullable=True)
    what_i_wish_i_knew = Column(Text, nullable=True)

    # Metadata & Provenance
    source_type = Column(String(128), default="interview", nullable=True)
    source_reference = Column(String(255), nullable=True)
    year = Column(Integer, nullable=True, index=True)
    verification_status = Column(String(64), default="verified", nullable=False)
    is_demo = Column(Boolean, default=True, nullable=False)

    # Feature 2: Knowledge Status & Context Validity
    knowledge_status = Column(String(32), default="CURRENT", nullable=False, index=True)  # CURRENT | AGING | OUTDATED | CONTEXT-SPECIFIC
    last_reviewed_at = Column(DateTime, nullable=True)
    review_source = Column(String(128), default="Organization Expert", nullable=True)
    valid_context = Column(Text, nullable=True)
    invalid_context = Column(Text, nullable=True)

    created_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc), nullable=False, index=True)
    updated_at = Column(
        DateTime,
        default=lambda: datetime.datetime.now(datetime.timezone.utc),
        onupdate=lambda: datetime.datetime.now(datetime.timezone.utc),
        nullable=False,
    )

    # Relationships
    contributor = relationship("User", back_populates="experiences")
    domain_rel = relationship("Domain", back_populates="experiences")
    tags = relationship(
        "Tag",
        secondary=experience_tags,
        back_populates="experiences",
        lazy="joined",
    )

    def __repr__(self) -> str:
        return f"<Experience id={self.id} title={self.title[:30]}>"
