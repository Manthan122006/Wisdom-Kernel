"""
simulator_service.py
--------------------
Business logic for Incident Simulator and Attempt tracking.
"""

from __future__ import annotations

import datetime
import uuid
from typing import Any, Optional
from sqlalchemy.orm import Session

from app.database.models.simulator import SimulatorScenario
from app.repositories.simulator_repository import SimulatorRepository
from app.services.scoring_service import calculate_score


def format_scenario_dict(s: SimulatorScenario) -> dict[str, Any]:
    steps_list = []
    prefix = f"{s.id}-"
    for step in s.steps:
        options_list = [
            {
                "id": opt.option_key,
                "text": opt.option_text,
                "correct": opt.is_correct,
                "feedback": opt.feedback,
            }
            for opt in step.options
        ]
        clean_step_id = step.id[len(prefix):] if step.id.startswith(prefix) else step.id
        steps_list.append({
            "id": clean_step_id,
            "stage": step.stage,
            "question": step.question,
            "options": options_list,
        })

    return {
        "id": s.id,
        "title": s.title,
        "description": s.description,
        "difficulty": s.difficulty,
        "domain": s.domain,
        "estimated_minutes": s.estimated_minutes,
        "steps": steps_list,
        "senior_reasoning": s.senior_reasoning,
        "lesson": s.lesson,
        "is_demo": s.is_demo,
    }


class SimulatorService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = SimulatorRepository(db)

    def list_scenarios(
        self,
        scenario_id: Optional[str] = None,
        difficulty: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> list[dict[str, Any]]:
        if scenario_id:
            s = self.repo.get_by_id(scenario_id)
            if not s:
                return []
            return [format_scenario_dict(s)]

        scenarios, _ = self.repo.list_scenarios(
            difficulty=difficulty,
            limit=limit,
            offset=offset,
        )
        return [format_scenario_dict(s) for s in scenarios]

    def record_attempt_and_score(
        self,
        correct_answers: int,
        total_questions: int,
        scenario_id: Optional[str] = None,
        first_attempt_correct: Optional[int] = None,
        previous_score: Optional[float] = None,
        time_taken_seconds: Optional[int] = None,
        user_id: Optional[str] = None,
    ) -> dict[str, Any]:
        score_res = calculate_score(
            correct_answers=correct_answers,
            total_questions=total_questions,
            scenario_id=scenario_id,
            first_attempt_correct=first_attempt_correct,
            previous_score=previous_score,
            time_taken_seconds=time_taken_seconds,
        )

        if scenario_id:
            sc = self.repo.get_by_id(scenario_id)
            if sc:
                attempt_id = f"att-{uuid.uuid4().hex[:10]}"
                self.repo.create_attempt({
                    "id": attempt_id,
                    "user_id": user_id,
                    "scenario_id": sc.id,
                    "correct_answers": correct_answers,
                    "total_questions": total_questions,
                    "score": score_res["score"],
                    "band": score_res["band"],
                    "time_taken_seconds": time_taken_seconds,
                    "completion_status": "completed",
                    "started_at": datetime.datetime.now(datetime.timezone.utc),
                    "completed_at": datetime.datetime.now(datetime.timezone.utc),
                })
                self.db.commit()

        return score_res
