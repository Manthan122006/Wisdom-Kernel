"""
app/schemas/common.py
---------------------
Pydantic v2 request and response models matching WisdomKernel API contracts.
"""

from __future__ import annotations

from typing import Any, Optional
from pydantic import BaseModel, Field


class ErrorBody(BaseModel):
    code: str = Field(..., description="Short machine-readable error code")
    message: str = Field(..., description="Human-readable explanation")


class ErrorResponse(BaseModel):
    success: bool = Field(False, description="Always false for errors")
    error: ErrorBody


class StructuredExperience(BaseModel):
    """The nine canonical WisdomKernel knowledge fields. Null means 'not stated'."""
    problem: Optional[str] = None
    context: Optional[str] = None
    decision: Optional[str] = None
    reasoning: Optional[str] = None
    mistake: Optional[str] = None
    root_cause: Optional[str] = None
    outcome: Optional[str] = None
    lesson: Optional[str] = None
    what_i_wish_i_knew: Optional[str] = None


class StructureRequest(BaseModel):
    transcript: str = Field(
        ...,
        min_length=20,
        max_length=20000,
        description="A transcript typed or pasted by the user",
    )


class TranscribeMeta(BaseModel):
    transcription_mode: str = Field(..., description="'ai' or 'pasted_by_user'")
    extraction_mode: str = Field(..., description="'ai' or 'rule_based_fallback'")
    notices: list[str] = Field(default_factory=list)
    filename: Optional[str] = None
    size_bytes: Optional[int] = None


class TranscribeResponse(BaseModel):
    success: bool = True
    transcript: str
    experience: StructuredExperience
    meta: TranscribeMeta


class SearchResult(BaseModel):
    id: Optional[str] = None
    title: Optional[str] = None
    contributor_name: Optional[str] = None
    years_experience: Optional[int] = None
    company: Optional[str] = None
    engineering_type: Optional[str] = None
    domain: Optional[str] = None
    expertise: Optional[str] = None
    problem: Optional[str] = None
    decision: Optional[str] = None
    lesson: Optional[str] = None
    root_cause: Optional[str] = None
    what_i_wish_i_knew: Optional[str] = None
    year: Optional[int] = None
    source: Optional[str] = None
    relevance: float = Field(0.0, description="0-1 ranking score")
    matched_terms: list[str] = Field(default_factory=list)
    ranking_method: str = Field("keyword", description="'keyword', 'embeddings' or 'browse'")
    is_demo: bool = True


class SearchResponse(BaseModel):
    success: bool = True
    query: Optional[str] = None
    count: int
    ranking_method: str
    filters_applied: dict[str, Any] = Field(default_factory=dict)
    message: Optional[str] = None
    results: list[SearchResult]


class ExperienceRecord(BaseModel):
    id: str
    title: Optional[str] = None
    contributor_name: Optional[str] = None
    contributor_id: Optional[str] = None
    role: Optional[str] = None
    experience_level: Optional[str] = None
    years_experience: Optional[int] = None
    company: Optional[str] = None
    engineering_type: Optional[str] = None
    domain: Optional[str] = None
    expertise: Optional[str] = None
    year: Optional[int] = None
    source: Optional[str] = None
    tags: list[str] = Field(default_factory=list)
    problem: Optional[str] = None
    context: Optional[str] = None
    decision: Optional[str] = None
    reasoning: Optional[str] = None
    mistake: Optional[str] = None
    root_cause: Optional[str] = None
    outcome: Optional[str] = None
    lesson: Optional[str] = None
    what_i_wish_i_knew: Optional[str] = None
    knowledge_status: Optional[str] = "CURRENT"
    last_reviewed_at: Optional[str] = None
    review_source: Optional[str] = "Organization Expert"
    valid_context: Optional[str] = None
    invalid_context: Optional[str] = None
    is_demo: bool = True


class CreateExperienceRequest(BaseModel):
    id: Optional[str] = None
    title: str
    contributor_id: Optional[str] = None
    domain: Optional[str] = None
    problem: Optional[str] = None
    context: Optional[str] = None
    decision: Optional[str] = None
    reasoning: Optional[str] = None
    outcome: Optional[str] = None
    lesson: Optional[str] = None
    mistake: Optional[str] = None
    root_cause: Optional[str] = None
    what_i_wish_i_knew: Optional[str] = None
    tags: list[str] = Field(default_factory=list)
    year: Optional[int] = 2026


class UpdateExperienceRequest(BaseModel):
    title: Optional[str] = None
    domain: Optional[str] = None
    problem: Optional[str] = None
    context: Optional[str] = None
    decision: Optional[str] = None
    reasoning: Optional[str] = None
    outcome: Optional[str] = None
    lesson: Optional[str] = None
    mistake: Optional[str] = None
    root_cause: Optional[str] = None
    what_i_wish_i_knew: Optional[str] = None
    tags: Optional[list[str]] = None
    year: Optional[int] = None


class ExperienceFacets(BaseModel):
    domains: list[str] = Field(default_factory=list)
    roles: list[str] = Field(default_factory=list)
    expertise: list[str] = Field(default_factory=list)
    experience_levels: list[str] = Field(default_factory=list)
    years: list[int] = Field(default_factory=list)
    engineering_types: list[str] = Field(default_factory=list)
    companies: list[str] = Field(default_factory=list)


class ExperienceListResponse(BaseModel):
    success: bool = True
    count: int
    total: int
    facets: ExperienceFacets
    filters_applied: dict[str, Any] = Field(default_factory=dict)
    message: Optional[str] = None
    experiences: list[ExperienceRecord]


class ExperienceDetailResponse(BaseModel):
    success: bool = True
    experience: ExperienceRecord
    related: list[dict[str, Any]] = Field(default_factory=list)


class Mistake(BaseModel):
    id: str
    title: str
    wrong_assumption: Optional[str] = None
    actual_cause: Optional[str] = None
    what_we_did: Optional[str] = None
    what_we_should_have_done: Optional[str] = None
    lesson: Optional[str] = None
    mistake_to_avoid: Optional[str] = None
    engineer: Optional[str] = None
    year: Optional[int] = None
    domain: Optional[str] = None
    category: Optional[str] = None
    is_demo: bool = True


class MistakesResponse(BaseModel):
    success: bool = True
    count: int
    categories: list[str] = Field(default_factory=list)
    mistakes: list[Mistake]


class MistakeDetailResponse(BaseModel):
    success: bool = True
    mistake: Mistake
    related: list[Mistake] = Field(default_factory=list)


class ScenarioOption(BaseModel):
    id: str
    text: str
    correct: bool
    feedback: str


class ScenarioStep(BaseModel):
    id: Optional[str] = None
    stage: Optional[str] = None
    question: str
    options: list[ScenarioOption]


class Scenario(BaseModel):
    id: str
    title: str
    description: str
    difficulty: Optional[str] = None
    domain: Optional[str] = None
    estimated_minutes: Optional[int] = None
    steps: list[ScenarioStep]
    senior_reasoning: str
    lesson: str
    is_demo: bool = True


class SimulatorResponse(BaseModel):
    success: bool = True
    count: int
    scenarios: list[Scenario]


class ScoreRequest(BaseModel):
    correct_answers: int = Field(..., ge=0)
    total_questions: int = Field(..., gt=0)
    scenario_id: Optional[str] = None
    first_attempt_correct: Optional[int] = None
    previous_score: Optional[float] = None
    time_taken_seconds: Optional[int] = None


class ScoreMetrics(BaseModel):
    accuracy_percent: float
    correct_answers: int
    incorrect_answers: int
    total_questions: int
    first_attempt_accuracy_percent: Optional[float] = None
    time_taken_seconds: Optional[int] = None
    avg_seconds_per_question: Optional[float] = None


class ScoreResponse(BaseModel):
    success: bool = True
    scenario_id: Optional[str] = None
    score: int
    band: str
    band_description: str
    improvement: Optional[float] = None
    improvement_note: str
    metrics: ScoreMetrics
    formula: str
    disclaimer: str


class Advice(BaseModel):
    id: str
    engineer_name: str
    advice: str
    category: str
    is_demo: bool = True


class AdviceResponse(BaseModel):
    success: bool = True
    count: int
    categories: list[str]
    advice: list[Advice]


class LoginRequest(BaseModel):
    organization_name: str = Field(..., min_length=1)
    password: str = Field(..., min_length=1)


class OrganizationSummary(BaseModel):
    id: str
    name: str


class UserSummary(BaseModel):
    id: str
    name: str
    email: str
    role: str
    department: Optional[str] = None



class LoginResponse(BaseModel):
    success: bool = True
    token: str
    token_type: str = "bearer"
    expires_in_seconds: int
    organization: OrganizationSummary
    user: Optional[UserSummary] = None



class OrgListResponse(BaseModel):
    success: bool = True
    organization: OrganizationSummary
    section: str
    count: int
    data: list[dict[str, Any]]


class OrgObjectResponse(BaseModel):
    success: bool = True
    organization: OrganizationSummary
    section: str
    data: dict[str, Any]


class HealthResponse(BaseModel):
    success: bool = True
    name: str
    tagline: str
    version: str
    status: str
    database: Optional[dict[str, Any]] = None
    docs: str
    ai_services: dict[str, Any]
    endpoints: list[str]


class DatabaseHealthResponse(BaseModel):
    success: bool = True
    status: str
    dialect: Optional[str] = None
    tables_count: Optional[int] = None
    tables: Optional[list[str]] = None
    error: Optional[str] = None


class DashboardResponse(BaseModel):
    success: bool = True
    stats: dict[str, Any]
    domains: list[str]
    engineering_types: list[str]
    recent_experiences: list[dict[str, Any]]
    note: str


class ActionItem(BaseModel):
    task: str = Field(..., description="Actionable task description")
    owner: Optional[str] = Field(None, description="Person mentioned, or null")
    priority: str = Field(..., description="High | Medium | Low")
    deadline: Optional[str] = Field(None, description="Extracted date/time, or null")


class VoiceNoteStructuredData(BaseModel):
    title: str = Field(..., description="Concise, descriptive title for the voice note")
    category: str = Field(..., description="Work | Personal | Project | Meeting | Idea")
    summary: str = Field(..., description="1 to 2 sentence executive summary of the note")
    key_points: list[str] = Field(default_factory=list, description="Bulleted Key Takeaways")
    action_items: list[ActionItem] = Field(default_factory=list, description="Interactive action items")


class VoiceNoteResponse(BaseModel):
    success: bool = True
    transcript: str
    data: VoiceNoteStructuredData
    filename: Optional[str] = None


class FeedbackRequest(BaseModel):
    user_id: str = Field("user-001", description="ID of learner submitting feedback")
    user_name: Optional[str] = Field("Learner", description="Display name of learner")
    feedback_type: str = Field(..., description="EFFECTIVE | PARTIALLY_EFFECTIVE | NOT_APPLICABLE")


class CommentRequest(BaseModel):
    user_id: str = Field("user-001", description="Author user ID")
    user_name: str = Field("Learner", description="Author display name")
    user_role: Optional[str] = Field("Learner", description="Author role")
    comment: str = Field(..., min_length=2, max_length=2000, description="Discussion comment text")


class StatusUpdateRequest(BaseModel):
    new_status: str = Field(..., description="CURRENT | AGING | OUTDATED | CONTEXT-SPECIFIC")
    reason: Optional[str] = Field(None, description="Reason for status update")
    reviewed_by: Optional[str] = Field("Organization Expert", description="Reviewer name")
    review_source: Optional[str] = Field("Organization Expert", description="Review source")
