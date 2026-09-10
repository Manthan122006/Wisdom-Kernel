"""
models/domain.py
----------------
SQLAlchemy model for Domains / Categories.
"""

from __future__ import annotations

import datetime
from datetime import timezone
from sqlalchemy import Column, DateTime, String
from sqlalchemy.orm import relationship

from app.database.base import Base


class Domain(Base):
    __tablename__ = "domains"

    id = Column(String(64), primary_key=True, index=True)
    name = Column(String(128), unique=True, index=True, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc), nullable=False)

    # Relationships
    experiences = relationship("Experience", back_populates="domain_rel")
    mistakes = relationship("Mistake", back_populates="domain_rel")
    advice_items = relationship("Advice", back_populates="domain_rel")
    scenarios = relationship("SimulatorScenario", back_populates="domain_rel")

    def __repr__(self) -> str:
        return f"<Domain id={self.id} name={self.name}>"
