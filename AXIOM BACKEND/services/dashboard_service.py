"""
dashboard_service.py
--------------------
Database-level aggregation for public home screen dashboard statistics.
"""

from __future__ import annotations

from typing import Any
from sqlalchemy import select, func, desc
from sqlalchemy.orm import Session

from app.database.models.experience import Experience
from app.database.models.user import User
from app.database.models.mistake import Mistake
from app.database.models.advice import Advice
from app.database.models.simulator import SimulatorScenario


class DashboardService:
    def __init__(self, db: Session):
        self.db = db

    def get_dashboard_data(self) -> dict[str, Any]:
        exp_count = self.db.execute(select(func.count(Experience.id))).scalar() or 0
        user_count = self.db.execute(select(func.count(User.id))).scalar() or 0
        years_sum = self.db.execute(select(func.sum(User.years_experience))).scalar() or 0
        mistakes_count = self.db.execute(select(func.count(Mistake.id))).scalar() or 0
        scenarios_count = self.db.execute(select(func.count(SimulatorScenario.id))).scalar() or 0
        advice_count = self.db.execute(select(func.count(Advice.id))).scalar() or 0

        # Distinct domains
        domain_rows = self.db.execute(
            select(func.distinct(Experience.domain_name)).where(Experience.domain_name.isnot(None))
        ).all()
        domains = sorted([r[0] for r in domain_rows if r[0]])

        # Distinct engineering types
        type_rows = self.db.execute(
            select(func.distinct(User.engineering_type)).where(User.engineering_type.isnot(None))
        ).all()
        types = sorted([r[0] for r in type_rows if r[0]])

        # 5 most recent experiences
        recent_rows = self.db.execute(
            select(Experience).order_by(desc(Experience.year), desc(Experience.created_at)).limit(5)
        ).scalars().all()

        recent_view = [
            {
                "id": e.id,
                "title": e.title,
                "domain": e.domain_name,
                "lesson": e.lesson,
                "year": e.year,
            }
            for e in recent_rows
        ]

        return {
            "stats": {
                "experiences_captured": exp_count,
                "contributors": user_count,
                "total_years_of_experience": int(years_sum),
                "mistakes_documented": mistakes_count,
                "simulator_scenarios": scenarios_count,
                "advice_entries": advice_count,
            },
            "domains": domains,
            "engineering_types": types,
            "recent_experiences": recent_view,
            "note": "All persistent figures loaded from MySQL database.",
        }
