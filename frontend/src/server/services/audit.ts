import crypto from 'crypto';

function mask(value: string): string {
  if (!value || value === 'unknown') return value;
  return crypto.createHash('sha256').update(value).digest('hex').slice(0, 16);
}

export class AuditEvent {
  constructor(
    public event: string,
    public userId?: string | null,
    public email?: string | null,
    public ip?: string | null,
    public details?: Record<string, any>,
  ) {}

  log(): void {
    const { logger } = require('../observability/logger');
    logger.info('AUDIT event=%s user=%s email_hash=%s ip_hash=%s details=%s',
      this.event,
      this.userId || 'anonymous',
      mask(this.email || ''),
      mask(this.ip || ''),
      JSON.stringify(this.details || {}),
    );
  }
}

export function auditLoginSuccess(userId: string, email: string, ip: string): void {
  new AuditEvent('login_success', userId, email, ip).log();
}

export function auditLoginFailure(email: string, ip: string, reason: string = 'invalid_password'): void {
  new AuditEvent('login_failure', null, email, ip, { reason }).log();
}

export function auditRegister(userId: string, email: string, ip: string): void {
  new AuditEvent('register', userId, email, ip).log();
}

export function auditLogout(userId: string, email: string, ip: string): void {
  new AuditEvent('logout', userId, email, ip).log();
}

export function auditPasswordChanged(userId: string, email: string, ip: string): void {
  new AuditEvent('password_changed', userId, email, ip).log();
}

export function auditAdminAction(adminId: string, action: string, details: Record<string, any>): void {
  new AuditEvent('admin_action', adminId, null, null, { action, ...details }).log();
}

export function auditApiAbuse(ip: string, endpoint: string, userId?: string | null): void {
  new AuditEvent('api_abuse_detected', userId, null, ip, { endpoint }).log();
}
