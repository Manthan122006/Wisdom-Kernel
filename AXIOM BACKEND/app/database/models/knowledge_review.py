"""
models/knowledge_review.py
--------------------------
SQLAlchemy model for Knowledge Validity Review Requests.
"""

from __future__ import annotations

import datetime
from datetime import timezone
from sqlalchemy import Column, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import relationship

from app.database.base import Base


class KnowledgeReview(Base):
    __tablename__ = "knowledge_reviews"

    id = Column(String(64), primary_key=True, index=True)
    experience_id = Column(
        String(64),
        ForeignKey("experiences.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    reviewer_id = Column(
        String(64),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    status = Column(String(64), default="PENDING", nullable=False) # PENDING | APPROVED | REJECTED | UPDATE_RECOMMENDED
    recommended_validity = Column(String(64), nullable=True) # CURRENT | AGING | OUTDATED | CONTEXT-SPECIFIC
    reason = Column(Text, nullable=True)
    reviewed_at = Column(
        DateTime,
        default=lambda: datetime.datetime.now(datetime.timezone.utc),
        nullable=False,
    )

    # Relationships
    experience = relationship("Experience", backref="knowledge_reviews")
    reviewer = relationship("User", backref="assigned_reviews")

    def __repr__(self) -> str:
        return f"<KnowledgeReview exp={self.experience_id} status={self.status}>"
