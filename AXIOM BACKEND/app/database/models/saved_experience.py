"""
models/saved_experience.py
---------------------------
SQLAlchemy model for Junior/User Saved (Bookmarked) Experiences.
"""

from __future__ import annotations

import datetime
from datetime import timezone
from sqlalchemy import Column, DateTime, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import relationship

from app.database.base import Base


class SavedExperience(Base):
    __tablename__ = "saved_experiences"
    __table_args__ = (
        UniqueConstraint("user_id", "experience_id", name="uq_user_saved_experience"),
    )

    id = Column(String(64), primary_key=True, index=True)
    user_id = Column(
        String(64),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    experience_id = Column(
        String(64),
        ForeignKey("experiences.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    created_at = Column(
        DateTime,
        default=lambda: datetime.datetime.now(datetime.timezone.utc),
        nullable=False,
    )

    # Relationships
    user = relationship("User", backref="saved_experiences")
    experience = relationship("Experience", backref="saved_by_users")

    def __repr__(self) -> str:
        return f"<SavedExperience user={self.user_id} exp={self.experience_id}>"
