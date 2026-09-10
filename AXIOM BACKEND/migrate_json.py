"""
migrate_json.py
---------------
Transforms and loads existing JSON demo data into MySQL database.
Guarantees idempotency: running multiple times never duplicates records.
"""

from __future__ import annotations

import json
import logging
import os
import sys
from typing import Any

# Ensure backend root is in sys.path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from sqlalchemy.orm import Session
from sqlalchemy import select, func

from app.database.connection import SessionLocal
from app.database.models import (
    User,
    Organization,
    OrganizationMember,
    Domain,
    Tag,
    Experience,
    Mistake,
    Advice,
    SimulatorScenario,
    SimulatorStep,
    SimulatorDecisionOption,
    OrganizationKnowledge,
)
from app.repositories.user_repository import UserRepository
from app.repositories.organization_repository import OrganizationRepository
from app.repositories.domain_tag_repository import DomainRepository, TagRepository
from app.repositories.experience_repository import ExperienceRepository
from app.repositories.mistake_repository import MistakeRepository
from app.repositories.advice_repository import AdviceRepository
from app.repositories.simulator_repository import SimulatorRepository
from app.repositories.knowledge_repository import KnowledgeRepository

logger = logging.getLogger("wisdomkernel.migrate")
logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)-7s | %(message)s")


def _read_json(filepath: str) -> Any:
    with open(filepath, "r", encoding="utf-8") as f:
        return json.load(f)


def _resolve_data_dir() -> str:
    candidates = [
        os.path.join(BASE_DIR, "data"),
        BASE_DIR,
    ]
    for c in candidates:
        if os.path.exists(os.path.join(c, "experiences.json")):
            return c
    raise FileNotFoundError("Could not locate existing JSON data files.")


def run_migration(db: Session, data_dir: str | None = None) -> dict[str, int]:
    """
    Idempotent migration of all JSON records into MySQL.
    """
    resolved_dir = data_dir or _resolve_data_dir()
    logger.info("Migrating JSON data from: %s", resolved_dir)

    user_repo = UserRepository(db)
    org_repo = OrganizationRepository(db)
    dom_repo = DomainRepository(db)
    tag_repo = TagRepository(db)
    exp_repo = ExperienceRepository(db)
    mis_repo = MistakeRepository(db)
    adv_repo = AdviceRepository(db)
    sim_repo = SimulatorRepository(db)
    know_repo = KnowledgeRepository(db)

    # 1. Engineers -> Users
    engineers_file = os.path.join(resolved_dir, "engineers.json")
    if os.path.exists(engineers_file):
        engineers_data = _read_json(engineers_file)
        for eng in engineers_data:
            eng_id = eng["id"]
            email_slug = eng["name"].lower().replace(" ", ".")
            company_slug = eng.get("company", "demo").lower().replace(" ", "")
            email = f"{email_slug}@{company_slug}.internal"
            user_data = {
                "id": eng_id,
                "name": eng["name"],
                "email": email,
                "role": eng.get("role"),
                "expertise": eng.get("expertise"),
                "experience_level": eng.get("experience_level"),
                "years_experience": eng.get("years_experience", 0),
                "company": eng.get("company"),
                "engineering_type": eng.get("engineering_type"),
                "domain": eng.get("domain"),
                "bio": eng.get("bio"),
                "retired": eng.get("retired", False),
            }
            user_repo.upsert(user_data)
        logger.info("Migrated %d engineers to users table.", len(engineers_data))

    # Helper mapping engineer name -> user_id
    all_users = user_repo.list_all()
    user_name_to_id = {u.name.strip().lower(): u.id for u in all_users}

    # 2. Organizations
    orgs_file = os.path.join(resolved_dir, "organizations.json")
    if os.path.exists(orgs_file):
        orgs_data = _read_json(orgs_file)
        for o in orgs_data:
            org_data = {
                "id": o["id"],
                "name": o["name"],
                "slug": o["slug"],
                "industry": o.get("industry"),
                "description": o.get("_note"),
                "password_salt": o.get("password_salt"),
                "password_sha256": o.get("password_sha256"),
                "is_demo": o.get("is_demo", True),
            }
            org_repo.upsert(org_data)
        logger.info("Migrated %d organizations.", len(orgs_data))

    # 2b. Organization Memberships
    for u in all_users:
        if u.company:
            comp_lower = u.company.lower()
            target_org = None
            if "northstar" in comp_lower or "northwind" in comp_lower:
                target_org = "org-003"
            elif "meridian" in comp_lower:
                target_org = "org-002"

            if target_org:
                member_id = f"mem-{target_org}-{u.id}"
                org_repo.add_member(member_id, target_org, u.id, role="senior_engineer")

    # 3. Experiences + Tags
    exp_file = os.path.join(resolved_dir, "experiences.json")
    if os.path.exists(exp_file):
        exp_data = _read_json(exp_file)
        for e in exp_data:
            domain_name = e.get("domain") or "General Engineering"
            domain_obj = dom_repo.get_or_create(domain_name)
            tags_list = e.get("tags") or []
            tag_objs = tag_repo.get_or_create_many(tags_list)

            exp_dict = {
                "id": e["id"],
                "title": e["title"],
                "contributor_id": e.get("engineer_id") or (all_users[0].id if all_users else "eng-001"),
                "domain_id": domain_obj.id,
                "domain_name": domain_obj.name,
                "problem": e.get("problem"),
                "context": e.get("context"),
                "decision": e.get("decision"),
                "reasoning": e.get("reasoning"),
                "outcome": e.get("outcome"),
                "lesson": e.get("lesson"),
                "mistake": e.get("mistake"),
                "root_cause": e.get("root_cause"),
                "what_i_wish_i_knew": e.get("what_i_wish_i_knew"),
                "source_type": "interview",
                "source_reference": e.get("source"),
                "year": e.get("year"),
                "verification_status": "verified",
                "is_demo": e.get("is_demo", True),
            }

            existing_exp = exp_repo.get_by_id(e["id"])
            if existing_exp:
                for k, v in exp_dict.items():
                    if hasattr(existing_exp, k) and k != "id":
                        setattr(existing_exp, k, v)
                existing_exp.tags = tag_objs
            else:
                new_exp = Experience(**exp_dict)
                new_exp.tags = tag_objs
                db.add(new_exp)
            db.flush()
        logger.info("Migrated %d experiences.", len(exp_data))

    # 4. Mistakes
    mis_file = os.path.join(resolved_dir, "mistakes.json")
    if os.path.exists(mis_file):
        mis_data = _read_json(mis_file)
        for m in mis_data:
            domain_name = m.get("domain") or "General Engineering"
            domain_obj = dom_repo.get_or_create(domain_name)

            engineer_name = m.get("engineer", "").strip().lower()
            contributor_id = user_name_to_id.get(engineer_name)

            mis_dict = {
                "id": m["id"],
                "title": m["title"],
                "domain_id": domain_obj.id,
                "domain_name": domain_obj.name,
                "contributor_id": contributor_id,
                "category": m.get("category"),
                "wrong_assumption": m.get("wrong_assumption"),
                "what_happened": m.get("actual_cause"),
                "root_cause": m.get("actual_cause"),
                "what_we_did": m.get("what_we_did"),
                "what_we_should_have_done": m.get("what_we_should_have_done"),
                "lesson": m.get("lesson"),
                "mistake_to_avoid": m.get("mistake_to_avoid"),
                "year": m.get("year"),
                "is_demo": m.get("is_demo", True),
            }
            mis_repo.upsert(mis_dict)
        logger.info("Migrated %d mistakes.", len(mis_data))

    # 5. Advice
    adv_file = os.path.join(resolved_dir, "advice.json")
    if os.path.exists(adv_file):
        adv_data = _read_json(adv_file)
        for a in adv_data:
            engineer_name = a.get("engineer_name", "").strip().lower()
            contributor_id = user_name_to_id.get(engineer_name)
            adv_dict = {
                "id": a["id"],
                "title": f"Advice on {a.get('category')}",
                "advice": a["advice"],
                "category": a.get("category", "General"),
                "contributor_id": contributor_id,
                "is_demo": a.get("is_demo", True),
            }
            adv_repo.upsert(adv_dict)
        logger.info("Migrated %d advice records.", len(adv_data))

    # 6. Simulator Scenarios
    sim_file = os.path.join(resolved_dir, "simulator_scenarios.json")
    if os.path.exists(sim_file):
        sim_data = _read_json(sim_file)
        for s in sim_data:
            domain_name = s.get("domain") or "Distributed Systems"
            domain_obj = dom_repo.get_or_create(domain_name)
            s["domain_id"] = domain_obj.id
            sim_repo.upsert_scenario(s)
        logger.info("Migrated %d simulator scenarios.", len(sim_data))

    # 7. Organization Knowledge Vault
    org_data_file = os.path.join(resolved_dir, "organization_data.json")
    if os.path.exists(org_data_file):
        org_data_dict = _read_json(org_data_file)
        for org_id, sections in org_data_dict.items():
            if not isinstance(sections, dict):
                continue

            for section_name, section_content in sections.items():
                if section_name in ("kri", "dashboard"):
                    # Single object section
                    item_id = f"kno-{org_id}-{section_name}"
                    know_repo.upsert_item(
                        item_id=item_id,
                        organization_id=org_id,
                        title=f"{org_id.upper()} {section_name.upper()} Summary",
                        category=section_name,
                        content=section_content,
                    )
                elif isinstance(section_content, list):
                    for idx, item in enumerate(section_content, start=1):
                        item_id = item.get("id") or f"kno-{org_id}-{section_name[:4]}-{idx:03d}"
                        item_title = item.get("title") or item.get("symptom") or item.get("person_name") or f"{section_name.capitalize()} #{idx}"
                        know_repo.upsert_item(
                            item_id=item_id,
                            organization_id=org_id,
                            title=item_title,
                            category=section_name,
                            content=item,
                        )
        logger.info("Migrated private organization knowledge vault for orgs: %s", list(org_data_dict.keys()))

    db.commit()

    # Calculate final counts
    counts = {
        "users": db.execute(select(func.count(User.id))).scalar() or 0,
        "organizations": db.execute(select(func.count(Organization.id))).scalar() or 0,
        "organization_members": db.execute(select(func.count(OrganizationMember.id))).scalar() or 0,
        "domains": db.execute(select(func.count(Domain.id))).scalar() or 0,
        "tags": db.execute(select(func.count(Tag.id))).scalar() or 0,
        "experiences": db.execute(select(func.count(Experience.id))).scalar() or 0,
        "mistakes": db.execute(select(func.count(Mistake.id))).scalar() or 0,
        "advice": db.execute(select(func.count(Advice.id))).scalar() or 0,
        "simulator_scenarios": db.execute(select(func.count(SimulatorScenario.id))).scalar() or 0,
        "simulator_steps": db.execute(select(func.count(SimulatorStep.id))).scalar() or 0,
        "simulator_decision_options": db.execute(select(func.count(SimulatorDecisionOption.id))).scalar() or 0,
        "organization_knowledge": db.execute(select(func.count(OrganizationKnowledge.id))).scalar() or 0,
    }

    logger.info("Migration complete! Database record counts: %s", counts)
    return counts


if __name__ == "__main__":
    db = SessionLocal()
    try:
        counts = run_migration(db)
        print("\n" + "=" * 50)
        print("WISDOMKERNEL DATABASE MIGRATION SUMMARY")
        print("=" * 50)
        for k, v in counts.items():
            print(f"  {k:30s} : {v}")
        print("=" * 50)
    finally:
        db.close()
