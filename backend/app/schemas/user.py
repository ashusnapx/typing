from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, List
from datetime import datetime
from uuid import UUID
from app.models.user import UserRole
import re


class UserCreate(BaseModel):
    email: str
    password: Optional[str] = None
    full_name: str
    phone: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    city: Optional[str] = None
    college: Optional[str] = None

    @field_validator("email")
    @classmethod
    def validate_email(cls, v):
        v = v.strip().lower()
        if not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', v):
            raise ValueError("Invalid email format")
        if len(v) > 254:
            raise ValueError("Email too long")
        return v

    @field_validator("full_name")
    @classmethod
    def validate_full_name(cls, v):
        v = v.strip()
        if len(v) < 2:
            raise ValueError("Name must be at least 2 characters")
        if len(v) > 255:
            raise ValueError("Name too long")
        if not re.match(r'^[a-zA-Z\s\-\'\.]+$', v):
            raise ValueError("Name contains invalid characters")
        return v

    @field_validator("password")
    @classmethod
    def validate_password(cls, v):
        if v is not None:
            if len(v) > 128:
                raise ValueError("Password too long")
        return v


class UserLogin(BaseModel):
    email: str
    password: str

    @field_validator("email")
    @classmethod
    def validate_email(cls, v):
        v = v.strip().lower()
        if len(v) > 254:
            raise ValueError("Email too long")
        return v


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

    @field_validator("full_name")
    @classmethod
    def validate_full_name(cls, v):
        if v is not None:
            v = v.strip()
            if len(v) < 2:
                raise ValueError("Name must be at least 2 characters")
            if len(v) > 255:
                raise ValueError("Name too long")
        return v
