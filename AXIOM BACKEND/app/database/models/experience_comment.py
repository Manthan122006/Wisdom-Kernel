"""
models/experience_comment.py
----------------------------
Editorial discussions & perspectives shared by learners on specific experiences.
"""

import datetime
from sqlalchemy import Column, DateTime, ForeignKey, String, Text
from app.database.base import Base


class ExperienceComment(Base):
    __tablename__ = "experience_comments"

    id = Column(String(64), primary_key=True, index=True)
    experience_id = Column(
        String(64), ForeignKey("experiences.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id = Column(String(64), nullable=False, index=True)
    user_name = Column(String(128), nullable=False)
    user_role = Column(String(128), nullable=True)
    comment = Column(Text, nullable=False)

    created_at = Column(
        DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc), nullable=False
    )
    updated_at = Column(
        DateTime,
        default=lambda: datetime.datetime.now(datetime.timezone.utc),
        onupdate=lambda: datetime.datetime.now(datetime.timezone.utc),
        nullable=False,
    )
