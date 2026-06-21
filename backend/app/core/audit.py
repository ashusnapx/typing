import logging
import hashlib
from datetime import datetime
from typing import Optional

audit_logger = logging.getLogger("audit")


def _mask(value: str) -> str:
    if not value or value == "unknown":
        return value
    return hashlib.sha256(value.encode()).hexdigest()[:16]


class AuditEvent:
    def __init__(self, event: str, user_id: Optional[str] = None, email: Optional[str] = None, ip: Optional[str] = None, details: Optional[dict] = None):
        self.event = event
        self.user_id = user_id
        self.email = email
        self.ip = ip
        self.timestamp = datetime.utcnow().isoformat()
        self.details = details or {}

    def log(self):
        audit_logger.info(
            "AUDIT event=%s user=%s email_hash=%s ip_hash=%s ts=%s details=%s",
            self.event, self.user_id or "anonymous", _mask(self.email or ""),
            _mask(self.ip or ""), self.timestamp, str(self.details)
        )

    def dict(self):
        return {
            "event": self.event,
            "user_id": self.user_id,
            "email": self.email,
            "ip": self.ip,
            "timestamp": self.timestamp,
            "details": self.details,
        }


def audit_login_success(user_id: str, email: str, ip: str):
    AuditEvent("login_success", user_id, email, ip).log()


def audit_login_failure(email: str, ip: str, reason: str = "invalid_password"):
    AuditEvent("login_failure", email=email, ip=ip, details={"reason": reason}).log()


def audit_register(user_id: str, email: str, ip: str):
    AuditEvent("register", user_id, email, ip).log()


def audit_logout(user_id: str, email: str, ip: str):
    AuditEvent("logout", user_id, email, ip).log()


def audit_token_blacklisted(jti: str, user_id: str):
    AuditEvent("token_blacklisted", user_id=user_id, details={"jti": jti}).log()


def audit_account_locked(email: str, ip: str):
    AuditEvent("account_locked", email=email, ip=ip, details={"reason": "too_many_attempts"}).log()


def audit_admin_action(admin_id: str, action: str, details: dict):
    AuditEvent("admin_action", user_id=admin_id, details={"action": action, **details}).log()


def audit_password_changed(user_id: str, email: str, ip: str):
    AuditEvent("password_changed", user_id, email, ip).log()


def audit_api_abuse(ip: str, endpoint: str, user_id: Optional[str] = None):
    AuditEvent("api_abuse_detected", user_id=user_id, ip=ip, details={"endpoint": endpoint}).log()
