"""
user_repository.py
------------------
Data access for Users and Contributors.
"""

from __future__ import annotations

from typing import Optional
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database.models.user import User
from app.repositories.base_repository import BaseRepository


class UserRepository(BaseRepository[User]):
    def get_by_id(self, user_id: str) -> Optional[User]:
        return self.db.execute(select(User).where(User.id == user_id)).scalar_one_or_none()

    def get_by_email(self, email: str) -> Optional[User]:
        return self.db.execute(select(User).where(User.email == email)).scalar_one_or_none()

    def list_all(self) -> list[User]:
        return list(self.db.execute(select(User)).scalars().all())

    def create(self, user: User) -> User:
        self.db.add(user)
        self.db.flush()
        return user

    def upsert(self, user_data: dict) -> User:
        existing = self.get_by_id(user_data["id"])
        if existing:
            for k, v in user_data.items():
                setattr(existing, k, v)
            self.db.flush()
            return existing
        new_user = User(**user_data)
        self.db.add(new_user)
        self.db.flush()
        return new_user
