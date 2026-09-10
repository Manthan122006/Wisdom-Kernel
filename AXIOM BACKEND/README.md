# WisdomKernel — Backend

**Team AXIOM · Smart India Hackathon 2026**

> *"Experience should never retire."*

WisdomKernel captures the experience of senior engineers and turns it into structured, searchable, reusable knowledge.

```
CAPTURE → TRANSCRIBE → STRUCTURE → VERIFY → INDEX → RETRIEVE → LEARN
```

Enterprise FastAPI backend with a persistent **Aiven MySQL 8.4** database, **SQLAlchemy 2.0 ORM**, **Alembic** migrations, connection pooling, SSL/TLS CA verification, and a clean **Route → Service → Repository** layered architecture.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Quick Start](#quick-start)
3. [Database Configuration & Aiven MySQL Setup](#database-configuration--aiven-mysql-setup)
4. [Alembic Migrations](#alembic-migrations)
5. [Data Migration & Seeding](#data-migration--seeding)
6. [Project Structure](#project-structure)
7. [Database Schema & ERD](#database-schema--erd)
8. [API Endpoint Reference](#api-endpoint-reference)
9. [Frontend API Contract](#frontend-api-contract)
10. [Demo Credentials](#demo-credentials)
11. [Tenant Isolation Architecture](#tenant-isolation-architecture)
12. [Testing & Verification](#testing--verification)
13. [Troubleshooting Guide](#troubleshooting-guide)
14. [Security Notice & Production Recommendations](#security-notice--production-recommendations)

---

## Architecture Overview

WisdomKernel uses strict separation of concerns to ensure maintainability, testability, and zero disruption to existing frontend contracts:

```
Frontend (React + Tailwind)
       │ HTTP / JSON
       ▼
FastAPI Routes (main.py)
       │ Depends(get_db) + Pydantic validation
       ▼
Service Layer (app/services/)
       │ Business logic, ranking, hashing, transaction boundaries
       ▼
Repository Layer (app/repositories/)
       │ SQLAlchemy 2.0 ORM queries, relationships, eager joins
       ▼
SQLAlchemy Engine & Connection Pool (app/database/)
       │ PyMySQL driver + SSL/TLS CA verification
       ▼
Aiven MySQL 8.4 Database Cluster
```

---

## Quick Start

### 1. Prerequisites
- Python 3.10+ (tested on Python 3.12, 3.13, 3.14)
- MySQL 8.0+ or an active [Aiven MySQL](https://aiven.io) cloud database
- SSL CA Certificate from Aiven (`ca.pem`)

### 2. Setup Virtual Environment

```bash
# 1. Enter the backend directory
cd "AXIOM BACKEND"

# 2. Create and activate a virtual environment
python -m venv venv
# On Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# On Linux/macOS:
source venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt
```

### 3. Configure Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env    # Windows: copy .env.example .env
```

Configure your Aiven MySQL credentials in `.env`:

```ini
DATABASE_URL=mysql+pymysql://<user>:<password>@<host>:<port>/<database>?ssl_ca=ca.pem
DB_SSL_CA=ca.pem
DB_SSL_VERIFY_CERT=True

# Connection pool settings
DB_POOL_SIZE=10
DB_MAX_OVERFLOW=20
DB_POOL_TIMEOUT=30
DB_POOL_RECYCLE=1800
```

> **Security Note:** `.env` and `ca.pem` are protected by `.gitignore` and must never be committed.

### 4. Run Database Migrations

Apply the Alembic schema migrations:

```bash
alembic upgrade head
```

### 5. Seed the Database

Populate initial baseline data (users, domains, tags, experiences, mistakes, advice, simulator scenarios, and organization knowledge):

```bash
python seed.py
```

*Note: `seed.py` is fully idempotent and safe to run multiple times without duplicating records.*

### 6. Start the FastAPI Server

```bash
uvicorn main:app --reload --port 8000
```

- Interactive Swagger Documentation: <http://localhost:8000/docs>
- OpenAPI JSON Specification: <http://localhost:8000/openapi.json>
- Database Health Check: <http://localhost:8000/health/database>

---

## Database Configuration & Aiven MySQL Setup

WisdomKernel connects to MySQL using SQLAlchemy 2.0 with the `pymysql` driver and SSL/TLS verification.

### Aiven Cloud Setup Steps:
1. Create a MySQL 8.4 service on Aiven.
2. Download the **CA Certificate** from the Aiven Console:
   - Save it as `ca.pem` in `AXIOM BACKEND/` (or set `DB_SSL_CA=/path/to/ca.pem`).
3. Set your service URI in `.env`:
   ```ini
   DATABASE_URL=mysql+pymysql://avnadmin:YOUR_PASSWORD@mysql-wisdomkernel.aivencloud.com:12345/defaultdb?ssl_ca=ca.pem
   ```
4. Verify connectivity:
   ```bash
   curl http://localhost:8000/health/database
   ```
   Expected response:
   ```json
   {
     "status": "connected",
     "dialect": "mysql",
     "tables_count": 14,
     "tables": [
       "advice", "domains", "experience_tags", "experiences", "mistakes",
       "organization_knowledge", "organization_members", "organizations",
       "simulator_attempts", "simulator_decision_options", "simulator_scenarios",
       "simulator_steps", "tags", "users"
     ]
   }
   ```

---

## Alembic Migrations

Database schema versioning is managed with Alembic.

### Common Migration Commands:

| Action | Command |
|---|---|
| Apply all pending migrations | `alembic upgrade head` |
| Roll back the latest migration | `alembic downgrade -1` |
| Roll back to the beginning | `alembic downgrade base` |
| View current revision | `alembic current` |
| View migration history | `alembic history --verbose` |
| Create a new migration revision | `alembic revision -m "description"` |

---

## Data Migration & Seeding

WisdomKernel includes two dedicated data population scripts:

1. **`migrate_json.py`**: Reads legacy backup JSON files from `data/` and imports all records into MySQL tables.
2. **`seed.py`**: High-level idempotent seeder that establishes core engineering domains, tags, baseline contributor profiles, and all SIH 2026 scenarios.

```bash
# Execute idempotent seed
python seed.py
```

### Table Counts Seeded:
- `users`: 10 records
- `organizations`: 2 records
- `organization_members`: 6 records
- `domains`: 17 records
- `tags`: 99 records
- `experiences`: 18 records
- `mistakes`: 18 records
- `advice`: 28 records
- `simulator_scenarios`: 5 records
- `simulator_steps`: 15 records
- `simulator_decision_options`: 60 records
- `organization_knowledge`: 46 records

---

## Project Structure

```
AXIOM BACKEND/
├── alembic.ini                   # Alembic configuration
├── alembic/
│   ├── env.py                    # Alembic migration environment
│   ├── script.py.mako            # Migration template
│   └── versions/
│       └── 001_initial_schema.py # Complete 14-table schema migration
├── app/
│   ├── database/
│   │   ├── base.py               # DeclarativeBase with standardized naming convention
│   │   ├── connection.py         # Engine, SessionLocal, get_db dependency, health check
│   │   └── models/               # SQLAlchemy 2.0 ORM Models
│   │       ├── advice.py
│   │       ├── domain.py
│   │       ├── experience.py
│   │       ├── knowledge.py
│   │       ├── mistake.py
│   │       ├── organization.py
│   │       ├── simulator.py
│   │       ├── tag.py
│   │       └── user.py
│   ├── repositories/             # Data access layer (CRUD & queries)
│   │   ├── advice_repository.py
│   │   ├── domain_repository.py
│   │   ├── experience_repository.py
│   │   ├── knowledge_repository.py
│   │   ├── mistake_repository.py
│   │   ├── organization_repository.py
│   │   ├── simulator_repository.py
│   │   ├── tag_repository.py
│   │   └── user_repository.py
│   ├── services/                 # Business logic layer
│   │   ├── advice_service.py
│   │   ├── dashboard_service.py
│   │   ├── experience_service.py
│   │   ├── mistake_service.py
│   │   ├── organization_service.py
│   │   └── simulator_service.py
│   └── schemas/
│       └── common.py             # Pydantic request/response schemas
├── data/                         # Original untouched JSON backups
│   ├── advice.json
│   ├── engineers.json
│   ├── experiences.json
│   ├── mistakes.json
│   ├── organization_data.json
│   ├── organizations.json
│   └── simulator_scenarios.json
├── main.py                       # FastAPI application entry point
├── migrate_json.py               # JSON to MySQL migration script
├── seed.py                       # Idempotent database seeder
├── test_database.py              # Pytest unit & integration test suite
├── test_endpoints.py             # Live HTTP API smoke test suite
├── requirements.txt              # Project dependencies
├── .env.example                  # Environment template
└── .gitignore                    # Secrets & build artifact ignore rules
```

---

## Database Schema & ERD

```mermaid
erDiagram
    users ||--o{ experiences : "author"
    users ||--o{ organization_members : "member of"
    organizations ||--o{ organization_members : "has members"
    organizations ||--o{ organization_knowledge : "owns vault"
    domains ||--o{ experiences : "categorizes"
    domains ||--o{ mistakes : "categorizes"
    domains ||--o{ advice : "categorizes"
    experiences }|--|{ tags : "tagged with"
    simulator_scenarios ||--o{ simulator_steps : "contains"
    simulator_steps ||--o{ simulator_decision_options : "offers"
    simulator_scenarios ||--o{ simulator_attempts : "attempted in"

    users {
        string id PK
        string email UK
        string name
        string role
        int years_of_experience
        string engineering_discipline
        boolean is_active
        timestamp created_at
    }

    organizations {
        string id PK
        string slug UK
        string name
        string password_hash
        string salt
        string plan
        timestamp created_at
    }

    organization_knowledge {
        string id PK
        string organization_id FK
        string category
        string title
        text content
        json metadata_json
        string created_by FK
        timestamp created_at
    }

    experiences {
        string id PK
        string title
        string domain_id FK
        string contributor_id FK
        text problem
        text decision
        text lesson
        int year
        string severity
        timestamp created_at
    }

    mistakes {
        string id PK
        string title
        string domain_id FK
        text what_happened
        text why_it_happened
        text prevention
        timestamp created_at
    }

    advice {
        string id PK
        string domain_id FK
        string category
        text insight
        string context
        timestamp created_at
    }

    simulator_scenarios {
        string id PK
        string title
        string difficulty
        int estimated_minutes
        timestamp created_at
    }

    simulator_steps {
        string id PK
        string scenario_id FK
        int step_order
        text scenario_prompt
    }

    simulator_decision_options {
        string id PK
        string step_id FK
        text text
        boolean is_recommended
        int score_delta
        text rationale
    }
```

---

## API Endpoint Reference

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/` | — | API status, version, configured AI modules |
| `GET` | `/health/database` | — | MySQL connection health, dialect, and table list |
| `GET` | `/dashboard` | — | Aggregated public stats, counts, and recent records |
| `POST` | `/transcribe` | — | Audio upload (`multipart/form-data`) → STT → LLM extraction |
| `POST` | `/structure` | — | Text transcript → structured experience |
| `GET` | `/search` | — | Keyword/semantic search with domain and severity filters |
| `GET` | `/experiences` | — | Paginated experience library with domain facets |
| `GET` | `/experiences/{id}` | — | Single experience record with related mistakes & advice |
| `POST` | `/experiences` | — | Create new experience record |
| `PUT` | `/experiences/{id}` | — | Update an existing experience record |
| `DELETE` | `/experiences/{id}` | — | Delete an experience record |
| `GET` | `/mistakes` | — | Mistakes library with search and domain filters |
| `GET` | `/mistakes/{id}` | — | Single mistake record with related experiences |
| `GET` | `/simulator` | — | Interactive troubleshooting scenarios with steps and options |
| `POST` | `/score` | — | Compute Experience Transfer Score and record attempt |
| `GET` | `/advice` | — | Advice entries with category filter |
| `POST` | `/organization/login` | — | Organization authentication → session token |
| `GET` | `/organization/vault` | Bearer | Private organization knowledge assets |
| `GET` | `/organization/onboarding` | Bearer | Curated onboarding materials |
| `GET` | `/organization/troubleshooting` | Bearer | Organization-specific troubleshooting runbooks |
| `GET` | `/organization/postmortems` | Bearer | Post-incident reviews and learnings |
| `GET` | `/organization/retirement` | Bearer | Retirement transition knowledge register |
| `GET` | `/organization/kri` | Bearer | Knowledge Risk Indicators |
| `GET` | `/organization/dashboard` | Bearer | Organization aggregate stats |

---

## Frontend API Contract

All JSON response structures exactly match the specifications expected by `AXIOM FRONTEND/api.js`.

### Standard Success Response:
```json
{
  "success": true,
  "data": { ... }
}
```

### Standard Error Response:
```json
{
  "success": false,
  "error": {
    "code": "not_found",
    "message": "Experience 'exp-999' was not found."
  }
}
```

Standard HTTP status codes:
- `200 OK` / `201 Created` — Successful operations
- `400 Bad Request` (`bad_request`) — Validation error or invalid file format
- `401 Unauthorized` (`unauthorized`) — Missing or invalid Bearer token
- `404 Not Found` (`not_found`) — Entity not found in database
- `422 Unprocessable Entity` (`validation_error`) — Request payload schema mismatch
- `500 Internal Server Error` (`internal_error`) — Unhandled exception

---

## Demo Credentials

For testing organization features in `OrganizationLogin.jsx`:

| Organization Name | Alias | Demo Password | Salt |
|---|---|---|---|
| Northstar Engineering | `northwind` | `Northstar@2026` | `wk-demo-salt-c3` |
| Meridian Cloud Labs | `meridian` | `meridian@2026` | `wk-demo-salt-b2` |

---

## Tenant Isolation Architecture

Organization vaults are strictly isolated:
1. Every query in `KnowledgeRepository` filters by `organization_id == auth_user.organization_id`.
2. Cross-tenant reads are prevented at the repository layer; attempting to query an asset belonging to another organization returns an empty result or a 404.
3. Multi-tenancy isolation is automatically verified in `test_database.py::test_organization_isolation`.

---

## Testing & Verification

### 1. Automated Test Suite (Pytest)
Run all 16 unit and integration tests covering CRUD, isolation, foreign key constraints, pagination, and rollback:

```bash
pytest -v test_database.py
```

### 2. Live Smoke Test Suite
Run end-to-end HTTP smoke tests against a running server:

```bash
# Terminal 1: Start backend
uvicorn main:app --port 8000

# Terminal 2: Run smoke tests
python test_endpoints.py
```

Expected output: `RESULT: 20 passed, 0 failed`.

---

## Troubleshooting Guide

### 1. Connection Timeout or `Can't connect to MySQL server`
- **Cause:** Network firewall, incorrect port, or Aiven MySQL service powering up.
- **Fix:** Verify your host and port in `.env`. Ensure your Aiven service IP filter allows your current IP address (or set `0.0.0.0/0` in Aiven console during development).

### 2. SSL Certificate Errors (`SSL: CERTIFICATE_VERIFY_FAILED`)
- **Cause:** PyMySQL cannot locate or validate `ca.pem`.
- **Fix:** Verify that `ca.pem` is located in the working directory or set the absolute path in `DB_SSL_CA` in `.env`.

### 3. Connection Pool Exhaustion (`QueuePool limit of size 10 overflow 20 reached`)
- **Cause:** Leaked database sessions not closing properly.
- **Fix:** WisdomKernel uses FastAPI's `Depends(get_db)` which guarantees `db.close()` in a `finally` block. If running external scripts, ensure sessions are managed with context managers (`with SessionLocal() as db:`).

### 4. Alembic `Target database is not up to date`
- **Cause:** Migration head does not match the database revision.
- **Fix:** Run `alembic upgrade head`. To inspect the current version, run `alembic current`.

---

## Security Notice & Production Recommendations

1. **Password Hashing:** The demo uses salted SHA-256 for rapid local prototyping. For production deployments, upgrade to `argon2` or `bcrypt` by installing `passlib[argon2]`.
2. **Session Storage:** Tokens are currently tracked in-memory. For horizontal multi-worker scaling, configure signed JWT tokens (`python-jose`) or Redis-backed sessions.
3. **CORS Configuration:** Never set `ALLOWED_ORIGINS=*` in production; whitelist only your verified frontend origin.
4. **SSL Verification:** Keep `DB_SSL_VERIFY_CERT=True` to prevent Man-in-the-Middle (MitM) attacks against cloud databases.
