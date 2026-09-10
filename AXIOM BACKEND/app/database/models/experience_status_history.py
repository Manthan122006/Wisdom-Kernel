"""
models/experience_status_history.py
------------------------------------
Audit trail of knowledge status transitions (CURRENT, AGING, OUTDATED, CONTEXT-SPECIFIC).
"""

import datetime
from sqlalchemy import Column, DateTime, ForeignKey, String
from app.database.base import Base


class ExperienceStatusHistory(Base):
    __tablename__ = "experience_status_history"

    id = Column(String(64), primary_key=True, index=True)
    experience_id = Column(
        String(64), ForeignKey("experiences.id", ondelete="CASCADE"), nullable=False, index=True
    )
    previous_status = Column(String(32), nullable=True)
    new_status = Column(String(32), nullable=False)
    reason = Column(String(255), nullable=True)
    reviewed_by = Column(String(128), nullable=True)
    review_source = Column(String(128), default="Organization Expert", nullable=True)

    created_at = Column(
        DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc), nullable=False
    )
