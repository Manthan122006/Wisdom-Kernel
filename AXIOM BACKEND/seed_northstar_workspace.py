"""
seed_northstar_workspace.py
----------------------------
Seeds Northstar Engineering demo organization, users with RBAC roles (HEAD_ADMIN, SENIOR_ENGINEER, JUNIOR_EMPLOYEE),
experiences, learner feedback, discussion comments, in-app telemetry activity, saved experiences, and knowledge relationships into Aiven MySQL.
"""

import sys
import os
import datetime
import uuid
import random
import hashlib
from sqlalchemy import text

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database.connection import get_engine, SessionLocal
from app.database.models import (
    Base,
    User,
    Organization,
    OrganizationMember,
    Experience,
    ExperienceFeedback,
    ExperienceComment,
    ExperienceStatusHistory,
    ExperienceRelationship,
    KnowledgeActivity,
    SavedExperience,
    KnowledgeReview,
)

def add_columns_if_missing(engine):
    """Ensure all required columns exist in MySQL."""
    cols = [
        ("users", "role", "VARCHAR(128) NULL"),
        ("users", "department", "VARCHAR(128) NULL"),
        ("users", "status", "VARCHAR(64) DEFAULT 'Active'"),
        ("experiences", "knowledge_status", "VARCHAR(50) DEFAULT 'CURRENT'"),
        ("experiences", "last_reviewed_at", "DATETIME NULL"),
        ("experiences", "review_source", "VARCHAR(255) NULL"),
        ("experiences", "valid_context", "TEXT NULL"),
        ("experiences", "invalid_context", "TEXT NULL"),
    ]
    with engine.begin() as conn:
        for tbl, col_name, col_type in cols:
            try:
                conn.execute(text(f"ALTER TABLE {tbl} ADD COLUMN {col_name} {col_type};"))
                print(f"Added '{col_name}' to '{tbl}'.")
            except Exception as e:
                pass

def hash_pw(salt: str, password: str) -> str:
    return hashlib.sha256((salt + password).encode("utf-8")).hexdigest()

def seed():
    engine = get_engine()
    print("Migrating schema columns...")
    add_columns_if_missing(engine)

    print("Creating all tables in MySQL...")
    Base.metadata.create_all(bind=engine)
    print("Schema verified.")

    db = SessionLocal()
    try:
        # 1. Create or update Demo Organization: Northstar Engineering
        salt = "northstar_salt_2026"
        org_id = "org-northstar"
        org = db.query(Organization).filter((Organization.id == org_id) | (Organization.name == "Northstar Engineering")).first()
        if not org:
            org = Organization(
                id=org_id,
                name="Northstar Engineering",
                slug="northstar",
                industry="Software & Platform Engineering",
                description="Enterprise High-Performance Platform & Cloud Infrastructure Team",
                password_salt=salt,
                password_sha256=hash_pw(salt, "NorthstarHead@2026"),
                is_demo=True,
            )
            db.add(org)
            db.commit()
            print("Created Organization 'Northstar Engineering'.")
        else:
            org_id = org.id
            org.password_salt = salt
            org.password_sha256 = hash_pw(salt, "NorthstarHead@2026")
            db.commit()
            print(f"Updated Organization '{org.name}' ({org.id}).")

        # Also create default org-002 if needed
        org_002 = db.query(Organization).filter(Organization.id == "org-002").first()
        if not org_002:
            db.add(Organization(
                id="org-002",
                name="Meridian Cloud Labs",
                slug="meridian",
                password_salt="salt_002",
                password_sha256=hash_pw("salt_002", "meridian@2026"),
                is_demo=True,
            ))
            db.commit()

        # 2. Seed Users for Northstar Engineering
        users_def = [
            # HEAD / ADMIN
            ("usr-head-01", "Ananya Mehta", "head@northstar.demo", "HEAD_ADMIN", "Engineering Leadership", "Principal", 16, "NorthstarHead@2026"),
            # SENIOR ENGINEERS
            ("usr-snr-01", "Vikram Rao", "senior@northstar.demo", "SENIOR_ENGINEER", "Platform Engineering", "Senior", 12, "NorthstarSenior@2026"),
            ("usr-snr-02", "Neha Shah", "neha@northstar.demo", "SENIOR_ENGINEER", "Backend Systems", "Senior", 10, "NorthstarSenior@2026"),
            ("usr-snr-03", "Arjun Menon", "arjun@northstar.demo", "SENIOR_ENGINEER", "Cloud Infrastructure", "Veteran", 14, "NorthstarSenior@2026"),
            ("usr-snr-04", "Meera Iyer", "meera@northstar.demo", "SENIOR_ENGINEER", "Security Engineering", "Senior", 9, "NorthstarSenior@2026"),
            # JUNIOR EMPLOYEES
            ("usr-jnr-01", "Riya Shah", "junior@northstar.demo", "JUNIOR_EMPLOYEE", "Backend", "Junior", 2, "NorthstarJunior@2026"),
            ("usr-jnr-02", "Kabir Joshi", "kabir@northstar.demo", "JUNIOR_EMPLOYEE", "Platform", "Junior", 1, "NorthstarJunior@2026"),
            ("usr-jnr-03", "Aarav Mehta", "aarav@northstar.demo", "JUNIOR_EMPLOYEE", "Cloud", "Junior", 2, "NorthstarJunior@2026"),
            ("usr-jnr-04", "Ishita Patel", "ishita@northstar.demo", "JUNIOR_EMPLOYEE", "QA", "Junior", 1, "NorthstarJunior@2026"),
            ("usr-jnr-05", "Dev Malhotra", "dev@northstar.demo", "JUNIOR_EMPLOYEE", "Security", "Junior", 2, "NorthstarJunior@2026"),
            ("usr-jnr-06", "Tanvi Desai", "tanvi@northstar.demo", "JUNIOR_EMPLOYEE", "Backend", "Junior", 1, "NorthstarJunior@2026"),
            ("usr-jnr-07", "Aditya Kulkarni", "aditya@northstar.demo", "JUNIOR_EMPLOYEE", "DevOps", "Junior", 2, "NorthstarJunior@2026"),
            ("usr-jnr-08", "Sara Khan", "sara@northstar.demo", "JUNIOR_EMPLOYEE", "Platform", "Junior", 1, "NorthstarJunior@2026"),
        ]

        for uid, name, email, role, dept, level, yrs, pw in users_def:
            u = db.query(User).filter((User.id == uid) | (User.email == email)).first()
            if not u:
                u = User(
                    id=uid,
                    name=name,
                    email=email,
                    role=role,
                    department=dept,
                    experience_level=level,
                    years_experience=yrs,
                    company="Northstar Engineering",
                )
                db.add(u)
                db.commit()
            else:
                u.role = role
                u.department = dept
                u.name = name
                db.commit()

            # Membership
            mem = db.query(OrganizationMember).filter(
                (OrganizationMember.user_id == u.id) & (OrganizationMember.organization_id == org_id)
            ).first()
            if not mem:
                db.add(OrganizationMember(
                    id=f"mem-{u.id}",
                    organization_id=org_id,
                    user_id=u.id,
                    role=role.lower(),
                ))
                db.commit()

        print(f"Seeded {len(users_def)} RBAC Users for Northstar Engineering.")

        # 3. Seed Experiences
        exps_data = [
            ("exp-ns-001", "Zero-Downtime PostgreSQL 15 Migration under High Traffic", "usr-snr-01", "Database", "CURRENT", 2026, "Migrating 45M rows while serving 12,000 req/sec without write locking."),
            ("exp-ns-002", "Handling Kubernetes Worker Node Memory Pressure Outage", "usr-snr-01", "Deployment", "CURRENT", 2026, "Preventing cascading pod evictions during traffic surges."),
            ("exp-ns-003", "Legacy Payment Infrastructure Rollback & Isolation", "usr-snr-01", "Infrastructure", "OUTDATED", 2023, "Handling legacy bare-metal gateway deadlocks before containerization."),
            ("exp-ns-004", "Preventing OAuth2 Refresh Token Race Conditions", "usr-snr-02", "Security", "CURRENT", 2026, "Eliminating double-token invalidation bug across multiple SPA tabs."),
            ("exp-ns-005", "Redis Cluster Connection Pool Exhaustion Incident", "usr-snr-02", "Performance", "AGING", 2025, "Troubleshooting 504 Gateway Timeouts under sudden microservice scaling."),
            ("exp-ns-006", "Terraform Drift Detection in Multi-Region AWS Setup", "usr-snr-03", "Cloud", "CURRENT", 2026, "Automating drift remediation for VPC peering and IAM policies."),
            ("exp-ns-007", "Debugging gRPC Deadlocks in Distributed Microservices", "usr-snr-02", "Architecture", "CURRENT", 2026, "Identifying circular channel wait-state bugs using tracing."),
            ("exp-ns-008", "Mitigating Service Mesh mTLS Certificate Renewal Outages", "usr-snr-04", "Security", "CURRENT", 2026, "Handling automated cert rotation without breaking persistent websockets."),
            ("exp-ns-009", "Optimizing Elasticsearch Index Sharding for 100GB Daily Logs", "usr-snr-03", "Data", "AGING", 2025, "Scaling log aggregation indexing speed by 4x."),
            ("exp-ns-010", "Kafka Consumer Rebalance Storm Prevention Strategy", "usr-snr-01", "Platform", "CURRENT", 2026, "Tuning heartbeat intervals during long-running batch ingestion."),
        ]

        now = datetime.datetime.now(datetime.timezone.utc)
        for eid, title, cid, domain, status_val, yr, prob in exps_data:
            exp = db.query(Experience).filter(Experience.id == eid).first()
            if not exp:
                exp = Experience(
                    id=eid,
                    title=title,
                    contributor_id=cid,
                    domain_name=domain,
                    problem=prob,
                    context="Northstar Engineering Production Cloud & Bare-Metal Hybrid Infrastructure",
                    decision="Executed phased canary deployment with blue-green failover strategy.",
                    reasoning="Canary verification ensured 99.999% availability with instant rollback capability.",
                    outcome="Zero user-facing error rate during traffic cutover.",
                    lesson="Always validate connection pool drain timeouts prior to executing DDL migrations.",
                    mistake="Assuming automatic connection retries would handle transient DB lock waits.",
                    root_cause="Default connection pool timeout was set to 30s instead of 3s canary threshold.",
                    what_i_wish_i_knew="Setting lock_timeout explicitly in session parameters prevents table lock escalation.",
                    year=yr,
                    knowledge_status=status_val,
                    last_reviewed_at=now - datetime.timedelta(days=random.randint(5, 60)),
                    review_source="Northstar Engineering Architecture Review Board",
                    source_type="RECORDED_DEBRIEF",
                )
                db.add(exp)

        db.commit()
        print(f"Seeded {len(exps_data)} Experience records.")

        # 4. Seed Feedback (50+ records)
        db.query(ExperienceFeedback).filter(ExperienceFeedback.experience_id.like("exp-ns-%")).delete(synchronize_session=False)
        jnr_users = [u for u in users_def if u[3] == "JUNIOR_EMPLOYEE"]
        for eid, _, _, _, _, _, _ in exps_data:
            for j in range(random.randint(5, 12)):
                u_id, u_name, _, _, _, _, _, _ = jnr_users[j % len(jnr_users)]
                ftype = random.choices(["EFFECTIVE", "PARTIALLY_EFFECTIVE", "NOT_APPLICABLE"], weights=[70, 20, 10])[0]
                db.add(ExperienceFeedback(
                    id=f"fbk-ns-{uuid.uuid4().hex[:8]}",
                    experience_id=eid,
                    user_id=f"{u_id}-{j}",
                    user_name=f"{u_name} ({j+1})",
                    feedback_type=ftype,
                    created_at=now - datetime.timedelta(days=random.randint(1, 30))
                ))
        db.commit()
        print("Seeded 60+ Learner Feedback records.")

        # 5. Seed Discussion Comments (30+ records)
        db.query(ExperienceComment).filter(ExperienceComment.experience_id.like("exp-ns-%")).delete(synchronize_session=False)
        comments_pool = [
            "Applied this canary strategy during our API upgrade last week—worked perfectly!",
            "Great lesson on connection pool timeouts. Added explicit lock_timeout parameters.",
            "Would recommend testing this with smaller batch sizes when running on lower-spec pods.",
            "Saved our team during the PostgreSQL upgrade on Tuesday. Thanks for recording this!",
            "CONTRIBUTOR RESPONSE: Make sure to check pg_stat_activity before triggering step 3."
        ]
        for eid, _, cid, _, _, _, _ in exps_data[:6]:
            for k in range(random.randint(3, 6)):
                u_id, u_name, _, role, dept, _, _, _ = users_def[k % len(users_def)]
                db.add(ExperienceComment(
                    id=f"cmt-ns-{uuid.uuid4().hex[:8]}",
                    experience_id=eid,
                    user_id=u_id,
                    user_name=u_name,
                    user_role=f"{dept} ({role})",
                    comment=comments_pool[k % len(comments_pool)],
                    created_at=now - datetime.timedelta(days=random.randint(1, 15))
                ))
        db.commit()
        print("Seeded 30+ Discussion Comments.")

        # 6. Seed Telemetry Activity (150+ records) for Northstar
        db.query(KnowledgeActivity).filter(KnowledgeActivity.organization_id == org_id).delete(synchronize_session=False)
        activities = []
        queries = ["Kubernetes Rollback", "Database Failover", "Zero-Downtime Deployment", "OAuth2 Token Race", "Redis Timeout"]

        for _, u_name, _, _, _, _, _, _ in users_def:
            # Views
            for _ in range(random.randint(8, 20)):
                activities.append(KnowledgeActivity(
                    id=f"act-ns-{uuid.uuid4().hex[:8]}",
                    organization_id=org_id,
                    user_id=f"usr-{hash(u_name)%1000}",
                    user_name=u_name,
                    experience_id=random.choice(exps_data)[0],
                    activity_type="VIEWED_EXPERIENCE",
                    created_at=now - datetime.timedelta(days=random.randint(1, 20))
                ))
            # Searches
            for q in queries:
                activities.append(KnowledgeActivity(
                    id=f"act-ns-{uuid.uuid4().hex[:8]}",
                    organization_id=org_id,
                    user_id=f"usr-{hash(u_name)%1000}",
                    user_name=u_name,
                    activity_type="SEARCHED",
                    query=q,
                    created_at=now - datetime.timedelta(days=random.randint(1, 20))
                ))
            # Simulations & Saves
            for _ in range(3):
                activities.append(KnowledgeActivity(
                    id=f"act-ns-{uuid.uuid4().hex[:8]}",
                    organization_id=org_id,
                    user_id=f"usr-{hash(u_name)%1000}",
                    user_name=u_name,
                    activity_type=random.choice(["STARTED_SIMULATION", "COMPLETED_SIMULATION", "SAVED_EXPERIENCE"]),
                    created_at=now - datetime.timedelta(days=random.randint(1, 20))
                ))

        db.add_all(activities)
        db.commit()
        print(f"Seeded {len(activities)} Telemetry Activity records for Northstar Engineering.")

        # 7. Seed Saved Experiences (30+ records)
        db.query(SavedExperience).delete(synchronize_session=False)
        saved_list = []
        for uid, _, _, role, _, _, _, _ in users_def:
            if role == "JUNIOR_EMPLOYEE":
                for exp in exps_data[:4]:
                    saved_list.append(SavedExperience(
                        id=f"sav-{uuid.uuid4().hex[:8]}",
                        user_id=uid,
                        experience_id=exp[0],
                        created_at=now - datetime.timedelta(days=random.randint(1, 10))
                    ))
        db.add_all(saved_list)
        db.commit()
        print("Seeded 30+ Saved Experiences for Junior Employees.")

        # 8. Seed Knowledge Relationships (Evolution)
        db.query(ExperienceRelationship).filter(ExperienceRelationship.source_experience_id.like("exp-ns-%")).delete(synchronize_session=False)
        rel1 = ExperienceRelationship(
            id=f"rel-ns-01",
            source_experience_id="exp-ns-003", # Older bare metal
            target_experience_id="exp-ns-001", # Current Postgres
            relationship_type="SUPERSEDES"
        )
        rel2 = ExperienceRelationship(
            id=f"rel-ns-02",
            source_experience_id="exp-ns-005", # Aging Redis
            target_experience_id="exp-ns-007", # Current gRPC
            relationship_type="UPDATED_BY"
        )
        db.add_all([rel1, rel2])
        db.commit()
        print("Seeded Knowledge Evolution Relationships.")

        print("=== NORTHSTAR ENGINEERING WORKSPACE SEEDING COMPLETE ===")
    finally:
        db.close()

if __name__ == "__main__":
    seed()
