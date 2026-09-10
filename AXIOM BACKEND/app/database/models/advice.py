"""
models/advice.py
----------------
SQLAlchemy model for "What I Wish I Knew" Advice.
"""

from __future__ import annotations

import datetime
from datetime import timezone
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import relationship

from app.database.base import Base


class Advice(Base):
    __tablename__ = "advice"

    id = Column(String(64), primary_key=True, index=True)
    title = Column(String(255), nullable=True)
    advice = Column(Text, nullable=False)
    context = Column(Text, nullable=True)
    domain_id = Column(
        String(64),
        ForeignKey("domains.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    expertise = Column(String(128), nullable=True)
    contributor_id = Column(
        String(64),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    category = Column(String(64), nullable=False, index=True)  # Debugging, Architecture, Design, Career
    is_demo = Column(Boolean, default=True, nullable=False)

    created_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc), nullable=False)
    updated_at = Column(
        DateTime,
        default=lambda: datetime.datetime.now(datetime.timezone.utc),
        onupdate=lambda: datetime.datetime.now(datetime.timezone.utc),
        nullable=False,
    )

    # Relationships
    contributor = relationship("User", back_populates="advice")
    domain_rel = relationship("Domain", back_populates="advice_items")

    def __repr__(self) -> str:
        return f"<Advice id={self.id} category={self.category}>"
