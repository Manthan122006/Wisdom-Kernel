"""
experience_service.py
---------------------
Business logic for experiences, search, facets, and CRUD operations.
"""

from __future__ import annotations

import uuid
from typing import Any, Optional
from sqlalchemy.orm import Session

from app.database.models.experience import Experience
from app.repositories.experience_repository import ExperienceRepository
from app.repositories.user_repository import UserRepository


def format_experience_dict(exp: Experience) -> dict[str, Any]:
    """Transform Experience ORM model to dictionary matching API contract."""
    contributor = exp.contributor
    tags = [t.name for t in exp.tags] if exp.tags else []

    # If contributor has expertise list, join or pick primary
    expertise_val = None
    if contributor and contributor.expertise:
        if isinstance(contributor.expertise, list) and contributor.expertise:
            expertise_val = contributor.expertise[0]
        elif isinstance(contributor.expertise, str):
            expertise_val = contributor.expertise

    return {
        "id": exp.id,
        "title": exp.title,
        "contributor_name": contributor.name if contributor else "Anonymous",
        "contributor_id": exp.contributor_id,
        "role": contributor.role if contributor else None,
        "experience_level": contributor.experience_level if contributor else None,
        "years_experience": contributor.years_experience if contributor else 0,
        "company": contributor.company if contributor else None,
        "engineering_type": contributor.engineering_type if contributor else None,
        "domain": exp.domain_name or (contributor.domain if contributor else None),
        "expertise": expertise_val,
        "year": exp.year,
        "source": exp.source_reference or exp.source_type,
        "tags": tags,
        "problem": exp.problem,
        "context": exp.context,
        "decision": exp.decision,
        "reasoning": exp.reasoning,
        "mistake": exp.mistake,
        "root_cause": exp.root_cause,
        "outcome": exp.outcome,
        "lesson": exp.lesson,
        "what_i_wish_i_knew": exp.what_i_wish_i_knew,
        "is_demo": exp.is_demo,
    }


class ExperienceService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = ExperienceRepository(db)
        self.user_repo = UserRepository(db)

    def get_experience_detail(self, experience_id: str) -> Optional[dict[str, Any]]:
        exp = self.repo.get_by_id(experience_id)
        if not exp:
            return None
        related_objs = self.repo.get_related(experience_id, exp.domain_name, limit=3)
        related = [
            {
                "id": r.id,
                "title": r.title,
                "contributor_name": r.contributor.name if r.contributor else "Anonymous",
                "domain": r.domain_name,
                "lesson": r.lesson,
                "year": r.year,
            }
            for r in related_objs
        ]
        return {
            "experience": format_experience_dict(exp),
            "related": related,
        }

    def list_experiences(
        self,
        domain: Optional[str] = None,
        role: Optional[str] = None,
        expertise: Optional[str] = None,
        experience_level: Optional[str] = None,
        engineering_type: Optional[str] = None,
        company: Optional[str] = None,
        year: Optional[int] = None,
        q: Optional[str] = None,
        sort: str = "recent",
        limit: int = 50,
        offset: int = 0,
    ) -> dict[str, Any]:
        rows, total = self.repo.list_experiences(
            domain=domain,
            role=role,
            expertise=expertise,
            experience_level=experience_level,
            engineering_type=engineering_type,
            company=company,
            year=year,
            q=q,
            sort=sort,
            limit=limit,
            offset=offset,
        )

        facets = self.repo.get_facets()
        formatted = [format_experience_dict(r) for r in rows]

        applied = {
            k: v
            for k, v in {
                "domain": domain,
                "role": role,
                "expertise": expertise,
                "experience_level": experience_level,
                "engineering_type": engineering_type,
                "company": company,
                "year": year,
                "q": q,
            }.items()
            if v not in (None, "")
        }

        return {
            "count": len(formatted),
            "total": total,
            "facets": facets,
            "filters_applied": applied,
            "message": None if formatted else "No experiences match these filters.",
            "experiences": formatted,
        }

    def search_experiences(
        self,
        query: Optional[str] = None,
        engineering_type: Optional[str] = None,
        company: Optional[str] = None,
        domain: Optional[str] = None,
        expertise: Optional[str] = None,
        years_min: Optional[int] = None,
        years_max: Optional[int] = None,
        limit: int = 10,
    ) -> dict[str, Any]:
        candidates = self.repo.search(
            query=query,
            engineering_type=engineering_type,
            company=company,
            domain=domain,
            expertise=expertise,
            years_min=years_min,
            years_max=years_max,
            limit=limit,
        )

        results = []
        for c in candidates:
            item = format_experience_dict(c)
            # Relevance scoring for search contract
            relevance = 0.95 if query else 1.0
            matched_terms = [query] if query else []
            item["relevance"] = relevance
            item["matched_terms"] = matched_terms
            item["ranking_method"] = "keyword"
            results.append(item)

        applied = {
            k: v
            for k, v in {
                "engineering_type": engineering_type,
                "company": company,
                "domain": domain,
                "expertise": expertise,
                "years_min": years_min,
                "years_max": years_max,
            }.items()
            if v is not None
        }

        return {
            "query": query,
            "count": len(results),
            "ranking_method": "keyword",
            "filters_applied": applied,
            "message": None if results else f"No experiences match '{query}'." if query else "No results found.",
            "results": results,
        }

    def create_experience(self, payload: dict) -> dict[str, Any]:
        """Transactional creation of an experience record."""
        # Ensure contributor exists or use a default
        contributor_id = payload.get("contributor_id")
        if not contributor_id or not self.user_repo.get_by_id(contributor_id):
            first_user = self.user_repo.list_all()
            if first_user:
                contributor_id = first_user[0].id
            else:
                # Create a default contributor
                contributor_id = "eng-001"
                self.user_repo.create(
                    User(
                        id=contributor_id,
                        name="Alex Morgan",
                        email="alex.morgan@northstardemo.internal",
                        role="Senior Protection Engineer",
                        company="Northstar Engineering",
                    )
                )

        exp_id = payload.get("id") or f"exp-{uuid.uuid4().hex[:8]}"
        data = {
            "id": exp_id,
            "title": payload.get("title") or "Captured Experience",
            "contributor_id": contributor_id,
            "domain_name": payload.get("domain") or payload.get("domain_name") or "General Engineering",
            "problem": payload.get("problem"),
            "context": payload.get("context"),
            "decision": payload.get("decision"),
            "reasoning": payload.get("reasoning"),
            "outcome": payload.get("outcome"),
            "lesson": payload.get("lesson"),
            "mistake": payload.get("mistake"),
            "root_cause": payload.get("root_cause"),
            "what_i_wish_i_knew": payload.get("what_i_wish_i_knew"),
            "source_type": payload.get("source_type", "capture"),
            "source_reference": payload.get("source_reference", "WisdomKernel Capture Tool"),
            "year": payload.get("year", 2026),
            "is_demo": payload.get("is_demo", False),
        }
        tags = payload.get("tags") or []
        created = self.repo.create(data, tags)
        self.db.commit()
        return format_experience_dict(created)

    def update_experience(self, experience_id: str, payload: dict) -> Optional[dict[str, Any]]:
        tags = payload.get("tags")
        updated = self.repo.update(experience_id, payload, tags)
        if not updated:
            return None
        self.db.commit()
        return format_experience_dict(updated)

    def delete_experience(self, experience_id: str) -> bool:
        success = self.repo.delete(experience_id)
        if success:
            self.db.commit()
        return success
