"""Initial schema for WisdomKernel

Revision ID: 001_initial_schema
Revises: 
Create Date: 2026-09-09 16:25:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "001_initial_schema"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. users
    op.create_table(
        "users",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("email", sa.String(255), nullable=False, unique=True),
        sa.Column("role", sa.String(128), nullable=True),
        sa.Column("expertise", sa.JSON(), nullable=True),
        sa.Column("experience_level", sa.String(64), nullable=True),
        sa.Column("years_experience", sa.Integer(), nullable=True, default=0),
        sa.Column("company", sa.String(255), nullable=True),
        sa.Column("engineering_type", sa.String(128), nullable=True),
        sa.Column("domain", sa.String(128), nullable=True),
        sa.Column("bio", sa.Text(), nullable=True),
        sa.Column("retired", sa.Boolean(), nullable=False, default=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_users_id", "users", ["id"])
    op.create_index("ix_users_email", "users", ["email"])
    op.create_index("ix_users_company", "users", ["company"])
    op.create_index("ix_users_domain", "users", ["domain"])
    op.create_index("ix_users_engineering_type", "users", ["engineering_type"])
    op.create_index("ix_users_experience_level", "users", ["experience_level"])

    # 2. organizations
    op.create_table(
        "organizations",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column("name", sa.String(255), nullable=False, unique=True),
        sa.Column("slug", sa.String(128), nullable=False, unique=True),
        sa.Column("industry", sa.String(128), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("password_salt", sa.String(64), nullable=True),
        sa.Column("password_sha256", sa.String(128), nullable=True),
        sa.Column("is_demo", sa.Boolean(), nullable=False, default=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_organizations_id", "organizations", ["id"])
    op.create_index("ix_organizations_slug", "organizations", ["slug"])

    # 3. organization_members
    op.create_table(
        "organization_members",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column("organization_id", sa.String(64), sa.ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False),
        sa.Column("user_id", sa.String(64), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("role", sa.String(64), nullable=False, default="member"),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_organization_members_id", "organization_members", ["id"])
    op.create_index("ix_organization_members_organization_id", "organization_members", ["organization_id"])
    op.create_index("ix_organization_members_user_id", "organization_members", ["user_id"])

    # 4. domains
    op.create_table(
        "domains",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column("name", sa.String(128), nullable=False, unique=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_domains_id", "domains", ["id"])
    op.create_index("ix_domains_name", "domains", ["name"])

    # 5. tags
    op.create_table(
        "tags",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column("name", sa.String(64), nullable=False, unique=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_tags_id", "tags", ["id"])
    op.create_index("ix_tags_name", "tags", ["name"])

    # 6. experiences
    op.create_table(
        "experiences",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("contributor_id", sa.String(64), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("domain_id", sa.String(64), sa.ForeignKey("domains.id", ondelete="SET NULL"), nullable=True),
        sa.Column("domain_name", sa.String(128), nullable=True),
        sa.Column("problem", sa.Text(), nullable=True),
        sa.Column("context", sa.Text(), nullable=True),
        sa.Column("decision", sa.Text(), nullable=True),
        sa.Column("reasoning", sa.Text(), nullable=True),
        sa.Column("outcome", sa.Text(), nullable=True),
        sa.Column("lesson", sa.Text(), nullable=True),
        sa.Column("mistake", sa.Text(), nullable=True),
        sa.Column("root_cause", sa.Text(), nullable=True),
        sa.Column("what_i_wish_i_knew", sa.Text(), nullable=True),
        sa.Column("source_type", sa.String(128), nullable=True, default="interview"),
        sa.Column("source_reference", sa.String(255), nullable=True),
        sa.Column("year", sa.Integer(), nullable=True),
        sa.Column("verification_status", sa.String(64), nullable=False, default="verified"),
        sa.Column("is_demo", sa.Boolean(), nullable=False, default=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_experiences_id", "experiences", ["id"])
    op.create_index("ix_experiences_title", "experiences", ["title"])
    op.create_index("ix_experiences_contributor_id", "experiences", ["contributor_id"])
    op.create_index("ix_experiences_domain_id", "experiences", ["domain_id"])
    op.create_index("ix_experiences_domain_name", "experiences", ["domain_name"])
    op.create_index("ix_experiences_year", "experiences", ["year"])
    op.create_index("ix_experiences_created_at", "experiences", ["created_at"])

    # 7. experience_tags (Many-to-Many)
    op.create_table(
        "experience_tags",
        sa.Column("experience_id", sa.String(64), sa.ForeignKey("experiences.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("tag_id", sa.String(64), sa.ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True),
    )
    op.create_index("ix_experience_tags_exp_id", "experience_tags", ["experience_id"])
    op.create_index("ix_experience_tags_tag_id", "experience_tags", ["tag_id"])

    # 8. mistakes
    op.create_table(
        "mistakes",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("domain_id", sa.String(64), sa.ForeignKey("domains.id", ondelete="SET NULL"), nullable=True),
        sa.Column("domain_name", sa.String(128), nullable=True),
        sa.Column("contributor_id", sa.String(64), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("category", sa.String(64), nullable=True),
        sa.Column("wrong_assumption", sa.Text(), nullable=True),
        sa.Column("what_happened", sa.Text(), nullable=True),
        sa.Column("root_cause", sa.Text(), nullable=True),
        sa.Column("what_we_did", sa.Text(), nullable=True),
        sa.Column("what_we_should_have_done", sa.Text(), nullable=True),
        sa.Column("lesson", sa.Text(), nullable=True),
        sa.Column("mistake_to_avoid", sa.Text(), nullable=True),
        sa.Column("year", sa.Integer(), nullable=True),
        sa.Column("is_demo", sa.Boolean(), nullable=False, default=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_mistakes_id", "mistakes", ["id"])
    op.create_index("ix_mistakes_title", "mistakes", ["title"])
    op.create_index("ix_mistakes_domain_id", "mistakes", ["domain_id"])
    op.create_index("ix_mistakes_contributor_id", "mistakes", ["contributor_id"])
    op.create_index("ix_mistakes_category", "mistakes", ["category"])

    # 9. advice
    op.create_table(
        "advice",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column("title", sa.String(255), nullable=True),
        sa.Column("advice", sa.Text(), nullable=False),
        sa.Column("context", sa.Text(), nullable=True),
        sa.Column("domain_id", sa.String(64), sa.ForeignKey("domains.id", ondelete="SET NULL"), nullable=True),
        sa.Column("expertise", sa.String(128), nullable=True),
        sa.Column("contributor_id", sa.String(64), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("category", sa.String(64), nullable=False),
        sa.Column("is_demo", sa.Boolean(), nullable=False, default=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_advice_id", "advice", ["id"])
    op.create_index("ix_advice_category", "advice", ["category"])
    op.create_index("ix_advice_domain_id", "advice", ["domain_id"])
    op.create_index("ix_advice_contributor_id", "advice", ["contributor_id"])

    # 10. simulator_scenarios
    op.create_table(
        "simulator_scenarios",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("difficulty", sa.String(64), nullable=True),
        sa.Column("domain", sa.String(128), nullable=True),
        sa.Column("domain_id", sa.String(64), sa.ForeignKey("domains.id", ondelete="SET NULL"), nullable=True),
        sa.Column("estimated_minutes", sa.Integer(), nullable=True, default=5),
        sa.Column("context", sa.Text(), nullable=True),
        sa.Column("symptoms", sa.Text(), nullable=True),
        sa.Column("evidence", sa.Text(), nullable=True),
        sa.Column("senior_reasoning", sa.Text(), nullable=False),
        sa.Column("lesson", sa.Text(), nullable=False),
        sa.Column("is_demo", sa.Boolean(), nullable=False, default=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_simulator_scenarios_id", "simulator_scenarios", ["id"])
    op.create_index("ix_simulator_scenarios_difficulty", "simulator_scenarios", ["difficulty"])
    op.create_index("ix_simulator_scenarios_domain", "simulator_scenarios", ["domain"])

    # 11. simulator_steps
    op.create_table(
        "simulator_steps",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column("scenario_id", sa.String(64), sa.ForeignKey("simulator_scenarios.id", ondelete="CASCADE"), nullable=False),
        sa.Column("step_order", sa.Integer(), nullable=False, default=1),
        sa.Column("stage", sa.String(64), nullable=True),
        sa.Column("question", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_simulator_steps_id", "simulator_steps", ["id"])
    op.create_index("ix_simulator_steps_scenario_id", "simulator_steps", ["scenario_id"])
    op.create_index("ix_simulator_steps_step_order", "simulator_steps", ["step_order"])

    # 12. simulator_decision_options
    op.create_table(
        "simulator_decision_options",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column("step_id", sa.String(64), sa.ForeignKey("simulator_steps.id", ondelete="CASCADE"), nullable=False),
        sa.Column("option_key", sa.String(16), nullable=False),
        sa.Column("option_text", sa.Text(), nullable=False),
        sa.Column("feedback", sa.Text(), nullable=False),
        sa.Column("is_correct", sa.Boolean(), nullable=False, default=False),
        sa.Column("senior_reasoning", sa.Text(), nullable=True),
        sa.Column("next_step", sa.String(64), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_simulator_decision_options_id", "simulator_decision_options", ["id"])
    op.create_index("ix_simulator_decision_options_step_id", "simulator_decision_options", ["step_id"])

    # 13. simulator_attempts
    op.create_table(
        "simulator_attempts",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column("user_id", sa.String(64), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("scenario_id", sa.String(64), sa.ForeignKey("simulator_scenarios.id", ondelete="CASCADE"), nullable=False),
        sa.Column("selected_decisions", sa.JSON(), nullable=True),
        sa.Column("correct_answers", sa.Integer(), nullable=False, default=0),
        sa.Column("total_questions", sa.Integer(), nullable=False, default=0),
        sa.Column("score", sa.Integer(), nullable=False, default=0),
        sa.Column("band", sa.String(64), nullable=True),
        sa.Column("time_taken_seconds", sa.Integer(), nullable=True),
        sa.Column("completion_status", sa.String(64), nullable=False, default="completed"),
        sa.Column("started_at", sa.DateTime(), nullable=False),
        sa.Column("completed_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_simulator_attempts_id", "simulator_attempts", ["id"])
    op.create_index("ix_simulator_attempts_user_id", "simulator_attempts", ["user_id"])
    op.create_index("ix_simulator_attempts_scenario_id", "simulator_attempts", ["scenario_id"])

    # 14. organization_knowledge
    op.create_table(
        "organization_knowledge",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column("organization_id", sa.String(64), sa.ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("category", sa.String(64), nullable=False),
        sa.Column("content", sa.JSON(), nullable=False),
        sa.Column("domain", sa.String(128), nullable=True),
        sa.Column("created_by", sa.String(64), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_organization_knowledge_id", "organization_knowledge", ["id"])
    op.create_index("ix_organization_knowledge_organization_id", "organization_knowledge", ["organization_id"])
    op.create_index("ix_organization_knowledge_category", "organization_knowledge", ["category"])
    op.create_index("ix_organization_knowledge_domain", "organization_knowledge", ["domain"])


def downgrade() -> None:
    op.drop_table("organization_knowledge")
    op.drop_table("simulator_attempts")
    op.drop_table("simulator_decision_options")
    op.drop_table("simulator_steps")
    op.drop_table("simulator_scenarios")
    op.drop_table("advice")
    op.drop_table("mistakes")
    op.drop_table("experience_tags")
    op.drop_table("experiences")
    op.drop_table("tags")
    op.drop_table("domains")
    op.drop_table("organization_members")
    op.drop_table("organizations")
    op.drop_table("users")
