"""
models/user.py
--------------
SQLAlchemy model for Users / Engineers.
"""

from __future__ import annotations

import datetime
from datetime import timezone
from sqlalchemy import Boolean, Column, DateTime, Integer, String, Text, JSON
from sqlalchemy.orm import relationship

from app.database.base import Base


class User(Base):
    __tablename__ = "users"

    id = Column(String(64), primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    role = Column(String(128), nullable=True)
    department = Column(String(128), nullable=True, index=True)
    status = Column(String(64), default="Active", nullable=True)
    expertise = Column(JSON, nullable=True)  # List of expertise keywords

    experience_level = Column(String(64), nullable=True, index=True)  # Mid, Senior, Principal, Veteran
    years_experience = Column(Integer, default=0, nullable=True)
    company = Column(String(255), nullable=True, index=True)
    engineering_type = Column(String(128), nullable=True, index=True)
    domain = Column(String(128), nullable=True, index=True)
    bio = Column(Text, nullable=True)
    retired = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc), nullable=False)
    updated_at = Column(
        DateTime,
        default=lambda: datetime.datetime.now(datetime.timezone.utc),
        onupdate=lambda: datetime.datetime.now(datetime.timezone.utc),
        nullable=False,
    )

    # Relationships
    experiences = relationship("Experience", back_populates="contributor", cascade="all, delete-orphan")
    mistakes = relationship("Mistake", back_populates="contributor", cascade="all, delete-orphan")
    advice = relationship("Advice", back_populates="contributor", cascade="all, delete-orphan")
    organization_memberships = relationship("OrganizationMember", back_populates="user", cascade="all, delete-orphan")
    simulator_attempts = relationship("SimulatorAttempt", back_populates="user")

    def __repr__(self) -> str:
        return f"<User id={self.id} name={self.name} email={self.email}>"
