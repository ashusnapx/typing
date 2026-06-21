from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserLogin, UserResponse
from app.api.deps import get_current_user
from passlib.hash import bcrypt
import jwt
from datetime import datetime, timedelta
from app.config import settings
from sqlalchemy import select
from app.utils.uuid7 import uuid7

router = APIRouter()


def create_access_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.utcnow() + timedelta(hours=settings.JWT_EXPIRY_HOURS),
        "iat": datetime.utcnow(),
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


@router.post("/register", response_model=dict)
async def register(data: UserCreate, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(User).where(User.email == data.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    password_hash = bcrypt.hash(data.password) if data.password else None

    user = User(
        id=uuid7(),
        email=data.email,
        full_name=data.full_name,
        password_hash=password_hash,
        phone=data.phone,
        state=data.state,
        district=data.district,
        city=data.city,
        college=data.college,
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)

    token = create_access_token(str(user.id))
    return {
        "token": token,
        "user": {
            "id": str(user.id),
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role.value,
            "xp": user.xp,
            "level": user.level,
            "is_premium": user.is_premium,
        },
    }


@router.post("/login", response_model=dict)
async def login(data: UserLogin, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if user.password_hash:
        if not bcrypt.verify(data.password, user.password_hash):
            raise HTTPException(status_code=401, detail="Invalid credentials")
    elif data.password:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token(str(user.id))
    return {
        "token": token,
        "user": {
            "id": str(user.id),
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role.value,
            "xp": user.xp,
            "level": user.level,
            "is_premium": user.is_premium,
        },
    }


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user
