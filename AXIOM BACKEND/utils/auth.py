"""
auth.py
-------
Prototype organization authentication for the WisdomKernel MVP.

HOW IT WORKS
  * Organizations live in data/organizations.json with a salted SHA-256 hash.
  * A successful login mints a random opaque token (secrets.token_urlsafe).
  * Active sessions are kept in a process-local dictionary with an expiry.
  * Protected routes depend on `require_organization`, which reads the token
    from the `Authorization: Bearer <token>` header (an `X-Auth-Token` header
    is also accepted for convenience during frontend development).

!!  PROTOTYPE ONLY  !!
This is deliberately simple so the team can explain it end to end. It is NOT
production authentication:
  * SHA-256 is a fast hash -- production must use bcrypt/argon2/scrypt.
  * Sessions are in memory, so they vanish on restart and do not survive
    more than one server process.
  * There is no rate limiting, lockout, refresh, or revocation list.
Replace this module with a real identity provider before any deployment.
"""

from __future__ import annotations

import hashlib
import logging
import os
import secrets
import threading
import time
from typing import Optional

from fastapi import Header, HTTPException, status

from utils import data_loader

logger = logging.getLogger("wisdomkernel.auth")

# Token lifetime in seconds (default 8 hours), overridable from .env
TOKEN_TTL_SECONDS = int(os.getenv("TOKEN_TTL_SECONDS", "28800"))

# token -> {organization_id, organization_name, issued_at, expires_at}
_sessions: dict[str, dict] = {}
_lock = threading.Lock()


# ---------------------------------------------------------------------------
# Credentials
# ---------------------------------------------------------------------------

def _hash_password(salt: str, password: str) -> str:
    return hashlib.sha256((salt + password).encode("utf-8")).hexdigest()


def find_organization(organization_name: str) -> Optional[dict]:
    """Look an organization up by display name or slug, case-insensitively."""
    if not organization_name:
        return None
    needle = organization_name.strip().lower()
    for org in data_loader.get_organizations():
        if needle in (
            str(org.get("name", "")).strip().lower(),
            str(org.get("slug", "")).strip().lower(),
        ):
            return org
    return None


def verify_credentials(organization_name: str, password: str) -> Optional[dict]:
    """
    Return the organization record when the credentials are valid, else None.
    Uses a constant-time comparison to avoid trivial timing leaks.
    """
    org = find_organization(organization_name)
    if org is None:
        return None

    expected = str(org.get("password_sha256", ""))
    actual = _hash_password(str(org.get("password_salt", "")), password or "")
    if expected and secrets.compare_digest(expected, actual):
        return org
    return None


# ---------------------------------------------------------------------------
# Sessions
# ---------------------------------------------------------------------------

def create_session(org: dict, user: Optional[dict] = None) -> dict:
    """Mint a token for an organization + user role and store the session in memory."""
    token = secrets.token_urlsafe(32)
    now = time.time()
    session = {
        "organization_id": org.get("id"),
        "organization_name": org.get("name"),
        "user_id": user.get("id") if user else "usr-anon",
        "user_name": user.get("name") if user else "Organization User",
        "email": user.get("email") if user else "",
        "role": user.get("role") if user else "HEAD_ADMIN",
        "department": user.get("department") if user else "Engineering",
        "issued_at": now,
        "expires_at": now + TOKEN_TTL_SECONDS,
    }
    with _lock:
        _sessions[token] = session
    logger.info("Issued session token for organization %s (user: %s, role: %s)", org.get("id"), session["user_id"], session["role"])
    return {"token": token, **session}


def get_session(token: str) -> Optional[dict]:
    """Return a live session for the token, or None if missing/expired."""
    if not token:
        return None
    with _lock:
        session = _sessions.get(token)
        if session is None:
            return None
        if session["expires_at"] < time.time():
            _sessions.pop(token, None)
            return None
        return dict(session)


def destroy_session(token: str) -> bool:
    with _lock:
        return _sessions.pop(token, None) is not None


def active_session_count() -> int:
    with _lock:
        return len(_sessions)


def _extract_token(authorization: Optional[str], x_auth_token: Optional[str]) -> Optional[str]:
    if authorization:
        parts = authorization.split(" ", 1)
        if len(parts) == 2 and parts[0].lower() == "bearer":
            return parts[1].strip()
        # Tolerate a bare token in the Authorization header.
        if len(parts) == 1 and parts[0].strip():
            return parts[0].strip()
    if x_auth_token:
        return x_auth_token.strip()
    return None


# ---------------------------------------------------------------------------
# FastAPI dependencies
# ---------------------------------------------------------------------------

async def require_organization(
    authorization: Optional[str] = Header(
        default=None,
        description="Bearer token returned by POST /organization/login",
    ),
    x_auth_token: Optional[str] = Header(
        default=None,
        alias="X-Auth-Token",
        description="Alternative header for the same token",
    ),
) -> dict:
    """
    FastAPI dependency guarding every /organization/* data route.

    Raises 401 when the token is missing, unknown or expired. Returns the
    session dict (organization_id, organization_name, ...) on success.
    """
    token = _extract_token(authorization, x_auth_token)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication token. Send 'Authorization: Bearer <token>'.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    session = get_session(token)
    if session is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    session["token"] = token
    return session


def require_role(allowed_roles: list[str]):
    """
    FastAPI dependency factory enforcing Role-Based Access Control (RBAC).
    Guarantees backend 403 Forbidden rejection if user role is unauthorized.
    """
    from fastapi import Depends

    async def _role_checker(session: dict = Depends(require_organization)) -> dict:
        user_role = session.get("role", "JUNIOR_EMPLOYEE")
        # HEAD_ADMIN has superuser access, otherwise user_role MUST be in allowed_roles
        if user_role != "HEAD_ADMIN" and user_role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access Denied: Your role '{user_role}' is not authorized to access this section. Required role: {', '.join(allowed_roles)}.",
            )
        return session

    return _role_checker


