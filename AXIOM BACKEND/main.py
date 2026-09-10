"""
WisdomKernel -- Backend API
Team AXIOM | Smart India Hackathon 2026

"Experience should never retire."

Pipeline: CAPTURE -> TRANSCRIBE -> STRUCTURE -> VERIFY -> INDEX -> RETRIEVE -> LEARN

Run locally:
    uvicorn main:app --reload --port 8000

Interactive docs:
    http://localhost:8000/docs
"""

from __future__ import annotations

import logging
import os
import tempfile
from contextlib import asynccontextmanager
from typing import Any, Optional

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, File, HTTPException, Query, Request, UploadFile, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.database.connection import get_db, check_database_connection, get_engine
from app.schemas.common import (
    ErrorResponse,
    StructuredExperience,
    StructureRequest,
    TranscribeMeta,
    TranscribeResponse,
    SearchResult,
    SearchResponse,
    ExperienceRecord,
    ExperienceListResponse,
    ExperienceDetailResponse,
    CreateExperienceRequest,
    UpdateExperienceRequest,
    Mistake,
    MistakesResponse,
    MistakeDetailResponse,
    Scenario,
    SimulatorResponse,
    ScoreRequest,
    ScoreMetrics,
    ScoreResponse,
    Advice,
    AdviceResponse,
    LoginRequest,
    OrganizationSummary,
    UserSummary,
    LoginResponse,
    OrgListResponse,
    OrgObjectResponse,
    HealthResponse,
    DatabaseHealthResponse,
    DashboardResponse,
    ActionItem,
    VoiceNoteStructuredData,
    VoiceNoteResponse,
    FeedbackRequest,
    CommentRequest,
    StatusUpdateRequest,
)
from app.services.experience_service import ExperienceService
from app.services.mistake_service import MistakeService
from app.services.advice_service import AdviceService
from app.services.simulator_service import SimulatorService
from app.services.organization_service import OrganizationService
from app.services.dashboard_service import DashboardService
from app.services.knowledge_intelligence_service import KnowledgeIntelligenceService
from services import extraction_service, search_service, transcription_service, groq_voice_service
from utils import auth

load_dotenv()

logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO"),
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
)
logger = logging.getLogger("wisdomkernel")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

API_VERSION = "1.0.0"


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Runs once on startup: checks MySQL connectivity and prepares services."""
    db_health = check_database_connection()
    if db_health.get("status") == "connected":
        logger.info(
            "WisdomKernel connected to MySQL (%s) | tables=%d",
            db_health.get("dialect"),
            db_health.get("tables_count", 0),
        )
    else:
        logger.warning("Database not connected on startup: %s", db_health.get("error"))

    logger.info(
        "WisdomKernel API %s ready | STT=%s LLM=%s | origins=%s",
        API_VERSION,
        "configured" if transcription_service.is_configured() else "fallback",
        "configured" if extraction_service.is_configured() else "fallback",
        ALLOWED_ORIGINS,
    )
    yield
    logger.info("WisdomKernel API shutting down.")


app = FastAPI(
    title="WisdomKernel API",
    version=API_VERSION,
    lifespan=lifespan,
    description=(
        "Backend for WisdomKernel, which preserves senior engineering experience as "
        "structured, searchable knowledge backed by an Aiven MySQL database.\n\n"
        "**Pipeline:** capture -> transcribe -> structure -> verify -> index -> retrieve -> learn."
    ),
    contact={"name": "Team AXIOM"},
)

# ---------------------------------------------------------------------------
# CORS
# ---------------------------------------------------------------------------
_origins_raw = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000",
)
ALLOWED_ORIGINS = [origin.strip() for origin in _origins_raw.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
)


# ---------------------------------------------------------------------------
# Error handling
# ---------------------------------------------------------------------------

class AppError(HTTPException):
    def __init__(self, status_code: int, code: str, detail: str):
        super().__init__(status_code=status_code, detail=detail)
        self.code = code


def _error(status_code: int, code: str, message: str) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={"success": False, "error": {"code": code, "message": message}},
    )


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    codes = {
        400: "bad_request",
        401: "unauthorized",
        403: "forbidden",
        404: "not_found",
        413: "payload_too_large",
        415: "unsupported_media_type",
        422: "validation_error",
        500: "internal_error",
        503: "service_unavailable",
    }
    code = getattr(exc, "code", None) or codes.get(exc.status_code, "error")
    response = _error(exc.status_code, code, str(exc.detail))
    if exc.headers:
        for key, value in exc.headers.items():
            response.headers[key] = value
    return response


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    problems = []
    for err in exc.errors():
        location = ".".join(str(part) for part in err.get("loc", []) if part != "body")
        problems.append(f"{location or 'request'}: {err.get('msg', 'invalid value')}")
    return _error(
        422,
        "validation_error",
        "Request validation failed. " + "; ".join(problems),
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.exception("Unhandled error on %s %s: %s", request.method, request.url.path, exc)
    return _error(
        500,
        "internal_error",
        "An unexpected internal error occurred. The request was not completed.",
    )


# ---------------------------------------------------------------------------
# 0. Health / root / database
# ---------------------------------------------------------------------------

@app.get(
    "/health/database",
    response_model=DatabaseHealthResponse,
    tags=["General"],
    summary="Aiven MySQL database health check",
    description="Verifies live connectivity from FastAPI through SQLAlchemy to Aiven MySQL.",
)
async def health_database() -> DatabaseHealthResponse:
    check = check_database_connection()
    is_ok = check.get("status") == "connected"
    return DatabaseHealthResponse(
        success=is_ok,
        status=str(check.get("status")),
        dialect=str(check.get("dialect")) if check.get("dialect") else None,
        tables_count=check.get("tables_count"),
        tables=check.get("tables"),
        error=str(check.get("error")) if check.get("error") else None,
    )


@app.get(
    "/",
    response_model=HealthResponse,
    tags=["General"],
    summary="API health and capability check",
)
async def root() -> HealthResponse:
    db_check = check_database_connection()
    return HealthResponse(
        name="WisdomKernel API",
        tagline="Experience should never retire.",
        version=API_VERSION,
        status="ok",
        database={
            "status": db_check.get("status"),
            "dialect": db_check.get("dialect"),
            "tables_count": db_check.get("tables_count", 0),
        },
        docs="/docs",
        ai_services={
            "speech_to_text": "configured" if transcription_service.is_configured() else "demo_fallback",
            "llm_extraction": "configured" if extraction_service.is_configured() else "demo_fallback",
            "embeddings_search": "enabled" if os.getenv("USE_EMBEDDINGS", "false").lower() in {"1", "true", "yes"} else "keyword_only",
        },
        endpoints=[
            "GET /",
            "GET /health/database",
            "GET /dashboard",
            "POST /transcribe",
            "POST /structure",
            "GET /search",
            "GET /experiences",
            "POST /experiences",
            "GET /experiences/{id}",
            "PUT /experiences/{id}",
            "DELETE /experiences/{id}",
            "GET /mistakes",
            "GET /mistakes/{id}",
            "GET /simulator",
            "POST /score",
            "GET /advice",
            "POST /organization/login",
            "GET /organization/vault",
            "GET /organization/onboarding",
            "GET /organization/troubleshooting",
            "GET /organization/postmortems",
            "GET /organization/retirement",
            "GET /organization/kri",
            "GET /organization/dashboard",
        ],
    )


# ---------------------------------------------------------------------------
# 1. Home / dashboard (MySQL backed)
# ---------------------------------------------------------------------------

@app.get(
    "/dashboard",
    response_model=DashboardResponse,
    tags=["General"],
    summary="Public home dashboard statistics",
)
async def dashboard(db: Session = Depends(get_db)) -> DashboardResponse:
    service = DashboardService(db)
    data = service.get_dashboard_data()
    return DashboardResponse(**data)


# ---------------------------------------------------------------------------
# 2. Capture -> transcribe -> structure
# ---------------------------------------------------------------------------

@app.post(
    "/transcribe",
    response_model=TranscribeResponse,
    tags=["Capture"],
    summary="Transcribe an audio recording and extract structured knowledge",
)
async def transcribe(
    file: UploadFile = File(..., description="Audio recording of the experience"),
) -> TranscribeResponse:
    if file is None or not file.filename:
        raise HTTPException(status_code=400, detail="No audio file was uploaded. Send it as form field 'file'.")

    try:
        contents = await file.read()
    except Exception as exc:
        logger.error("Could not read upload: %s", exc)
        raise HTTPException(status_code=400, detail="The uploaded file could not be read.")
    finally:
        await file.close()

    try:
        transcription_service.validate_upload(file.filename, len(contents))
    except transcription_service.TranscriptionError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    tmp_path = None
    try:
        suffix = os.path.splitext(file.filename)[1].lower()
        with tempfile.NamedTemporaryFile(delete=False, dir=UPLOAD_DIR, suffix=suffix) as tmp:
            tmp.write(contents)
            tmp_path = tmp.name

        try:
            stt = transcription_service.transcribe(tmp_path, file.filename)
        except transcription_service.SpeechToTextUnavailable as exc:
            raise AppError(
                status_code=503,
                code="speech_to_text_not_configured" if not exc.configured else "speech_to_text_failed",
                detail=str(exc),
            )

        extraction = extraction_service.extract_experience(stt["transcript"])
        notices = [n for n in (extraction.get("notice"),) if n]

        return TranscribeResponse(
            transcript=stt["transcript"],
            experience=StructuredExperience(**extraction["experience"]),
            meta=TranscribeMeta(
                transcription_mode=stt["mode"],
                extraction_mode=extraction["extraction_mode"],
                notices=notices,
                filename=file.filename,
                size_bytes=len(contents),
            ),
        )
    finally:
        if tmp_path and os.path.exists(tmp_path):
            try:
                os.remove(tmp_path)
            except OSError as exc:
                logger.warning("Could not delete temp upload %s: %s", tmp_path, exc)


@app.post(
    "/structure",
    response_model=TranscribeResponse,
    tags=["Capture"],
    summary="Structure a typed or pasted transcript",
)
async def structure(payload: StructureRequest) -> TranscribeResponse:
    transcript = payload.transcript.strip()
    if len(transcript) < 20:
        raise HTTPException(
            status_code=400,
            detail="The transcript is too short to structure. Write at least a couple of sentences.",
        )

    extraction = extraction_service.extract_experience(transcript)
    notices = [n for n in (extraction.get("notice"),) if n]

    return TranscribeResponse(
        transcript=transcript,
        experience=StructuredExperience(**extraction["experience"]),
        meta=TranscribeMeta(
            transcription_mode="pasted_by_user",
            extraction_mode=extraction["extraction_mode"],
            notices=notices,
            filename=None,
            size_bytes=len(transcript.encode("utf-8")),
        ),
    )


@app.post(
    "/api/voice-notes/structure",
    response_model=VoiceNoteResponse,
    tags=["Voice Notes"],
    summary="Transcribe audio with Groq Whisper and structure into JSON data with Groq Llama 3.3",
)
@app.post(
    "/voice-notes/structure",
    response_model=VoiceNoteResponse,
    tags=["Voice Notes"],
    include_in_schema=False,
)
async def structure_voice_note(
    file: UploadFile = File(..., description="Audio recording file (.webm, .wav, .mp3, etc.)"),
) -> VoiceNoteResponse:
    if file is None or not file.filename:
        raise HTTPException(
            status_code=400,
            detail="No audio file was uploaded. Send audio file as form field 'file'.",
        )

    try:
        contents = await file.read()
    except Exception as exc:
        logger.error("Could not read uploaded audio: %s", exc)
        raise HTTPException(status_code=400, detail="The uploaded audio file could not be read.")
    finally:
        await file.close()

    try:
        groq_voice_service.validate_upload(file.filename, len(contents))
    except groq_voice_service.VoiceNoteValidationError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    tmp_path = None
    try:
        suffix = os.path.splitext(file.filename)[1].lower() or ".webm"
        with tempfile.NamedTemporaryFile(delete=False, dir=UPLOAD_DIR, suffix=suffix) as tmp:
            tmp.write(contents)
            tmp_path = tmp.name

        result = groq_voice_service.process_voice_note(tmp_path, file.filename)

        return VoiceNoteResponse(
            success=True,
            transcript=result["transcript"],
            data=VoiceNoteStructuredData(**result["data"]),
            filename=file.filename,
        )
    except groq_voice_service.VoiceNoteValidationError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except groq_voice_service.GroqServiceError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    except Exception as exc:
        logger.exception("Voice note structuring failed: %s", exc)
        raise HTTPException(status_code=500, detail=f"Voice note processing failed: {str(exc)}")
    finally:
        if tmp_path and os.path.exists(tmp_path):
            try:
                os.remove(tmp_path)
            except OSError as exc:
                logger.warning("Could not delete temp upload file %s: %s", tmp_path, exc)


# ---------------------------------------------------------------------------
# 3. Search / Ask experience (MySQL backed)
# ---------------------------------------------------------------------------

@app.get(
    "/search",
    response_model=SearchResponse,
    tags=["Retrieve"],
    summary="Search captured experiences",
)
async def search(
    query: Optional[str] = Query(None, description="Natural-language question or keywords"),
    engineering_type: Optional[str] = Query(None),
    company: Optional[str] = Query(None),
    domain: Optional[str] = Query(None),
    expertise: Optional[str] = Query(None),
    years_min: Optional[int] = Query(None, ge=0, le=80),
    years_max: Optional[int] = Query(None, ge=0, le=80),
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
) -> SearchResponse:
    if years_min is not None and years_max is not None and years_min > years_max:
        raise HTTPException(status_code=400, detail="years_min cannot be greater than years_max.")

    service = ExperienceService(db)
    result = service.search_experiences(
        query=query,
        engineering_type=engineering_type,
        company=company,
        domain=domain,
        expertise=expertise,
        years_min=years_min,
        years_max=years_max,
        limit=limit,
    )
    return SearchResponse(**result)


# ---------------------------------------------------------------------------
# 3b. Experience library and detail (MySQL backed)
# ---------------------------------------------------------------------------

@app.get(
    "/experiences",
    response_model=ExperienceListResponse,
    tags=["Retrieve"],
    summary="Browse the experience library",
)
async def experiences(
    domain: Optional[str] = Query(None),
    role: Optional[str] = Query(None),
    expertise: Optional[str] = Query(None),
    experience_level: Optional[str] = Query(None),
    engineering_type: Optional[str] = Query(None),
    company: Optional[str] = Query(None),
    year: Optional[int] = Query(None, ge=1970, le=2100),
    q: Optional[str] = Query(None),
    sort: str = Query("recent"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
) -> ExperienceListResponse:
    service = ExperienceService(db)
    result = service.list_experiences(
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
    return ExperienceListResponse(**result)


@app.get(
    "/experiences/{experience_id}",
    response_model=ExperienceDetailResponse,
    tags=["Retrieve"],
    summary="One experience in full",
)
async def experience_detail(experience_id: str, db: Session = Depends(get_db)) -> ExperienceDetailResponse:
    service = ExperienceService(db)
    detail = service.get_experience_detail(experience_id)
    if detail is None:
        raise HTTPException(status_code=404, detail=f"No experience found with id '{experience_id}'.")
    return ExperienceDetailResponse(**detail)


@app.post(
    "/experiences",
    response_model=ExperienceRecord,
    status_code=status.HTTP_201_CREATED,
    tags=["Retrieve"],
    summary="Create a new experience record",
)
async def create_experience(
    payload: CreateExperienceRequest, db: Session = Depends(get_db)
) -> ExperienceRecord:
    service = ExperienceService(db)
    created = service.create_experience(payload.model_dump())
    return ExperienceRecord(**created)


@app.put(
    "/experiences/{experience_id}",
    response_model=ExperienceRecord,
    tags=["Retrieve"],
    summary="Update an existing experience record",
)
async def update_experience(
    experience_id: str, payload: UpdateExperienceRequest, db: Session = Depends(get_db)
) -> ExperienceRecord:
    service = ExperienceService(db)
    updated = service.update_experience(experience_id, payload.model_dump(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=404, detail=f"No experience found with id '{experience_id}'.")
    return ExperienceRecord(**updated)


@app.delete(
    "/experiences/{experience_id}",
    status_code=status.HTTP_200_OK,
    tags=["Retrieve"],
    summary="Delete an experience record",
)
async def delete_experience(experience_id: str, db: Session = Depends(get_db)) -> dict[str, Any]:
    service = ExperienceService(db)
    success = service.delete_experience(experience_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"No experience found with id '{experience_id}'.")
    return {"success": True, "message": f"Experience '{experience_id}' deleted."}


# ---------------------------------------------------------------------------
# 3c. Knowledge Intelligence: Feedback, Discussion, Status & Evolution
# ---------------------------------------------------------------------------

@app.post(
    "/experiences/{experience_id}/feedback",
    tags=["Knowledge Intelligence"],
    summary="Submit or update learner feedback",
)
async def submit_experience_feedback(
    experience_id: str,
    payload: FeedbackRequest,
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    service = KnowledgeIntelligenceService(db)
    try:
        return service.submit_feedback(
            experience_id=experience_id,
            user_id=payload.user_id,
            feedback_type=payload.feedback_type,
            user_name=payload.user_name,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@app.get(
    "/experiences/{experience_id}/feedback",
    tags=["Knowledge Intelligence"],
    summary="Get experience feedback counts and community insight",
)
async def get_experience_feedback(
    experience_id: str,
    user_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    service = KnowledgeIntelligenceService(db)
    return service.get_feedback_summary(experience_id, user_id=user_id)


@app.post(
    "/experiences/{experience_id}/comments",
    tags=["Knowledge Intelligence"],
    summary="Add a discussion comment to an experience",
)
async def add_experience_comment(
    experience_id: str,
    payload: CommentRequest,
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    service = KnowledgeIntelligenceService(db)
    try:
        return service.add_comment(
            experience_id=experience_id,
            user_id=payload.user_id,
            user_name=payload.user_name,
            comment=payload.comment,
            user_role=payload.user_role,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@app.get(
    "/experiences/{experience_id}/comments",
    tags=["Knowledge Intelligence"],
    summary="List comments for an experience",
)
async def get_experience_comments(
    experience_id: str,
    db: Session = Depends(get_db),
) -> list[dict[str, Any]]:
    service = KnowledgeIntelligenceService(db)
    return service.get_comments(experience_id)


@app.delete(
    "/comments/{comment_id}",
    tags=["Knowledge Intelligence"],
    summary="Delete a comment",
)
async def delete_comment(
    comment_id: str,
    user_id: str = Query(...),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    service = KnowledgeIntelligenceService(db)
    try:
        success = service.delete_comment(comment_id, user_id=user_id)
        if not success:
            raise HTTPException(status_code=404, detail="Comment not found.")
        return {"success": True, "message": "Comment deleted."}
    except ValueError as exc:
        raise HTTPException(status_code=403, detail=str(exc))


@app.get(
    "/experiences/{experience_id}/status-history",
    tags=["Knowledge Intelligence"],
    summary="Get status change history timeline",
)
async def get_experience_status_history(
    experience_id: str,
    db: Session = Depends(get_db),
) -> list[dict[str, Any]]:
    service = KnowledgeIntelligenceService(db)
    return service.get_status_history(experience_id)


@app.put(
    "/experiences/{experience_id}/status",
    tags=["Knowledge Intelligence"],
    summary="Update knowledge validity status (CURRENT, AGING, OUTDATED, CONTEXT-SPECIFIC)",
)
async def update_experience_status(
    experience_id: str,
    payload: StatusUpdateRequest,
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    service = KnowledgeIntelligenceService(db)
    try:
        return service.update_knowledge_status(
            experience_id=experience_id,
            new_status=payload.status,
            reason=payload.reason,
            reviewed_by=payload.reviewed_by,
            review_source=payload.review_source,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@app.get(
    "/experiences/{experience_id}/evolution",
    tags=["Knowledge Intelligence"],
    summary="Get knowledge evolution tree and relationships",
)
async def get_experience_evolution(
    experience_id: str,
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    service = KnowledgeIntelligenceService(db)
    return service.get_knowledge_evolution(experience_id)



@app.post(
    "/organization/activity",
    tags=["Organization Intelligence"],
    summary="Record in-app telemetry activity event",
)
async def record_user_activity(
    activity_type: str,
    user_id: Optional[str] = Query(None),
    user_name: Optional[str] = Query(None),
    experience_id: Optional[str] = Query(None),
    query: Optional[str] = Query(None),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    service = KnowledgeIntelligenceService(db)
    service.record_activity(
        user_id=user_id,
        user_name=user_name,
        activity_type=activity_type,
        experience_id=experience_id,
        query=query,
    )
    db.commit()
    return {"success": True}



# ---------------------------------------------------------------------------
# 4. Mistakes library (MySQL backed)
# ---------------------------------------------------------------------------

@app.get(
    "/mistakes",
    response_model=MistakesResponse,
    tags=["Learn"],
    summary="Mistakes library",
)
async def mistakes(
    domain: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    q: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
) -> MistakesResponse:
    service = MistakeService(db)
    result = service.list_mistakes(domain=domain, category=category, q=q, limit=limit, offset=offset)
    return MistakesResponse(**result)


@app.get(
    "/mistakes/{mistake_id}",
    response_model=MistakeDetailResponse,
    tags=["Learn"],
    summary="One mistake in full",
)
async def mistake_detail(mistake_id: str, db: Session = Depends(get_db)) -> MistakeDetailResponse:
    service = MistakeService(db)
    detail = service.get_mistake_detail(mistake_id)
    if detail is None:
        raise HTTPException(status_code=404, detail=f"No mistake found with id '{mistake_id}'.")
    return MistakeDetailResponse(**detail)


# ---------------------------------------------------------------------------
# 5. Incident simulator (MySQL backed)
# ---------------------------------------------------------------------------

@app.get(
    "/simulator",
    response_model=SimulatorResponse,
    tags=["Learn"],
    summary="Interactive incident simulator scenarios",
)
async def simulator(
    scenario_id: Optional[str] = Query(None),
    difficulty: Optional[str] = Query(None),
    db: Session = Depends(get_db),
) -> SimulatorResponse:
    service = SimulatorService(db)
    scenarios = service.list_scenarios(scenario_id=scenario_id, difficulty=difficulty)
    if scenario_id and not scenarios:
        raise HTTPException(status_code=404, detail=f"No scenario found with id '{scenario_id}'.")
    return SimulatorResponse(count=len(scenarios), scenarios=[Scenario(**s) for s in scenarios])


# ---------------------------------------------------------------------------
# 6. Experience transfer score (MySQL backed attempt tracking)
# ---------------------------------------------------------------------------

@app.post(
    "/score",
    response_model=ScoreResponse,
    tags=["Learn"],
    summary="Calculate an Experience Transfer Score",
)
async def score(payload: ScoreRequest, db: Session = Depends(get_db)) -> ScoreResponse:
    service = SimulatorService(db)
    try:
        result = service.record_attempt_and_score(
            correct_answers=payload.correct_answers,
            total_questions=payload.total_questions,
            scenario_id=payload.scenario_id,
            first_attempt_correct=payload.first_attempt_correct,
            previous_score=payload.previous_score,
            time_taken_seconds=payload.time_taken_seconds,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    return ScoreResponse(
        scenario_id=result["scenario_id"],
        score=result["score"],
        band=result["band"],
        band_description=result["band_description"],
        improvement=result["improvement"],
        improvement_note=result["improvement_note"],
        metrics=ScoreMetrics(**result["metrics"]),
        formula=result["formula"],
        disclaimer=result["disclaimer"],
    )


# ---------------------------------------------------------------------------
# 7. What I wish I knew (MySQL backed)
# ---------------------------------------------------------------------------

@app.get(
    "/advice",
    response_model=AdviceResponse,
    tags=["Learn"],
    summary="'What I wish I knew' advice",
)
async def advice(
    category: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
) -> AdviceResponse:
    service = AdviceService(db)
    result = service.list_advice(category=category, limit=limit, offset=offset)
    return AdviceResponse(**result)


# ---------------------------------------------------------------------------
# 8. Organization authentication (MySQL backed)
# ---------------------------------------------------------------------------

@app.post(
    "/organization/login",
    response_model=LoginResponse,
    tags=["Organization"],
    summary="Authenticate an organization",
)
async def organization_login(payload: LoginRequest, db: Session = Depends(get_db)) -> LoginResponse:
    service = OrganizationService(db)
    result = service.authenticate(payload.organization_name, payload.password)
    if not result:
        logger.warning("Failed login attempt for organization '%s'", payload.organization_name)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid organization name or password.",
        )

    return LoginResponse(
        token=result["token"],
        expires_in_seconds=result["expires_in_seconds"],
        organization=OrganizationSummary(**result["organization"]),
        user=UserSummary(**result["user"]) if result.get("user") else None,
    )



# ---------------------------------------------------------------------------
# 9. Protected organization vault (MySQL backed)
# ---------------------------------------------------------------------------

_PROTECTED_ERRORS = {
    401: {"model": ErrorResponse, "description": "Missing, invalid or expired token"},
    500: {"model": ErrorResponse},
}


def _summary(session: dict) -> OrganizationSummary:
    return OrganizationSummary(id=session["organization_id"], name=session["organization_name"])


def _list_section(db: Session, session: dict, section: str) -> OrgListResponse:
    service = OrganizationService(db)
    data = service.get_section_data(session["organization_id"], section)
    if not isinstance(data, list):
        data = []
    return OrgListResponse(
        organization=_summary(session), section=section, count=len(data), data=data
    )


@app.get(
    "/organization/intelligence",
    tags=["Organization Intelligence"],
    summary="Organization Knowledge Intelligence Dashboard (protected)",
    responses=_PROTECTED_ERRORS,
)
async def organization_intelligence(
    session: dict = Depends(auth.require_organization),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    service = KnowledgeIntelligenceService(db)
    org_id = session.get("organization_id", "org-northstar")
    return service.get_organization_intelligence(org_id)


# ---------------------------------------------------------------------------
# 9b. Role-Based Organization Workspace Endpoints (RBAC Enforced)
# ---------------------------------------------------------------------------

@app.get(
    "/organization/head/dashboard",
    tags=["Organization Workspace - Head"],
    summary="Head / Admin Organization Knowledge Intelligence Dashboard (RBAC Protected)",
    responses=_PROTECTED_ERRORS,
)
async def get_head_dashboard(
    session: dict = Depends(auth.require_role(["HEAD_ADMIN"])),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    service = OrganizationService(db)
    org_id = session.get("organization_id", "org-northstar")
    return service.get_head_dashboard(org_id)


@app.get(
    "/organization/head/employees",
    tags=["Organization Workspace - Head"],
    summary="Employee Directory for Head / Admin (RBAC Protected)",
    responses=_PROTECTED_ERRORS,
)
async def get_head_employees(
    role: Optional[str] = Query(None),
    department: Optional[str] = Query(None),
    session: dict = Depends(auth.require_role(["HEAD_ADMIN"])),
    db: Session = Depends(get_db),
) -> list[dict[str, Any]]:
    service = OrganizationService(db)
    org_id = session.get("organization_id", "org-northstar")
    return service.get_head_employees(org_id, role=role, department=department)


@app.get(
    "/organization/senior/dashboard",
    tags=["Organization Workspace - Senior"],
    summary="Senior Engineer Contribution & Mentorship Dashboard (RBAC Protected)",
    responses=_PROTECTED_ERRORS,
)
async def get_senior_dashboard(
    session: dict = Depends(auth.require_role(["SENIOR_ENGINEER", "HEAD_ADMIN"])),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    service = OrganizationService(db)
    user_id = session.get("user_id", "usr-snr-01")
    org_id = session.get("organization_id", "org-northstar")
    return service.get_senior_dashboard(user_id, org_id)


@app.get(
    "/organization/junior/dashboard",
    tags=["Organization Workspace - Junior"],
    summary="Junior Employee Learn & Apply Dashboard (RBAC Protected)",
    responses=_PROTECTED_ERRORS,
)
async def get_junior_dashboard(
    session: dict = Depends(auth.require_role(["JUNIOR_EMPLOYEE", "SENIOR_ENGINEER", "HEAD_ADMIN"])),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    service = OrganizationService(db)
    user_id = session.get("user_id", "usr-jnr-01")
    org_id = session.get("organization_id", "org-northstar")
    return service.get_junior_dashboard(user_id, org_id)


@app.get(
    "/organization/junior/saved",
    tags=["Organization Workspace - Junior"],
    summary="List Bookmarked Experiences for Junior Employee (RBAC Protected)",
    responses=_PROTECTED_ERRORS,
)
async def get_junior_saved_experiences(
    session: dict = Depends(auth.require_organization),
    db: Session = Depends(get_db),
) -> list[dict[str, Any]]:
    service = OrganizationService(db)
    user_id = session.get("user_id", "usr-jnr-01")
    return service.get_junior_saved(user_id)


@app.post(
    "/experiences/{experience_id}/save",
    tags=["Knowledge Intelligence"],
    summary="Bookmark or unbookmark an experience for current user",
)
async def toggle_saved_experience(
    experience_id: str,
    session: dict = Depends(auth.require_organization),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    service = OrganizationService(db)
    user_id = session.get("user_id", "usr-jnr-01")
    return service.toggle_saved_experience(user_id, experience_id)




@app.get(
    "/organization/vault",
    response_model=OrgListResponse,
    tags=["Organization"],
    summary="Private knowledge vault (protected)",
    responses=_PROTECTED_ERRORS,
)
async def organization_vault(
    session: dict = Depends(auth.require_organization), db: Session = Depends(get_db)
) -> OrgListResponse:
    return _list_section(db, session, "vault")


@app.get(
    "/organization/onboarding",
    response_model=OrgListResponse,
    tags=["Organization"],
    summary="Onboarding programme (protected)",
    responses=_PROTECTED_ERRORS,
)
async def organization_onboarding(
    session: dict = Depends(auth.require_organization), db: Session = Depends(get_db)
) -> OrgListResponse:
    return _list_section(db, session, "onboarding")


@app.get(
    "/organization/troubleshooting",
    response_model=OrgListResponse,
    tags=["Organization"],
    summary="Troubleshooting guides (protected)",
    responses=_PROTECTED_ERRORS,
)
async def organization_troubleshooting(
    session: dict = Depends(auth.require_organization), db: Session = Depends(get_db)
) -> OrgListResponse:
    return _list_section(db, session, "troubleshooting")


@app.get(
    "/organization/postmortems",
    response_model=OrgListResponse,
    tags=["Organization"],
    summary="Incident postmortems (protected)",
    responses=_PROTECTED_ERRORS,
)
async def organization_postmortems(
    session: dict = Depends(auth.require_organization), db: Session = Depends(get_db)
) -> OrgListResponse:
    return _list_section(db, session, "postmortems")


@app.get(
    "/organization/retirement",
    response_model=OrgListResponse,
    tags=["Organization"],
    summary="Retirement knowledge register (protected)",
    responses=_PROTECTED_ERRORS,
)
async def organization_retirement(
    session: dict = Depends(auth.require_organization), db: Session = Depends(get_db)
) -> OrgListResponse:
    return _list_section(db, session, "retirement")


@app.get(
    "/organization/kri",
    response_model=OrgObjectResponse,
    tags=["Organization"],
    summary="Knowledge Risk Indicators (protected)",
    responses=_PROTECTED_ERRORS,
)
async def organization_kri(
    session: dict = Depends(auth.require_organization), db: Session = Depends(get_db)
) -> OrgObjectResponse:
    service = OrganizationService(db)
    data = service.get_section_data(session["organization_id"], "kri")
    return OrgObjectResponse(
        organization=_summary(session), section="kri", data=data if isinstance(data, dict) else {}
    )


@app.get(
    "/organization/dashboard",
    response_model=OrgObjectResponse,
    tags=["Organization"],
    summary="Organization dashboard summary (protected)",
    responses=_PROTECTED_ERRORS,
)
async def organization_dashboard(
    session: dict = Depends(auth.require_organization), db: Session = Depends(get_db)
) -> OrgObjectResponse:
    service = OrganizationService(db)
    data = service.get_section_data(session["organization_id"], "dashboard")
    return OrgObjectResponse(
        organization=_summary(session), section="dashboard", data=data if isinstance(data, dict) else {}
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", "8000")),
        reload=True,
    )
