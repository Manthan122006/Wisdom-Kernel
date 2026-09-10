"""
models/tag.py
-------------
SQLAlchemy models for Tags and the experience_tags many-to-many association table.
"""

from __future__ import annotations

import datetime
from datetime import timezone
from sqlalchemy import Column, DateTime, ForeignKey, String, Table
from sqlalchemy.orm import relationship

from app.database.base import Base

# Many-to-Many Association Table: experience_tags
experience_tags = Table(
    "experience_tags",
    Base.metadata,
    Column(
        "experience_id",
        String(64),
        ForeignKey("experiences.id", ondelete="CASCADE"),
        primary_key=True,
        index=True,
    ),
    Column(
        "tag_id",
        String(64),
        ForeignKey("tags.id", ondelete="CASCADE"),
        primary_key=True,
        index=True,
    ),
)


class Tag(Base):
    __tablename__ = "tags"

    id = Column(String(64), primary_key=True, index=True)
    name = Column(String(64), unique=True, index=True, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc), nullable=False)

    # Relationships
    experiences = relationship(
        "Experience",
        secondary=experience_tags,
        back_populates="tags",
    )

    def __repr__(self) -> str:
        return f"<Tag id={self.id} name={self.name}>"
