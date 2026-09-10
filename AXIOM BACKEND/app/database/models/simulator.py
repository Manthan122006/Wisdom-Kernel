"""
models/simulator.py
-------------------
SQLAlchemy models for incident simulator:
simulator_scenarios -> simulator_steps -> simulator_decision_options
and simulator_attempts.
"""

from __future__ import annotations

import datetime
from datetime import timezone
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text, JSON
from sqlalchemy.orm import relationship

from app.database.base import Base


class SimulatorScenario(Base):
    __tablename__ = "simulator_scenarios"

    id = Column(String(64), primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    difficulty = Column(String(64), nullable=True, index=True)  # Beginner, Intermediate, Advanced
    domain = Column(String(128), nullable=True, index=True)
    domain_id = Column(
        String(64),
        ForeignKey("domains.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    estimated_minutes = Column(Integer, default=5, nullable=True)

    context = Column(Text, nullable=True)
    symptoms = Column(Text, nullable=True)
    evidence = Column(Text, nullable=True)

    senior_reasoning = Column(Text, nullable=False)
    lesson = Column(Text, nullable=False)
    is_demo = Column(Boolean, default=True, nullable=False)

    created_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc), nullable=False)
    updated_at = Column(
        DateTime,
        default=lambda: datetime.datetime.now(datetime.timezone.utc),
        onupdate=lambda: datetime.datetime.now(datetime.timezone.utc),
        nullable=False,
    )

    # Relationships
    domain_rel = relationship("Domain", back_populates="scenarios")
    steps = relationship(
        "SimulatorStep",
        back_populates="scenario",
        cascade="all, delete-orphan",
        order_by="SimulatorStep.step_order",
        lazy="joined",
    )
    attempts = relationship(
        "SimulatorAttempt",
        back_populates="scenario",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<SimulatorScenario id={self.id} title={self.title[:30]}>"


class SimulatorStep(Base):
    __tablename__ = "simulator_steps"

    id = Column(String(64), primary_key=True, index=True)
    scenario_id = Column(
        String(64),
        ForeignKey("simulator_scenarios.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    step_order = Column(Integer, default=1, nullable=False, index=True)
    stage = Column(String(64), nullable=True)  # e.g. "01 OBSERVE"
    question = Column(Text, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc), nullable=False)

    # Relationships
    scenario = relationship("SimulatorScenario", back_populates="steps")
    options = relationship(
        "SimulatorDecisionOption",
        back_populates="step",
        cascade="all, delete-orphan",
        order_by="SimulatorDecisionOption.option_key",
        lazy="joined",
    )

    def __repr__(self) -> str:
        return f"<SimulatorStep id={self.id} scenario={self.scenario_id} order={self.step_order}>"


class SimulatorDecisionOption(Base):
    __tablename__ = "simulator_decision_options"

    id = Column(String(64), primary_key=True, index=True)
    step_id = Column(
        String(64),
        ForeignKey("simulator_steps.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    option_key = Column(String(16), nullable=False)  # "A", "B", "C", "D"
    option_text = Column(Text, nullable=False)
    feedback = Column(Text, nullable=False)
    is_correct = Column(Boolean, default=False, nullable=False)
    senior_reasoning = Column(Text, nullable=True)
    next_step = Column(String(64), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc), nullable=False)

    # Relationships
    step = relationship("SimulatorStep", back_populates="options")

    def __repr__(self) -> str:
        return f"<SimulatorDecisionOption id={self.id} key={self.option_key} correct={self.is_correct}>"


class SimulatorAttempt(Base):
    __tablename__ = "simulator_attempts"

    id = Column(String(64), primary_key=True, index=True)
    user_id = Column(
        String(64),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    scenario_id = Column(
        String(64),
        ForeignKey("simulator_scenarios.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    selected_decisions = Column(JSON, nullable=True)
    correct_answers = Column(Integer, default=0, nullable=False)
    total_questions = Column(Integer, default=0, nullable=False)
    score = Column(Integer, default=0, nullable=False)
    band = Column(String(64), nullable=True)
    time_taken_seconds = Column(Integer, nullable=True)
    completion_status = Column(String(64), default="completed", nullable=False)
    started_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc), nullable=False)
    completed_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc), nullable=False)

    # Relationships
    user = relationship("User", back_populates="simulator_attempts")
    scenario = relationship("SimulatorScenario", back_populates="attempts")

    def __repr__(self) -> str:
        return f"<SimulatorAttempt id={self.id} scenario={self.scenario_id} score={self.score}>"
