"""
models/experience_relationship.py
---------------------------------
Evolutionary and comparative relationships between experiences:
SUPERSEDES | UPDATED_BY | RELATED_TO | CONTRADICTS | APPLIES_TO
"""

import datetime
from sqlalchemy import Column, DateTime, ForeignKey, String, Text
from app.database.base import Base


class ExperienceRelationship(Base):
    __tablename__ = "experience_relationships"

    id = Column(String(64), primary_key=True, index=True)
    source_experience_id = Column(
        String(64), ForeignKey("experiences.id", ondelete="CASCADE"), nullable=False, index=True
    )
    target_experience_id = Column(
        String(64), ForeignKey("experiences.id", ondelete="CASCADE"), nullable=False, index=True
    )
    relationship_type = Column(String(32), nullable=False)  # SUPERSEDES | UPDATED_BY | RELATED_TO | CONTRADICTS | APPLIES_TO
    notes = Column(Text, nullable=True)

    created_at = Column(
        DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc), nullable=False
    )
