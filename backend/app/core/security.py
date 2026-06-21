from passlib.hash import bcrypt
from datetime import datetime, timedelta
import jwt
from app.config import settings
from typing import Optional


class SecurityService:
    def hash_password(self, password: str) -> str:
        return bcrypt.hash(password)

    def verify_password(self, password: str, hashed: str) -> bool:
        return bcrypt.verify(password, hashed)

    def create_token(self, user_id: str) -> str:
        payload = {
            "sub": user_id,
            "exp": datetime.utcnow() + timedelta(hours=settings.JWT_EXPIRY_HOURS),
            "iat": datetime.utcnow(),
            "type": "access",
        }
        return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)

    def decode_token(self, token: str) -> Optional[dict]:
        try:
            return jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        except jwt.PyJWTError:
            return None


security = SecurityService()
