"""
base_repository.py
------------------
Base repository with common database session management.
"""

from typing import Generic, TypeVar
from sqlalchemy.orm import Session

from app.database.base import Base

ModelType = TypeVar("ModelType", bound=Base)


class BaseRepository(Generic[ModelType]):
    def __init__(self, db: Session):
        self.db = db
