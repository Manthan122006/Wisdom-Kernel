"""
models/experience_feedback.py
-----------------------------
Learner feedback on experience usefulness (EFFECTIVE | PARTIALLY_EFFECTIVE | NOT_APPLICABLE).
Unique constraint per (experience_id, user_id).
"""

import datetime
from sqlalchemy import Column, DateTime, ForeignKey, String, UniqueConstraint
from app.database.base import Base


class ExperienceFeedback(Base):
    __tablename__ = "experience_feedback"
    __table_args__ = (
        UniqueConstraint("experience_id", "user_id", name="uq_exp_user_feedback"),
    )

    id = Column(String(64), primary_key=True, index=True)
    experience_id = Column(
        String(64), ForeignKey("experiences.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id = Column(String(64), nullable=False, index=True)
    user_name = Column(String(128), nullable=True)
    feedback_type = Column(String(32), nullable=False)  # EFFECTIVE | PARTIALLY_EFFECTIVE | NOT_APPLICABLE

    created_at = Column(
        DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc), nullable=False
    )
    updated_at = Column(
        DateTime,
        default=lambda: datetime.datetime.now(datetime.timezone.utc),
        onupdate=lambda: datetime.datetime.now(datetime.timezone.utc),
        nullable=False,
    )
