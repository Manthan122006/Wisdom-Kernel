"""
connection.py
-------------
SQLAlchemy database engine, session factory, connection pooling,
SSL configuration for Aiven MySQL, and FastAPI database dependency.
"""

from __future__ import annotations

import logging
import os
import urllib.parse
from typing import Generator

from dotenv import load_dotenv
from sqlalchemy import create_engine, text, inspect
from sqlalchemy.engine import Engine
from sqlalchemy.orm import sessionmaker, Session

load_dotenv()

logger = logging.getLogger("wisdomkernel.database")


def get_database_url() -> str:
    """
    Resolve DATABASE_URL from environment.
    Supports either a full DATABASE_URL or discrete MYSQL_* variables.
    """
    url = os.getenv("DATABASE_URL")
    if url:
        return url

    # Build from discrete environment variables
    user = os.getenv("MYSQL_USER")
    password = os.getenv("MYSQL_PASSWORD")
    host = os.getenv("MYSQL_HOST")
    port = os.getenv("MYSQL_PORT", "3306")
    database = os.getenv("MYSQL_DATABASE", "defaultdb")

    if not (user and password and host):
        logger.warning("No DATABASE_URL or complete MYSQL_* credentials found in environment.")
        return ""

    encoded_password = urllib.parse.quote_plus(password)
    constructed_url = f"mysql+pymysql://{user}:{encoded_password}@{host}:{port}/{database}"
    return constructed_url


def build_engine(database_url: str | None = None) -> Engine:
    """
    Construct SQLAlchemy Engine with proper connection pooling and Aiven SSL verification.
    """
    url = database_url or get_database_url()
    if not url:
        raise ValueError(
            "Database URL is not configured. Please set DATABASE_URL or MYSQL_* environment variables."
        )

    connect_args: dict[str, object] = {}
    engine_kwargs: dict[str, object] = {}

    is_mysql = url.startswith("mysql") or "pymysql" in url

    if is_mysql:
        connect_args["charset"] = "utf8mb4"

        # Check for Aiven CA certificate
        ssl_ca = os.getenv("MYSQL_SSL_CA")
        connect_args["ssl"] = {"ssl_mode": "REQUIRED"}

        # Connection pooling for production MySQL
        engine_kwargs.update({
            "pool_size": int(os.getenv("DB_POOL_SIZE", "10")),
            "max_overflow": int(os.getenv("DB_MAX_OVERFLOW", "20")),
            "pool_recycle": int(os.getenv("DB_POOL_RECYCLE", "3600")),
            "pool_pre_ping": True,
        })
    elif url.startswith("sqlite"):
        engine_kwargs.update({"connect_args": {"check_same_thread": False}})

    if connect_args:
        engine_kwargs["connect_args"] = connect_args

    return create_engine(url, **engine_kwargs)


# Lazy engine & session initialization
_engine: Engine | None = None
_session_factory: sessionmaker[Session] | None = None


def get_engine() -> Engine:
    global _engine
    if _engine is None:
        _engine = build_engine()
    return _engine


def get_session_factory() -> sessionmaker[Session]:
    global _session_factory
    if _session_factory is None:
        _session_factory = sessionmaker(
            autocommit=False,
            autoflush=False,
            bind=get_engine(),
            expire_on_commit=False,
        )
    return _session_factory


def SessionLocal() -> Session:
    """Create a new database session instance."""
    factory = get_session_factory()
    return factory()


def get_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency that yields a database session.
    Automatically handles rollback on unhandled exceptions and closes session.
    """
    db = SessionLocal()
    try:
        yield db
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def check_database_connection(timeout_seconds: float = 5.0) -> dict[str, object]:
    """
    Execute a low-level SELECT 1 check to verify database connectivity.
    Never exposes raw passwords or credentials.
    """
    try:
        engine = get_engine()
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1")).scalar()
            inspector = inspect(engine)
            tables = inspector.get_table_names()
            return {
                "status": "connected" if result == 1 else "unexpected_result",
                "dialect": engine.dialect.name,
                "tables_count": len(tables),
                "tables": sorted(tables),
            }
    except Exception as exc:
        logger.error("Database connection check failed: %s", exc)
        return {
            "status": "disconnected",
            "error": str(exc),
        }
