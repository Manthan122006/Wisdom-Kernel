"""
models/knowledge_activity.py
----------------------------
Internal platform usage telemetry table tracking activities occurring INSIDE WisdomKernel.
Supported activities:
VIEWED_EXPERIENCE | SEARCHED | SAVED_EXPERIENCE | STARTED_SIMULATION | COMPLETED_SIMULATION | COMMENTED | GAVE_FEEDBACK
"""

import datetime
from sqlalchemy import Column, DateTime, ForeignKey, String, Text
from app.database.base import Base


class KnowledgeActivity(Base):
    __tablename__ = "knowledge_activity"

    id = Column(String(64), primary_key=True, index=True)
    organization_id = Column(String(64), nullable=True, index=True)
    user_id = Column(String(64), nullable=True, index=True)
    user_name = Column(String(128), nullable=True)
    experience_id = Column(
        String(64), ForeignKey("experiences.id", ondelete="SET NULL"), nullable=True, index=True
    )
    activity_type = Column(String(64), nullable=False, index=True)
    query = Column(String(255), nullable=True, index=True)
    metadata_json = Column(Text, nullable=True)

    created_at = Column(
        DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc), nullable=False, index=True
    )
