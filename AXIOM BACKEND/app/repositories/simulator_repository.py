"""
simulator_repository.py
-----------------------
Data access for Incident Simulator scenarios, steps, options, and user attempts.
"""

from __future__ import annotations

import datetime
from typing import Optional
from sqlalchemy import select, func, desc
from sqlalchemy.orm import Session, joinedload

from app.database.models.simulator import (
    SimulatorScenario,
    SimulatorStep,
    SimulatorDecisionOption,
    SimulatorAttempt,
)
from app.repositories.base_repository import BaseRepository


class SimulatorRepository(BaseRepository[SimulatorScenario]):
    def get_by_id(self, scenario_id: str) -> Optional[SimulatorScenario]:
        stmt = (
            select(SimulatorScenario)
            .options(
                joinedload(SimulatorScenario.steps).joinedload(SimulatorStep.options)
            )
            .where(SimulatorScenario.id == scenario_id)
        )
        return self.db.execute(stmt).unique().scalar_one_or_none()

    def list_scenarios(
        self,
        difficulty: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> tuple[list[SimulatorScenario], int]:
        stmt = (
            select(SimulatorScenario)
            .options(
                joinedload(SimulatorScenario.steps).joinedload(SimulatorStep.options)
            )
        )
        count_stmt = select(func.count(SimulatorScenario.id))

        if difficulty:
            stmt = stmt.where(func.lower(SimulatorScenario.difficulty) == difficulty.strip().lower())
            count_stmt = count_stmt.where(func.lower(SimulatorScenario.difficulty) == difficulty.strip().lower())

        total = self.db.execute(count_stmt).scalar() or 0
        stmt = stmt.order_by(SimulatorScenario.id).limit(limit).offset(offset)
        results = list(self.db.execute(stmt).unique().scalars().all())
        return results, total

    def upsert_scenario(self, scenario_dict: dict) -> SimulatorScenario:
        scenario_id = scenario_dict["id"]
        existing = self.get_by_id(scenario_id)

        if existing:
            # Update fields
            for k, v in scenario_dict.items():
                if hasattr(existing, k) and k not in ("id", "steps"):
                    setattr(existing, k, v)
            existing.updated_at = datetime.datetime.now(datetime.timezone.utc)

            # Clean existing steps and options
            for step in list(existing.steps):
                self.db.delete(step)
            self.db.flush()
            target_scenario = existing
        else:
            scenario_fields = {
                k: v for k, v in scenario_dict.items() if hasattr(SimulatorScenario, k) and k != "steps"
            }
            target_scenario = SimulatorScenario(**scenario_fields)
            self.db.add(target_scenario)
            self.db.flush()

        # Insert steps & options
        for step_idx, step_data in enumerate(scenario_dict.get("steps", []), start=1):
            step_raw_id = step_data.get("id") or f"step-{step_idx}"
            step_id = f"{scenario_id}-{step_raw_id}"
            new_step = SimulatorStep(
                id=step_id,
                scenario_id=target_scenario.id,
                step_order=step_idx,
                stage=step_data.get("stage"),
                question=step_data["question"],
            )
            self.db.add(new_step)
            self.db.flush()

            for opt_idx, opt_data in enumerate(step_data.get("options", []), start=1):
                opt_key = opt_data.get("id") or chr(ord("A") + opt_idx - 1)
                opt_id = f"{step_id}-opt-{opt_key}"
                new_opt = SimulatorDecisionOption(
                    id=opt_id,
                    step_id=new_step.id,
                    option_key=opt_key,
                    option_text=opt_data["text"],
                    feedback=opt_data["feedback"],
                    is_correct=bool(opt_data.get("correct", False)),
                    senior_reasoning=opt_data.get("senior_reasoning"),
                    next_step=opt_data.get("next_step"),
                )
                self.db.add(new_opt)

        self.db.flush()
        return target_scenario

    def create_attempt(self, attempt_data: dict) -> SimulatorAttempt:
        attempt = SimulatorAttempt(**attempt_data)
        self.db.add(attempt)
        self.db.flush()
        return attempt
