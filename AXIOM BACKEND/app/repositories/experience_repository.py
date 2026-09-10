"""
experience_repository.py
------------------------
Data access and database-level querying, filtering, search,
faceting, and pagination for Experiences.
"""

from __future__ import annotations

import datetime
from typing import Optional, Any
from sqlalchemy import select, func, or_, and_, desc
from sqlalchemy.orm import Session, joinedload

from app.database.models.experience import Experience
from app.database.models.user import User
from app.database.models.tag import Tag, experience_tags
from app.repositories.base_repository import BaseRepository
from app.repositories.domain_tag_repository import TagRepository, DomainRepository


class ExperienceRepository(BaseRepository[Experience]):
    def get_by_id(self, experience_id: str) -> Optional[Experience]:
        stmt = (
            select(Experience)
            .options(joinedload(Experience.contributor), joinedload(Experience.tags))
            .where(Experience.id == experience_id)
        )
        return self.db.execute(stmt).unique().scalar_one_or_none()

    def get_related(self, experience_id: str, domain_name: Optional[str], limit: int = 3) -> list[Experience]:
        if not domain_name:
            return []
        stmt = (
            select(Experience)
            .options(joinedload(Experience.contributor), joinedload(Experience.tags))
            .where(Experience.id != experience_id, Experience.domain_name == domain_name)
            .order_by(desc(Experience.year), desc(Experience.created_at))
            .limit(limit)
        )
        return list(self.db.execute(stmt).unique().scalars().all())

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
    ) -> tuple[list[Experience], int]:
        stmt = (
            select(Experience)
            .join(Experience.contributor)
            .options(joinedload(Experience.contributor), joinedload(Experience.tags))
        )
        count_stmt = select(func.count(func.distinct(Experience.id))).join(Experience.contributor)

        conditions = []
        if domain:
            conditions.append(Experience.domain_name.ilike(f"%{domain.strip()}%"))
        if role:
            conditions.append(User.role.ilike(f"%{role.strip()}%"))
        if experience_level:
            conditions.append(User.experience_level.ilike(f"%{experience_level.strip()}%"))
        if engineering_type:
            conditions.append(User.engineering_type.ilike(f"%{engineering_type.strip()}%"))
        if company:
            conditions.append(User.company.ilike(f"%{company.strip()}%"))
        if year is not None:
            conditions.append(Experience.year == year)

        if q:
            needle = f"%{q.strip()}%"
            # Match title, problem, lesson, root_cause or tag name
            q_condition = or_(
                Experience.title.ilike(needle),
                Experience.problem.ilike(needle),
                Experience.lesson.ilike(needle),
                Experience.root_cause.ilike(needle),
                Experience.id.in_(
                    select(experience_tags.c.experience_id)
                    .join(Tag, Tag.id == experience_tags.c.tag_id)
                    .where(Tag.name.ilike(needle))
                ),
            )
            conditions.append(q_condition)

        if conditions:
            stmt = stmt.where(and_(*conditions))
            count_stmt = count_stmt.where(and_(*conditions))

        total = self.db.execute(count_stmt).scalar() or 0

        # Sorting
        if sort == "seniority":
            stmt = stmt.order_by(desc(User.years_experience), desc(Experience.year), desc(Experience.created_at))
        else:
            stmt = stmt.order_by(desc(Experience.year), desc(User.years_experience), desc(Experience.created_at))

        stmt = stmt.limit(limit).offset(offset)
        results = list(self.db.execute(stmt).unique().scalars().all())
        return results, total

    def get_facets(self) -> dict[str, list[Any]]:
        """Retrieve distinct filter values directly from the database using SQL DISTINCT."""
        domains = [
            d for (d,) in self.db.execute(
                select(func.distinct(Experience.domain_name)).where(Experience.domain_name.isnot(None))
            ).all() if d
        ]
        roles = [
            r for (r,) in self.db.execute(
                select(func.distinct(User.role)).where(User.role.isnot(None))
            ).all() if r
        ]
        experience_levels = [
            lvl for (lvl,) in self.db.execute(
                select(func.distinct(User.experience_level)).where(User.experience_level.isnot(None))
            ).all() if lvl
        ]
        years = [
            y for (y,) in self.db.execute(
                select(func.distinct(Experience.year)).where(Experience.year.isnot(None)).order_by(desc(Experience.year))
            ).all() if y
        ]
        types = [
            t for (t,) in self.db.execute(
                select(func.distinct(User.engineering_type)).where(User.engineering_type.isnot(None))
            ).all() if t
        ]
        companies = [
            c for (c,) in self.db.execute(
                select(func.distinct(User.company)).where(User.company.isnot(None))
            ).all() if c
        ]

        # Extract distinct tags
        all_tags = [
            t for (t,) in self.db.execute(select(Tag.name).order_by(Tag.name)).all() if t
        ]

        return {
            "domains": sorted(domains),
            "roles": sorted(roles),
            "expertise": sorted(all_tags),
            "experience_levels": sorted(experience_levels),
            "years": years,
            "engineering_types": sorted(types),
            "companies": sorted(companies),
        }

    def search(
        self,
        query: Optional[str] = None,
        engineering_type: Optional[str] = None,
        company: Optional[str] = None,
        domain: Optional[str] = None,
        expertise: Optional[str] = None,
        years_min: Optional[int] = None,
        years_max: Optional[int] = None,
        limit: int = 10,
    ) -> list[Experience]:
        """Database-level candidate retrieval for search."""
        stmt = (
            select(Experience)
            .join(Experience.contributor)
            .options(joinedload(Experience.contributor), joinedload(Experience.tags))
        )
        conditions = []

        if engineering_type:
            conditions.append(User.engineering_type.ilike(f"%{engineering_type.strip()}%"))
        if company:
            conditions.append(User.company.ilike(f"%{company.strip()}%"))
        if domain:
            conditions.append(Experience.domain_name.ilike(f"%{domain.strip()}%"))
        if years_min is not None:
            conditions.append(User.years_experience >= years_min)
        if years_max is not None:
            conditions.append(User.years_experience <= years_max)

        if query:
            tokens = [t.strip() for t in query.split() if len(t.strip()) > 1]
            token_conditions = []
            for token in tokens:
                token_conditions.append(
                    or_(
                        Experience.title.ilike(f"%{token}%"),
                        Experience.problem.ilike(f"%{token}%"),
                        Experience.lesson.ilike(f"%{token}%"),
                        Experience.root_cause.ilike(f"%{token}%"),
                        Experience.decision.ilike(f"%{token}%"),
                        Experience.reasoning.ilike(f"%{token}%"),
                        Experience.domain_name.ilike(f"%{token}%"),
                        Experience.id.in_(
                            select(experience_tags.c.experience_id)
                            .join(Tag, Tag.id == experience_tags.c.tag_id)
                            .where(Tag.name.ilike(f"%{token}%"))
                        ),
                    )
                )
            if token_conditions:
                conditions.append(or_(*token_conditions))

        if conditions:
            stmt = stmt.where(and_(*conditions))

        # Default ordering by contributor seniority and recency
        stmt = stmt.order_by(desc(User.years_experience), desc(Experience.year)).limit(limit)
        return list(self.db.execute(stmt).unique().scalars().all())

    def create(self, data: dict, tag_names: list[str] | None = None) -> Experience:
        tag_repo = TagRepository(self.db)
        tags = tag_repo.get_or_create_many(tag_names or [])

        # Link domain if specified
        domain_name = data.get("domain_name") or data.get("domain")
        if domain_name:
            dom_repo = DomainRepository(self.db)
            domain_obj = dom_repo.get_or_create(domain_name)
            data["domain_id"] = domain_obj.id
            data["domain_name"] = domain_obj.name

        clean_data = {k: v for k, v in data.items() if hasattr(Experience, k)}
        exp = Experience(**clean_data)
        exp.tags = tags
        self.db.add(exp)
        self.db.flush()
        return exp

    def update(self, experience_id: str, data: dict, tag_names: list[str] | None = None) -> Optional[Experience]:
        exp = self.get_by_id(experience_id)
        if not exp:
            return None

        if tag_names is not None:
            tag_repo = TagRepository(self.db)
            exp.tags = tag_repo.get_or_create_many(tag_names)

        domain_name = data.get("domain_name") or data.get("domain")
        if domain_name:
            dom_repo = DomainRepository(self.db)
            domain_obj = dom_repo.get_or_create(domain_name)
            data["domain_id"] = domain_obj.id
            data["domain_name"] = domain_obj.name

        for k, v in data.items():
            if hasattr(exp, k) and k not in ("id", "tags"):
                setattr(exp, k, v)
        exp.updated_at = datetime.datetime.now(datetime.timezone.utc)
        self.db.flush()
        return exp

    def delete(self, experience_id: str) -> bool:
        exp = self.get_by_id(experience_id)
        if not exp:
            return False
        self.db.delete(exp)
        self.db.flush()
        return True
