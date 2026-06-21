import time
from typing import Tuple
from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserLogin, UserResponse
from app.api.deps import get_current_user
from passlib.hash import bcrypt
import jwt
from datetime import datetime, timedelta
from app.config import settings
from app.utils.uuid7 import uuid7
from app.core.security import (
    security_store, validate_password_strength,
    sanitize_input, generate_secure_jti,
    generate_refresh_token, hash_token, hash_ip
)
from app.core.audit import (
    audit_login_success, audit_login_failure, audit_register,
    audit_logout, audit_token_blacklisted
)

router = APIRouter()

REFRESH_TOKEN_COOKIE = "refresh_token"
REFRESH_TOKEN_MAX_AGE = settings.JWT_REFRESH_EXPIRY_DAYS * 86400


def create_access_token(user_id: str) -> str:
    now = datetime.utcnow()
    payload = {
        "sub": user_id,
        "exp": now + timedelta(hours=settings.JWT_EXPIRY_HOURS),
        "iat": now,
        "jti": generate_secure_jti(),
        "type": "access",
        "token_version": 2,
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def create_refresh_tokens(user_id: str) -> Tuple[str, str]:
    raw = generate_refresh_token()
    return raw, hash_token(raw)


def set_refresh_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=REFRESH_TOKEN_COOKIE,
        value=token,
        max_age=REFRESH_TOKEN_MAX_AGE,
        httponly=True,
        secure=True,
        samesite="strict",
        path="/api/v1/auth",
    )


def clear_refresh_cookie(response: Response) -> None:
    response.delete_cookie(
        key=REFRESH_TOKEN_COOKIE,
        path="/api/v1/auth",
    )


async def issue_tokens(user_id: str, response: Response) -> dict:
    access_token = create_access_token(user_id)
    raw_rt, hashed_rt = create_refresh_tokens(user_id)
    await security_store.store_refresh_token(hashed_rt, user_id, REFRESH_TOKEN_MAX_AGE)
    set_refresh_cookie(response, raw_rt)
    return {"token": access_token, "expires_in": settings.JWT_EXPIRY_HOURS * 3600}


def _user_response(user: User) -> dict:
    return {
        "id": str(user.id),
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role.value,
        "xp": user.xp,
        "level": user.level,
        "is_premium": user.is_premium,
    }


@router.post("/register", response_model=dict)
async def register(data: UserCreate, request: Request, response: Response, db: AsyncSession = Depends(get_db)):
    client_ip = hash_ip(request.client.host if request.client else "unknown")

    allowed, retry = await security_store.check_rate(client_ip, "register", 5, 3600, 60)
    if not allowed:
        raise HTTPException(status_code=429, detail=f"Too many attempts. Retry in {retry}s.")

    password_error = validate_password_strength(data.password)
    if password_error:
        raise HTTPException(status_code=400, detail=password_error)

    data.email = sanitize_input(data.email.lower().strip(), 255)
    data.full_name = sanitize_input(data.full_name.strip(), 255)

    existing = await db.execute(select(User).where(User.email == data.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(id=uuid7(), email=data.email, full_name=data.full_name, password_hash=bcrypt.hash(data.password))
    db.add(user)
    await db.flush()
    await db.refresh(user)

    await security_store.reset_rate(client_ip, "register")
    tokens = await issue_tokens(str(user.id), response)
    audit_register(str(user.id), user.email, client_ip)

    return {"token": tokens["token"], "expires_in": tokens["expires_in"], "user": _user_response(user)}


@router.post("/login", response_model=dict)
async def login(data: UserLogin, request: Request, response: Response, db: AsyncSession = Depends(get_db)):
    client_ip = hash_ip(request.client.host if request.client else "unknown")
    data.email = sanitize_input(data.email.lower().strip(), 255)

    allowed, retry = await security_store.check_rate(client_ip, "login", 5, 300, 15)
    if not allowed:
        raise HTTPException(status_code=429, detail=f"Too many attempts. Retry in {retry}s.")

    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()

    if not user or not user.is_active:
        audit_login_failure(data.email, client_ip, "user_not_found")
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not user.password_hash or not bcrypt.verify(data.password, user.password_hash):
        audit_login_failure(data.email, client_ip, "invalid_password")
        raise HTTPException(status_code=401, detail="Invalid email or password")

    await security_store.reset_rate(client_ip, "login")
    tokens = await issue_tokens(str(user.id), response)
    audit_login_success(str(user.id), user.email, client_ip)

    return {"token": tokens["token"], "expires_in": tokens["expires_in"], "user": _user_response(user)}


@router.post("/refresh", response_model=dict)
async def refresh(request: Request, response: Response, db: AsyncSession = Depends(get_db)):
    raw_rt = request.cookies.get(REFRESH_TOKEN_COOKIE) or request.headers.get("X-Refresh-Token")
    if not raw_rt:
        raise HTTPException(status_code=401, detail="Refresh token required")

    hashed_rt = hash_token(raw_rt)
    user_id = await security_store.consume_refresh_token(hashed_rt)
    if not user_id:
        clear_refresh_cookie(response)
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")

    from uuid import UUID as UUIDType
    try:
        uid = UUIDType(user_id) if isinstance(user_id, str) else user_id
    except ValueError:
        clear_refresh_cookie(response)
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    result = await db.execute(select(User).where(User.id == uid))
    user = result.scalar_one_or_none()
    if not user or not user.is_active:
        clear_refresh_cookie(response)
        raise HTTPException(status_code=401, detail="User not found or inactive")

    tokens = await issue_tokens(str(user.id), response)

    return {"token": tokens["token"], "expires_in": tokens["expires_in"], "user": _user_response(user)}


@router.post("/logout", response_model=dict)
async def logout(request: Request, response: Response, current_user: User = Depends(get_current_user)):
    client_ip = hash_ip(request.client.host if request.client else "unknown")

    auth_header = request.headers.get("Authorization", "")
    token = auth_header.replace("Bearer ", "")
    if token:
        try:
            payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM], options={"verify_exp": False})
            jti = payload.get("jti")
            exp = payload.get("exp", time.time() + 3600)
            if jti:
                await security_store.blacklist_token(jti, exp)
        except jwt.PyJWTError:
            pass

    raw_rt = request.cookies.get(REFRESH_TOKEN_COOKIE)
    if raw_rt:
        hashed_rt = hash_token(raw_rt)
        await security_store.consume_refresh_token(hashed_rt)

    clear_refresh_cookie(response)
    audit_logout(str(current_user.id), current_user.email, client_ip)
    return {"detail": "Logged out successfully"}


@router.post("/logout-all", response_model=dict)
async def logout_all(request: Request, response: Response, current_user: User = Depends(get_current_user)):
    await security_store.revoke_all_user_tokens(str(current_user.id))
    clear_refresh_cookie(response)
    return {"detail": "Logged out of all devices"}


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user
