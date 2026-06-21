from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from uuid import UUID
from app.models.user import UserRole


class UserCreate(BaseModel):
    email: str
    password: Optional[str] = None
    full_name: str
    phone: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    city: Optional[str] = None
    college: Optional[str] = None


class UserLogin(BaseModel):
    email: str
    password: str


class UserResponse(BaseModel):
    id: UUID
    email: str
    full_name: str
    role: UserRole
    state: Optional[str]
    district: Optional[str]
    city: Optional[str]
    college: Optional[str]
    xp: int
    level: int
    streak_days: int
    is_premium: bool
    total_tests_taken: int
    best_wpm: Optional[float]
    best_accuracy: Optional[float]
    created_at: datetime

    class Config:
        from_attributes = True


class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    city: Optional[str] = None
    college: Optional[str] = None
