import time
from typing import Tuple, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserLogin, UserResponse
from app.api.deps import get_current_user
import bcrypt as _bcrypt
import jwt
from datetime import datetime, timedelta, timezone
from app.config import settings
from app.utils.uuid7 import uuid7
from app.core.security import (
    security_store, validate_password_strength,
    sanitize_input, generate_secure_jti,
    generate_refresh_token, hash_token, hash_ip,
    hash_user_agent, is_password_expired,
    check_password_history
)
from app.core.audit import (
    audit_login_success, audit_login_failure, audit_register,
    audit_logout, audit_password_changed, audit_account_locked
)

router = APIRouter()

REFRESH_TOKEN_COOKIE = "refresh_token"
REFRESH_TOKEN_MAX_AGE = settings.JWT_REFRESH_EXPIRY_DAYS * 86400

_utc = timezone.utc


def now_utc() -> datetime:
    return datetime.now(_utc)


def _user_agent(request: Request) -> str:
    return request.headers.get("User-Agent", "unknown")


def create_access_token(user_id: str, ip_hash: str, ua_hash: str) -> str:
    now = now_utc()
    payload = {
        "sub": user_id,
        "exp": now + timedelta(minutes=settings.JWT_EXPIRY_MINUTES),
        "iat": now,
        "jti": generate_secure_jti(),
        "type": "access",
        "token_version": 3,
        "ip": ip_hash,
        "ua": ua_hash,
        "iss": settings.JWT_ISSUER,
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
        secure=not settings.DEBUG,
        samesite="lax",
        path="/api/v1/auth",
    )


def clear_refresh_cookie(response: Response) -> None:
    response.delete_cookie(
        key=REFRESH_TOKEN_COOKIE,
        path="/api/v1/auth",
    )


async def issue_tokens(user_id: str, request: Request, response: Response) -> dict:
    ip_hash = hash_ip(request.client.host if request.client else "unknown")
    ua_hash = hash_user_agent(_user_agent(request))
    access_token = create_access_token(user_id, ip_hash, ua_hash)
    raw_rt, hashed_rt = create_refresh_tokens(user_id)
    await security_store.store_refresh_token(hashed_rt, user_id, REFRESH_TOKEN_MAX_AGE)
    set_refresh_cookie(response, raw_rt)
    return {
        "token": access_token,
        "expires_in": settings.JWT_EXPIRY_MINUTES * 60,
    }


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


def _hash_password(password: str) -> str:
    return _bcrypt.hashpw(password.encode(), _bcrypt.gensalt(rounds=12)).decode()


def _verify_password(password: str, password_hash: str) -> bool:
    try:
        return _bcrypt.checkpw(password.encode(), password_hash.encode())
    except Exception:
        return False


async def _check_user_lockout(user: User) -> None:
    if user.locked_until and user.locked_until > now_utc():
        remaining = int((user.locked_until - now_utc()).total_seconds())
        raise HTTPException(
            status_code=status.HTTP_423_LOCKED,
            detail=f"Account locked. Try again in {remaining // 60} minutes."
        )


async def _handle_failed_login(db: AsyncSession, user: User, ip: str, email: str) -> None:
    user.failed_login_attempts = (user.failed_login_attempts or 0) + 1
    if user.failed_login_attempts >= settings.ACCOUNT_LOCKOUT_THRESHOLD:
        user.locked_until = now_utc() + timedelta(minutes=settings.ACCOUNT_LOCKOUT_MINUTES)
        audit_account_locked(email, ip)
    await db.flush()


async def _reset_login_lockout(db: AsyncSession, user: User) -> None:
    user.failed_login_attempts = 0
    user.locked_until = None
    await security_store.reset_failed_logins(str(user.id))
    await db.flush()


@router.post("/register", response_model=dict)
async def register(data: UserCreate, request: Request, response: Response, db: AsyncSession = Depends(get_db)):
    client_ip = hash_ip(request.client.host if request.client else "unknown")

    data.email = sanitize_input(data.email.lower().strip(), 255)
    data.full_name = sanitize_input(data.full_name.strip(), 255)

    if not data.password:
        raise HTTPException(status_code=400, detail="Password is required")

    password_error = validate_password_strength(data.password)
    if password_error:
        raise HTTPException(status_code=400, detail=password_error)

    existing = await db.execute(select(User).where(User.email == data.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Email already registered")

    password_hash = _hash_password(data.password)
    now = now_utc()
    user = User(
        id=uuid7(),
        email=data.email,
        full_name=data.full_name,
        password_hash=password_hash,
        password_changed_at=now,
        password_history=[password_hash],
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)

    tokens = await issue_tokens(str(user.id), request, response)
    audit_register(str(user.id), user.email, client_ip)

    return {"token": tokens["token"], "expires_in": tokens["expires_in"], "user": _user_response(user)}


@router.post("/login", response_model=dict)
async def login(data: UserLogin, request: Request, response: Response, db: AsyncSession = Depends(get_db)):
    client_ip = hash_ip(request.client.host if request.client else "unknown")
    data.email = sanitize_input(data.email.lower().strip(), 255)

    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()

    if not user or not user.is_active:
        audit_login_failure(data.email, client_ip, "invalid_credentials")
        raise HTTPException(status_code=401, detail="Invalid email or password")

    await _check_user_lockout(user)

    if not user.password_hash or not _verify_password(data.password, user.password_hash):
        await _handle_failed_login(db, user, client_ip, data.email)
        audit_login_failure(data.email, client_ip, "invalid_password")
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if is_password_expired(user.password_changed_at):
        raise HTTPException(
            status_code=status.HTTP_428_PRECONDITION_REQUIRED,
            detail="Password expired. Please reset your password."
        )

    await _reset_login_lockout(db, user)
    tokens = await issue_tokens(str(user.id), request, response)
    audit_login_success(str(user.id), user.email, client_ip)

    return {"token": tokens["token"], "expires_in": tokens["expires_in"], "user": _user_response(user)}


@router.put("/password", response_model=dict)
async def change_password(
    data: dict,
    request: Request,
    response: Response,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    client_ip = hash_ip(request.client.host if request.client else "unknown")

    old_password = data.get("old_password", "")
    new_password = data.get("new_password", "")

    if not current_user.password_hash or not _verify_password(old_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    password_error = validate_password_strength(new_password)
    if password_error:
        raise HTTPException(status_code=400, detail=password_error)

    history_check = check_password_history(new_password, current_user.password_history)
    if history_check:
        raise HTTPException(status_code=400, detail=history_check)

    new_hash = _hash_password(new_password)
    history = (current_user.password_history or [])[-settings.PASSWORD_HISTORY_COUNT + 1:]
    history.append(new_hash)

    current_user.password_hash = new_hash
    current_user.password_history = history
    current_user.password_changed_at = now_utc()
    await db.flush()

    await security_store.revoke_all_user_tokens(str(current_user.id))
    tokens = await issue_tokens(str(current_user.id), request, response)
    audit_password_changed(str(current_user.id), current_user.email, hash_ip(request.client.host if request.client else "unknown"))

    return {"detail": "Password changed successfully", "token": tokens["token"], "expires_in": tokens["expires_in"]}


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

    tokens = await issue_tokens(str(user.id), request, response)

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
