import logging
from typing import Optional
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.user import User, UserRole
from uuid import UUID
from datetime import datetime, timezone
import jwt
from app.config import settings
from app.core.security import security_store, hash_ip, hash_user_agent

logger = logging.getLogger("security")

security = HTTPBearer(auto_error=False)


async def verify_token(token: str, request: Optional[Request] = None) -> str:
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM],
            options={"require": ["sub", "exp", "jti", "iat", "token_version"]},
        )

        token_type = payload.get("type", "")
        if token_type and token_type != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")

        token_version = payload.get("token_version", 0)
        if token_version < 3:
            raise HTTPException(status_code=401, detail="Token version outdated. Please login again.")

        jti = payload.get("jti")
        if jti and await security_store.is_token_blacklisted(jti):
            raise HTTPException(status_code=401, detail="Token has been revoked")

        issuer = payload.get("iss", "")
        if issuer and issuer != settings.JWT_ISSUER:
            raise HTTPException(status_code=401, detail="Invalid token issuer")

        if request and settings.ENABLE_TOKEN_IP_BINDING:
            client_ip = hash_ip(request.client.host if request.client else "unknown")
            token_ip = payload.get("ip", "")
            if token_ip and token_ip != client_ip:
                logger.warning("Token IP mismatch: expected=%s got=%s sub=%s", token_ip, client_ip, payload.get("sub", "?"))
                raise HTTPException(status_code=401, detail="Session fingerprint changed. Please login again.")

        exp = payload.get("exp", 0)
        if exp < payload.get("iat", 0) + 60:
            raise HTTPException(status_code=401, detail="Token lifespan too short")

        return payload["sub"]
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.PyJWTError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token")


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: AsyncSession = Depends(get_db),
    request: Request = None,
) -> User:
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = await verify_token(credentials.credentials, request)

    try:
        uid = UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid token: bad subject")

    result = await db.execute(select(User).where(User.id == uid))
    user = result.scalar_one_or_none()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or inactive")

    if user.locked_until and user.locked_until > datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_423_LOCKED,
            detail="Account is locked"
        )

    return user


async def get_admin_user(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role not in (UserRole.ADMIN, UserRole.SUPER_ADMIN):
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


async def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False)),
    db: AsyncSession = Depends(get_db),
) -> Optional[User]:
    if not credentials:
        return None
    try:
        return await get_current_user(credentials, db)
    except HTTPException:
        return None
