"""
seed_intelligence_data.py
--------------------------
Creates tables and seeds realistic data into Aiven Cloud MySQL for:
1. Learner Feedback & Comments
2. Knowledge Status & Evolution
3. Organization Knowledge Intelligence & Telemetry Activity
"""

import sys
import os
import datetime
import uuid
import random
from sqlalchemy import text

# Ensure root directory in path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database.connection import get_engine, SessionLocal
from app.database.models import (
    Base,
    Experience,
    ExperienceFeedback,
    ExperienceComment,
    ExperienceStatusHistory,
    ExperienceRelationship,
    KnowledgeActivity,
    Organization,
    OrganizationMember,
    User,
)

def add_columns_if_missing(engine):
    """Executes ALTER TABLE statements safely to add new columns to existing tables in MySQL."""
    columns_to_add = [
        ("knowledge_status", "VARCHAR(50) DEFAULT 'CURRENT'"),
        ("last_reviewed_at", "DATETIME NULL"),
        ("review_source", "VARCHAR(255) NULL"),
        ("valid_context", "TEXT NULL"),
        ("invalid_context", "TEXT NULL"),
    ]
    with engine.begin() as conn:
        for col_name, col_type in columns_to_add:
            try:
                conn.execute(text(f"ALTER TABLE experiences ADD COLUMN {col_name} {col_type};"))
                print(f"Added column '{col_name}' to 'experiences' table.")
            except Exception as e:
                # Column likely already exists
                print(f"Column '{col_name}' check: {e}")

def seed():
    engine = get_engine()
    print("Running DDL column migrations...")
    add_columns_if_missing(engine)

    print("Creating all missing tables if not exists...")
    Base.metadata.create_all(bind=engine)
    print("Tables created / verified successfully.")

    db = SessionLocal()
    try:
        # 1. Fetch experiences
        experiences = list(db.query(Experience).all())
        print(f"Found {len(experiences)} existing experiences in MySQL database.")

        if not experiences:
            print("No experiences found! Please ensure initial database seeding is run first.")
            return

        # 2. Update statuses, review dates, and context info for experiences
        status_choices = ["CURRENT", "CURRENT", "CURRENT", "AGING", "OUTDATED", "CONTEXT-SPECIFIC"]
        review_sources = ["Organization Expert", "Principal Architect", "Security Auditor", "Infrastructure Lead"]

        for i, exp in enumerate(experiences):
            if not exp.knowledge_status:
                exp.knowledge_status = status_choices[i % len(status_choices)]
            
            if not exp.last_reviewed_at:
                days_ago = random.randint(10, 180)
                exp.last_reviewed_at = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=days_ago)
            
            if not exp.review_source:
                exp.review_source = review_sources[i % len(review_sources)]

            if exp.knowledge_status == "CONTEXT-SPECIFIC":
                exp.valid_context = "Legacy on-premise infrastructure & bare-metal Kubernetes nodes"
                exp.invalid_context = "Fully managed serverless cloud deployments (AWS Lambda, GCP Cloud Run)"

        db.commit()
        print("Updated experiences with Knowledge Intelligence status fields.")

        # 3. Seed Relationships (Knowledge Evolution)
        if len(experiences) >= 4:
            # Clear old relationships if re-running
            db.query(ExperienceRelationship).delete()
            
            rel1 = ExperienceRelationship(
                id=f"rel-{uuid.uuid4().hex[:12]}",
                source_experience_id=experiences[0].id, # Older
                target_experience_id=experiences[1].id, # Newer
                relationship_type="UPDATED_BY"
            )
            rel2 = ExperienceRelationship(
                id=f"rel-{uuid.uuid4().hex[:12]}",
                source_experience_id=experiences[0].id,
                target_experience_id=experiences[2].id,
                relationship_type="SUPERSEDES"
            )
            rel3 = ExperienceRelationship(
                id=f"rel-{uuid.uuid4().hex[:12]}",
                source_experience_id=experiences[1].id,
                target_experience_id=experiences[3].id,
                relationship_type="RELATED_TO"
            )
            db.add_all([rel1, rel2, rel3])
            
            # Mark superseded experience status OUTDATED
            experiences[0].knowledge_status = "OUTDATED"
            experiences[2].knowledge_status = "CURRENT"
            db.commit()
            print("Seeded Knowledge Evolution relationships.")

        # 4. Seed Status History
        db.query(ExperienceStatusHistory).delete()
        now = datetime.datetime.now(datetime.timezone.utc)
        histories = [
            ExperienceStatusHistory(
                id=f"his-001",
                experience_id=experiences[0].id,
                previous_status="CURRENT",
                new_status="AGING",
                reason="No review submitted for over 12 months.",
                reviewed_by="System Auditor",
                review_source="Automated Validity Scanner",
                created_at=now - datetime.timedelta(days=120)
            ),
            ExperienceStatusHistory(
                id=f"his-002",
                experience_id=experiences[0].id,
                previous_status="AGING",
                new_status="OUTDATED",
                reason=f"Superseded by modern zero-downtime practice: {experiences[2].title if len(experiences)>2 else 'Newer Practice'}",
                reviewed_by="Principal Systems Architect",
                review_source="Organization Architecture Review Board",
                created_at=now - datetime.timedelta(days=30)
            ),
            ExperienceStatusHistory(
                id=f"his-003",
                experience_id=experiences[1].id if len(experiences)>1 else experiences[0].id,
                previous_status="AGING",
                new_status="CURRENT",
                reason="Validated against current production database migration runbooks.",
                reviewed_by="Lead Database Administrator",
                review_source="Production Readiness Audit",
                created_at=now - datetime.timedelta(days=15)
            )
        ]
        db.add_all(histories)
        db.commit()
        print("Seeded Experience Status History.")

        # 5. Seed Learner Feedback & Comments
        db.query(ExperienceFeedback).delete()
        db.query(ExperienceComment).delete()

        demo_users = [
            ("usr-001", "Alex Rivera", "Senior Backend Engineer"),
            ("usr-002", "Devon Chen", "DevOps Specialist"),
            ("usr-003", "Priya Sharma", "Site Reliability Engineer"),
            ("usr-004", "Marcus Vance", "Data Architect"),
            ("usr-005", "Elena Rostova", "Security Engineer"),
        ]

        comment_templates = [
            "This approach was crucial when we migrated our PostgreSQL cluster with 10M+ rows.",
            "Great insight. We adapted this for our smaller microservice database with slight modifications.",
            "Would recommend keeping connection pool limits lower if deploying on standard Kubernetes pods.",
            "We encountered a edge-case deadlock during step 3; resolved by adding explicit locking timeout.",
            "Super helpful postmortem analysis! Saved our team hours during last week's outage."
        ]

        for exp in experiences:
            # Seed feedback
            n_fb = random.randint(5, 25)
            for j in range(n_fb):
                u_id, u_name, _ = demo_users[j % len(demo_users)]
                ftype = random.choices(
                    ["EFFECTIVE", "PARTIALLY_EFFECTIVE", "NOT_APPLICABLE"],
                    weights=[65, 25, 10]
                )[0]
                fb = ExperienceFeedback(
                    id=f"fbk-{uuid.uuid4().hex[:12]}",
                    experience_id=exp.id,
                    user_id=f"{u_id}-{j}",
                    user_name=f"{u_name} {j+1}",
                    feedback_type=ftype,
                    created_at=now - datetime.timedelta(days=random.randint(1, 45))
                )
                db.add(fb)

            # Seed comments for top experiences
            if random.random() > 0.3:
                c_user = demo_users[random.randint(0, len(demo_users)-1)]
                cmt = ExperienceComment(
                    id=f"cmt-{uuid.uuid4().hex[:12]}",
                    experience_id=exp.id,
                    user_id=c_user[0],
                    user_name=c_user[1],
                    user_role=c_user[2],
                    comment=comment_templates[random.randint(0, len(comment_templates)-1)],
                    created_at=now - datetime.timedelta(days=random.randint(1, 20))
                )
                db.add(cmt)

        db.commit()
        print("Seeded Learner Feedback and Discussion Comments.")

        # 6. Seed Telemetry Activity Records for Organization
        db.query(KnowledgeActivity).delete()
        org_id = "org-002" # Meridian Cloud Labs / Org Vault default

        activities = []
        user_names = ["Alex Rivera", "Devon Chen", "Priya Sharma", "Marcus Vance", "Elena Rostova", "Sarah Jenkins"]
        search_queries = ["Production", "Database Migration", "Kubernetes Rollback", "Security Operations", "Zero-Downtime", "Service Mesh mTLS Debugging"]

        # View activities
        for exp in experiences:
            views_count = random.randint(8, 45)
            for _ in range(views_count):
                uname = user_names[random.randint(0, len(user_names)-1)]
                activities.append(KnowledgeActivity(
                    id=f"act-{uuid.uuid4().hex[:12]}",
                    organization_id=org_id,
                    user_id=f"usr-{hash(uname)%1000}",
                    user_name=uname,
                    experience_id=exp.id,
                    activity_type="VIEWED_EXPERIENCE",
                    created_at=now - datetime.timedelta(days=random.randint(1, 30))
                ))

        # Search activities
        for q in search_queries:
            search_count = random.randint(10, 37)
            for _ in range(search_count):
                uname = user_names[random.randint(0, len(user_names)-1)]
                activities.append(KnowledgeActivity(
                    id=f"act-{uuid.uuid4().hex[:12]}",
                    organization_id=org_id,
                    user_id=f"usr-{hash(uname)%1000}",
                    user_name=uname,
                    activity_type="SEARCHED",
                    query=q,
                    created_at=now - datetime.timedelta(days=random.randint(1, 30))
                ))

        # Simulation & Save activities
        for _ in range(25):
            uname = user_names[random.randint(0, len(user_names)-1)]
            activities.append(KnowledgeActivity(
                id=f"act-{uuid.uuid4().hex[:12]}",
                organization_id=org_id,
                user_id=f"usr-{hash(uname)%1000}",
                user_name=uname,
                activity_type=random.choice(["STARTED_SIMULATION", "COMPLETED_SIMULATION", "SAVED_EXPERIENCE"]),
                created_at=now - datetime.timedelta(days=random.randint(1, 30))
            ))

        db.add_all(activities)
        db.commit()
        print(f"Seeded {len(activities)} telemetry activity records for organization '{org_id}'.")

        print("=== KNOWLEDGE INTELLIGENCE DATA SEEDING COMPLETE ===")
    finally:
        db.close()

if __name__ == "__main__":
    seed()
