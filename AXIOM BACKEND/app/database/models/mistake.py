"""
models/mistake.py
-----------------
SQLAlchemy model for Mistakes library.
"""

from __future__ import annotations

import datetime
from datetime import timezone
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.database.base import Base


class Mistake(Base):
    __tablename__ = "mistakes"

    id = Column(String(64), primary_key=True, index=True)
    title = Column(String(255), nullable=False, index=True)
    domain_id = Column(
        String(64),
        ForeignKey("domains.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    domain_name = Column(String(128), nullable=True, index=True)
    contributor_id = Column(
        String(64),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    category = Column(String(64), nullable=True, index=True)

    wrong_assumption = Column(Text, nullable=True)
    what_happened = Column(Text, nullable=True)
    root_cause = Column(Text, nullable=True)
    what_we_did = Column(Text, nullable=True)
    what_we_should_have_done = Column(Text, nullable=True)
    lesson = Column(Text, nullable=True)
    mistake_to_avoid = Column(Text, nullable=True)

    year = Column(Integer, nullable=True)
    is_demo = Column(Boolean, default=True, nullable=False)

    created_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc), nullable=False)
    updated_at = Column(
        DateTime,
        default=lambda: datetime.datetime.now(datetime.timezone.utc),
        onupdate=lambda: datetime.datetime.now(datetime.timezone.utc),
        nullable=False,
    )

    # Relationships
    contributor = relationship("User", back_populates="mistakes")
    domain_rel = relationship("Domain", back_populates="mistakes")

    def __repr__(self) -> str:
        return f"<Mistake id={self.id} title={self.title[:30]}>"
