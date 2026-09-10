"""
test_database.py
----------------
Comprehensive test suite for WisdomKernel Database Layer.
Covers all requirements from Prompt Section 40.
"""

from __future__ import annotations

import os
import uuid
import pytest
from sqlalchemy import create_engine, select, func, event
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.exc import IntegrityError

# Use a fresh test database for each run
TEST_DB_FILE = "test_wisdomkernel.db"
if os.path.exists(TEST_DB_FILE):
    try:
        os.remove(TEST_DB_FILE)
    except OSError:
        pass

os.environ["DATABASE_URL"] = f"sqlite:///{TEST_DB_FILE}"

from app.database.base import Base
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
    SimulatorAttempt,
    OrganizationKnowledge,
)
from app.database.connection import check_database_connection, get_database_url
from app.repositories import (
    UserRepository,
    OrganizationRepository,
    DomainRepository,
    TagRepository,
    ExperienceRepository,
    MistakeRepository,
    AdviceRepository,
    SimulatorRepository,
    KnowledgeRepository,
)
from app.services import (
    ExperienceService,
    MistakeService,
    AdviceService,
    SimulatorService,
    OrganizationService,
)
from migrate_json import run_migration


@pytest.fixture(scope="session")
def engine():
    db_url = get_database_url()
    eng = create_engine(db_url, connect_args={"check_same_thread": False})
    
    @event.listens_for(eng, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

    Base.metadata.create_all(bind=eng)
    return eng


@pytest.fixture(scope="session")
def session_factory(engine):
    return sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session", autouse=True)
def seed_data(session_factory):
    session = session_factory()
    try:
        run_migration(session)
    finally:
        session.close()


@pytest.fixture
def db(session_factory):
    session = session_factory()
    try:
        yield session
    finally:
        session.rollback()
        session.close()


# 1. Database connection
def test_database_connection():
    health = check_database_connection()
    assert health["status"] == "connected"
    assert health.get("tables_count", 0) >= 10


# 2. Create experience
def test_create_experience(db: Session):
    service = ExperienceService(db)
    unique_id = f"exp-test-{uuid.uuid4().hex[:6]}"
    created = service.create_experience({
        "id": unique_id,
        "title": "Handling High Voltage Ground Fault",
        "problem": "Substation ground fault on 132kV breaker.",
        "context": "Occurred during a summer thunderstorm.",
        "decision": "Isolated the bus and checked the surge arrestor.",
        "reasoning": "Surge arrestors degrade after lightning surges.",
        "outcome": "Fault cleared after arrestor replacement.",
        "lesson": "Always inspect surge arrestors after thunderstorm trips.",
        "mistake": "Initially suspected the breaker mechanism.",
        "root_cause": "Arrestor internal flashover.",
        "what_i_wish_i_knew": "Test leakage current before energizing.",
        "domain": "Power Distribution",
        "tags": ["high-voltage", "ground-fault", "substation"],
        "year": 2024,
    })

    assert created["id"] == unique_id
    assert created["title"] == "Handling High Voltage Ground Fault"
    assert "substation" in created["tags"]


# 3. Read experience
def test_read_experience(db: Session):
    service = ExperienceService(db)
    detail = service.get_experience_detail("exp-001")
    assert detail is not None
    exp = detail["experience"]
    assert exp["id"] == "exp-001"
    assert exp["title"] == "Repeated transformer trips during monsoon load peaks"
    assert exp["problem"] is not None
    assert exp["decision"] is not None
    assert exp["lesson"] is not None
    assert exp["root_cause"] is not None
    assert exp["what_i_wish_i_knew"] is not None


# 4. Update experience
def test_update_experience(db: Session):
    service = ExperienceService(db)
    updated = service.update_experience("exp-001", {
        "title": "Repeated transformer trips during monsoon load peaks (Updated)",
    })
    assert updated is not None
    assert updated["title"] == "Repeated transformer trips during monsoon load peaks (Updated)"


# 5. Search experience
def test_search_experience(db: Session):
    service = ExperienceService(db)
    res = service.search_experiences(query="transformer")
    assert res["count"] > 0
    assert any("transformer" in r["title"].lower() for r in res["results"])


# 6. Experience relationships & tags
def test_experience_relationships(db: Session):
    repo = ExperienceRepository(db)
    exp = repo.get_by_id("exp-001")
    assert exp is not None
    assert exp.contributor is not None
    assert exp.contributor.name == "Alex Morgan"
    assert len(exp.tags) > 0
    tag_names = [t.name for t in exp.tags]
    assert "protection" in tag_names


# 7 & 8. Create and read mistake
def test_create_and_read_mistake(db: Session):
    mis_repo = MistakeRepository(db)
    unique_id = f"mis-test-{uuid.uuid4().hex[:6]}"
    mis = mis_repo.create({
        "id": unique_id,
        "title": "Over-indexing a multi-tenant database table",
        "wrong_assumption": "Indexes are free reads.",
        "actual_cause": "Write amplification choked disk I/O.",
        "what_we_did": "Added 12 composite indexes.",
        "what_we_should_have_done": "Profiled slow queries first.",
        "lesson": "Every index is a write tax.",
        "mistake_to_avoid": "Adding indexes blindly.",
        "domain_name": "Database",
        "category": "Database",
        "year": 2025,
    })
    db.commit()

    fetched = mis_repo.get_by_id(unique_id)
    assert fetched is not None
    assert fetched.title == "Over-indexing a multi-tenant database table"
    assert fetched.category == "Database"


# 9 & 10. Create and read advice
def test_create_and_read_advice(db: Session):
    adv_repo = AdviceRepository(db)
    unique_id = f"adv-test-{uuid.uuid4().hex[:6]}"
    adv = adv_repo.create({
        "id": unique_id,
        "title": "Advice on Architecture",
        "advice": "Keep your service boundaries aligned with data lifecycle.",
        "category": "Architecture",
    })
    db.commit()

    service = AdviceService(db)
    res = service.list_advice(category="Architecture")
    assert res["count"] > 0
    assert any(a["id"] == unique_id for a in res["advice"])


# 11. Retrieve simulator scenario
def test_retrieve_simulator_scenario(db: Session):
    service = SimulatorService(db)
    scenarios = service.list_scenarios(scenario_id="incident-001")
    assert len(scenarios) == 1
    sc = scenarios[0]
    assert sc["id"] == "incident-001"
    assert len(sc["steps"]) >= 2
    for step in sc["steps"]:
        assert len(step["options"]) >= 2
        assert any(opt["correct"] for opt in step["options"])


# 12. Create simulator attempt
def test_create_simulator_attempt(db: Session):
    service = SimulatorService(db)
    result = service.record_attempt_and_score(
        correct_answers=2,
        total_questions=3,
        scenario_id="incident-001",
        time_taken_seconds=120,
    )
    assert result["score"] == 67
    assert result["band"] in ("Developing", "Proficient", "Expert")

    attempts = db.execute(
        select(SimulatorAttempt).where(SimulatorAttempt.scenario_id == "incident-001")
    ).scalars().all()
    assert len(attempts) > 0


# 13. Organization isolation
def test_organization_isolation(db: Session):
    service = OrganizationService(db)
    meridian_vault = service.get_section_data("org-002", "vault")
    northstar_vault = service.get_section_data("org-003", "vault")

    assert len(meridian_vault) > 0
    assert len(northstar_vault) > 0

    meridian_ids = {item["id"] for item in meridian_vault}
    northstar_ids = {item["id"] for item in northstar_vault}

    assert meridian_ids.isdisjoint(northstar_ids)


# 14. Organization knowledge retrieval for all sections
def test_organization_knowledge_retrieval(db: Session):
    service = OrganizationService(db)
    sections = ["vault", "onboarding", "troubleshooting", "postmortems", "retirement", "kri", "dashboard"]
    for s in sections:
        data = service.get_section_data("org-003", s)
        assert data is not None


# 15. Pagination
def test_pagination(db: Session):
    service = ExperienceService(db)
    p1 = service.list_experiences(limit=2, offset=0)
    p2 = service.list_experiences(limit=2, offset=2)

    assert len(p1["experiences"]) <= 2
    assert len(p2["experiences"]) <= 2
    if p1["experiences"] and p2["experiences"]:
        assert p1["experiences"][0]["id"] != p2["experiences"][0]["id"]


# 16. Foreign key validation
def test_foreign_key_validation(db: Session):
    invalid_exp = Experience(
        id="exp-invalid-fk",
        title="Invalid Foreign Key",
        contributor_id="nonexistent-user-id",
    )
    db.add(invalid_exp)
    with pytest.raises(IntegrityError):
        db.flush()
    db.rollback()


# 17. Duplicate handling / Idempotency
def test_duplicate_handling_idempotency(db: Session):
    counts_1 = run_migration(db)
    counts_2 = run_migration(db)
    assert counts_1 == counts_2


# 18. Transaction rollback
def test_transaction_rollback(db: Session):
    user_repo = UserRepository(db)
    initial_user_count = len(user_repo.list_all())

    try:
        u = User(
            id="user-rollback-test",
            name="Rollback Test User",
            email="rollback.test@demo.internal",
        )
        db.add(u)
        db.flush()
        raise RuntimeError("Simulated transaction failure")
    except RuntimeError:
        db.rollback()

    assert len(user_repo.list_all()) == initial_user_count
