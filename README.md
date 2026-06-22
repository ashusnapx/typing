# Maths Mania — India's Most Accurate SSC Typing Exam Simulator

[![CI/CD](https://github.com/mathsmania/platform/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/mathsmania/platform/actions)
[![Security](https://github.com/mathsmania/platform/actions/workflows/ci-cd.yml/badge.svg?job=security-scan)](https://github.com/mathsmania/platform/actions)

Maths Mania is a production-grade typing test platform that exactly replicates the **TCS iON exam environment** used by SSC for CHSL, CGL (DEST), Stenographer, and other government typing exams. Built for India's largest education ecosystem with **2M+ students**, it uses the **official SSC Net WPM formula**, Levenshtein-based error evaluation, and provides AI-powered coaching.

> **The problem it solves:** 90% of typing mock platforms use Gross WPM (inflating scores) or have a different interface than the real TCS iON exam. Maths Mania matches both — the exact formula and the exact interface.

---

## 📋 Table of Contents

- [Primary USP](#primary-usp)
- [Features](#features)
- [Exam Modes](#exam-modes)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Manual Setup](#manual-setup)
- [Architecture](#architecture)
- [Security Architecture](#security-architecture)
- [Testing](#testing)
- [CI/CD Pipeline](#cicd-pipeline)
- [API Documentation](#api-documentation)
- [Monitoring & Observability](#monitoring--observability)
- [Deployment](#deployment)
- [Environment Variables](#environment-variables)
- [Contributing](#contributing)
- [License](#license)

---

## Primary USP

- **Exact SSC Evaluation Logic** — Levenshtein Distance + Character-Level Diff + Word-Level Mapping. Not naive word matching. Handles partial matches, transpositions, and provides auditable error classification (Omission, Addition, Wrong Word, Substitution, Formatting, Space).
- **Official SSC Net WPM Formula** — `(Total Keystrokes ÷ 5 − Full Mistakes − Half Mistakes ÷ 2) ÷ Time`. Other sites use Gross WPM; we use the real government formula.
- **TCS iON Exam Replica** — Same split-screen layout, fonts, timer placement, instructions, and typing area. What you practice is what you get on exam day.
- **Blind Mode** — Real TCS iON hides errors during the test. Most mock sites show red/green feedback mid-test, building wrong expectations. Maths Mania has exact blind mode.
- **AI-Powered Typing Coach** — Analyzes every keystroke, identifies weak keys, error patterns, and fatigue zones. Generates custom drills.
- **Touch Typing Curriculum** — 10-level progressive system from home row to exam-ready. Designed for absolute beginners (Level 0: mouse lessons with 3D interactive model).
- **3D Interactive Learning** — Full QWERTY 3D keyboard with finger-zone coloring, keypress animation, next-key highlighting, home row glow. 3D mouse for click/scroll lessons.
- **Enterprise-Grade** — 99.99% uptime, Kubernetes, horizontal scaling, Redis cluster, PostgreSQL 16 + pgvector.

---

## Features

### SSC Error Engine v1
- Levenshtein Distance, Character-Level Diff, Word-Level Mapping
- Error types: Omission, Addition, Wrong Word, Substitution, Formatting, Space
- Auditable and explainable results — shows exactly what went wrong

### Keystroke Intelligence
- Every keystroke analyzed in real-time
- Heatmaps, error zones, typing rhythm graphs
- Left/Right hand, Shift key, Number row error tracking
- Typing Replay — like Chess.com game review, replay every keystroke, correction, and pause

### AI Typing Coach
- Personalized feedback after every test
- Identifies fatigue patterns and weak keys
- Generates daily drills and weak-word exercises
- Predicts improvement trajectory
- 93%+ confidence qualification prediction with sufficient data

### Smart Practice Generator
- Automatic passage generation focused on weak words
- Adaptive difficulty based on performance
- 50+ previous-year question passages from actual SSC/RRB exam papers

### Touch Typing Curriculum
| Level | Focus | Description |
|-------|-------|-------------|
| 0 | Mouse Basics | 3D mouse interactive lessons (click, scroll, right-click) |
| 1 | Home Row | ASDF JKL; — foundation finger placement |
| 2 | Top Row | QWERT YUIOP — reaching up from home |
| 3 | Bottom Row | ZXCV BNM,./ — reaching down |
| 4 | Shifts & Caps | Shift keys, capitalization, symbols |
| 5 | Number Row | 12345 67890 — number row drills |
| 6 | Special Chars | @ # $ % ^ & * ( ) — _ + = { } [ ] \| \ : ; " ' < > , . ? / |
| 7 | Common Words | Most frequent 500 English words |
| 8 | SSC Passages | Real SSC exam passages at reduced speed |
| 9 | Full Speed | Exam-ready: 35 WPM target with timer |
| 10 | Mastery | 40+ WPM, blind mode, backspace-lock challenges |

### Leaderboards
- Global, State, District, City, College, and Friends leaderboards
- XP-based ranking with level progression
- All-India comparison

### Gamification
- XP points, levels, achievements
- Daily challenges, typing races, tournaments
- Stationery/hand-drawn theme with wobbly borders and wobble animations

---

## Exam Modes

| Mode | Duration | Target | Description |
|------|----------|--------|-------------|
| **SSC CHSL** | 10 min | 35 WPM | Exact SSC CHSL typing simulation |
| **SSC CGL DEST** | 15 min | ~2000 KD | SSC CGL Data Entry Skill Test |
| **SSC Hindi** | 10 min | 30 WPM | Full Unicode Hindi (Mangal/Inscript) |
| **Practice** | Variable | — | Learning-focused with real-time feedback |
| **Blind Mode** | Variable | — | Errors hidden during test, revealed at end |
| **Mock Test** | 10 min | 35 WPM | Full exam environment with proctoring |
| **TCS iON Replica** | 10 min | 35 WPM | Exact replica of TCS iON interface |

---

## Tech Stack

### Frontend
| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | TailwindCSS + Shadcn UI |
| State | Zustand |
| Server State | TanStack Query |
| 3D Graphics | React Three Fiber 8.x (`@react-three/fiber@8.5.0`, `@react-three/drei@9.122.0`, `three@0.160.0`) |
| Animations | Framer Motion |
| Auth | Custom JWT + httpOnly refresh cookies |

### Backend
| Layer | Technology |
|-------|-----------|
| Framework | FastAPI (Python 3.11+) |
| ORM | SQLAlchemy 2.0 (async) |
| Validation | Pydantic v2 |
| Auth | PyJWT (HS256) |
| Password Hashing | bcrypt (rounds=12) |
| Security Store | Redis + in-memory fallback |
| Cache | Redis cluster + in-memory LRU (500 entries) |
| Message Queue | Apache Kafka |
| AI/ML | LangGraph, Voyage AI |
| Task Queue | Celery + Redis broker |

### Infrastructure
| Layer | Technology |
|-------|-----------|
| Database | PostgreSQL 16 + pgvector |
| Container Runtime | Docker + Docker Compose |
| Orchestration | Kubernetes |
| Monitoring | Prometheus + Grafana |
| CDN | Cloudflare CDN + WAF |
| Reverse Proxy | NGINX |

---

## Quick Start

```bash
# Clone repository
git clone https://github.com/mathsmania/platform.git
cd typing

# Start development environment
docker-compose up -d

# Backend at http://localhost:8000
# Frontend at http://localhost:3000
```

## Manual Setup

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your settings
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local
# Edit .env.local with your settings
npm run dev
```

### Database

```bash
# Using Docker for PostgreSQL + Redis
docker run -d --name postgres -e POSTGRES_PASSWORD=password -p 5432:5432 postgres:16
docker run -d --name redis -p 6379:6379 redis:7-alpine

# Run migrations
cd backend
alembic upgrade head
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Cloudflare CDN + WAF                 │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│                    NGINX Reverse Proxy                    │
│              (Rate limiting, SSL termination)             │
└────────┬─────────────────────────────────────┬───────────┘
         │                                     │
┌────────▼────────┐                  ┌────────▼────────┐
│   Frontend       │                  │   Backend API   │
│   Next.js 15     │◄────────────────►   FastAPI       │
│   Port 3000      │  REST + Cookies  │   Port 8000     │
└────────┬────────┘                  └────────┬────────┘
         │                                    │
         │                                    │
┌────────▼────────────────────────────────────▼────────┐
│                  Redis Cluster                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │
│  │ Session   │  │ Cache    │  │ Rate Limit +     │   │
│  │ Store     │  │ Layer    │  │ Security Store   │   │
│  └──────────┘  └──────────┘  └──────────────────┘   │
└──────────────────────┬───────────────────────────────┘
                       │
┌──────────────────────▼───────────────────────────────┐
│              PostgreSQL 16 + pgvector                 │
│  ┌────────────────────────────────────────────────┐  │
│  │  users | typing_tests | keystroke_events       │  │
│  │  passages | user_analytics | payments          │  │
│  │  + pgvector HNSW index for semantic search     │  │
│  └────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
```

### Request Flow

```
Browser → Cloudflare → NGINX → Next.js (SSR/CSR)
                                    │
                              API call via
                            Next.js rewrites
                                    │
                              FastAPI Backend
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
               Middleware      Security Store    Database
               (CSRF, Rate     (Token verify,    (SQLAlchemy
                Limit, CORS,    Rate check)       2.0 async)
                Correlation,
                Security Hdrs)
                    │               │               │
                    └───────────────┼───────────────┘
                                    │
                              Response JSON
```

### Auth Flow (Refresh Token Rotation)

```
1. POST /auth/login
   ├─ Validate email + password (bcrypt-12)
   ├─ Check account lockout (5 failures → 30 min)
   ├─ Check password expiry (90 days)
   ├─ Issue access_token (JWT, 15 min, with jti + IP binding)
   └─ Set httpOnly cookie: refresh_token (single-use, 7 days)

2. Access token expires → API returns 401
   ├─ Frontend ApiClient.request() catches 401
   ├─ POST /auth/refresh (cookie sent automatically)
   │  ├─ Consume old refresh_token (atomic delete)
   │  ├─ Issue new access_token + new refresh_token
   │  └─ Retry original request with new token
   └─ If refresh fails → redirect to login

3. POST /auth/logout
   ├─ Blacklist access JTI (prevents replay)
   ├─ Consume refresh_token
   └─ Clear cookie

4. POST /auth/logout-all
   └─ Revoke ALL refresh tokens for user (Redis SCAN + delete)

5. PUT /auth/password
   ├─ Verify old password
   ├─ Validate strength (16+ chars, 4 classes, 80-bit entropy)
   ├─ Check history (reject last 5)
   ├─ Revoke all existing refresh tokens
   └─ Issue new tokens
```

---

## Security Architecture

Maths Mania implements **defense-in-depth** across 13 layers:

### 1. Transport Security
```
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```
- HSTS preload (2-year max-age)
- All cookies: `Secure`, `HttpOnly`, `SameSite=Strict`
- CORS restricted to `["http://localhost:3000", "https://mathsmania.com"]`
- Content-Security-Policy: restricted `connect-src`, `font-src`, `script-src`

### 2. Request Validation
- Body size limit: 1MB (413 on exceed)
- Content-type enforcement: rejects non-JSON/form-data on mutating endpoints
- Input sanitization: trims, truncates to 1000 chars, strips `<>'"` HTML/script injection
- Passage content sanitization: strips HTML/control chars, `javascript:/data:` prefixes, 10k char truncation

### 3. Rate Limiting
| Endpoint Group | Limit | Lockout |
|----------------|-------|---------|
| `/api/v1/auth/login` | 10 req / 60s per IP | 15 min |
| `/api/v1/auth/register` | 10 req / 60s per IP | 15 min |
| `/api/v1/auth/*` | 10 req / 60s per IP | 15 min |
| `/api/v1/*` (general) | 1000 req / 3600s per IP | — |

- IPs identified by SHA-256 hash (first 16 hex chars) — never stored raw
- Rate limit state backed by Redis with in-memory fallback
- `audit_api_abuse` log event on lockout trigger

### 4. Authentication (JWT)
- **Algorithm**: HS256 with 64+ char secret (validated at startup)
- **Expiry**: 15 minutes (short-lived)
- **Claims**: `sub`, `exp`, `iat`, `jti` (32-char hex, `secrets.token_hex(16)`), `type: "access"`, `token_version: 3`, `ip` (hashed), `ua` (hashed), `iss`
- **IP binding**: Token `ip` claim must match request IP hash (mismatch → 401)
- **Minimum lifespan check**: Rejects tokens with `exp - iat < 60s` (anti-manipulation)
- **JTI blacklist**: Revoked tokens stored in Redis as `bl:{jti}` with TTL matching expiry
- **Issuer validation**: `iss` claim must match `JWT_ISSUER`

### 5. Refresh Token Rotation
- **Generation**: `secrets.token_urlsafe(48)` → 64-char URL-safe token
- **Storage**: SHA-256 hash only — never stored raw. Key: `rt:{hash}` → `user_id`
- **TTL**: 7 days
- **Consumption**: Atomically deleted via `consume_refresh_token()` — single-use
- **Leak protection**: A leaked refresh token cannot be replayed after the legitimate user refreshes (first consumption wins)
- **Cookie**: `HttpOnly`, `Secure`, `SameSite=Strict`, `Path=/api/v1/auth`

### 6. Password Policy
| Requirement | Value | Standard |
|-------------|-------|----------|
| Minimum length | 16 chars | OWASP 2023 |
| Maximum length | 128 chars | Prevents bcrypt DoS |
| Character classes | Upper + Lower + Digit + Special | OWASP |
| Repeated chars | Blocked (4+) | NIST SP 800-63 |
| Common patterns | Blocked | Custom blocklist |
| Entropy | ≥ 80 bits | NIST |
| History | Last 5 passwords | NIST |
| Expiry | 90 days | NIST |
| Hash rounds | bcrypt-12 (4096 rounds) | OWASP |

### 7. Account Lockout
- **Threshold**: 5 failed login attempts
- **Lockout duration**: 30 minutes
- **Failed login tracking**: Key `fal:{user_id}` with TTL = 30 min
- **Generic error message**: "Invalid email or password" (no user enumeration)
- **Locked response**: HTTP 423 with `Retry-After` header

### 8. CSRF Protection
- **Strategy**: Cookie-to-header comparison
- **Protected endpoints**: `/api/v1/auth/refresh`, `/api/v1/auth/logout` (mutating methods)
- **Skip condition**: Requests with `Authorization: Bearer` header skip CSRF (Bearer tokens are immune)
- **Validation**: `secrets.compare_digest()` — timing-safe comparison
- **Cookie**: Non-httpOnly `csrf_token` (Secure, SameSite=Strict) set on first auth POST

### 9. Authorization (RBAC)
| Role | Access |
|------|--------|
| `USER` | Own data, test submission, dashboard, leaderboard |
| `ADMIN` | User management (PII-masked), passage management |
| `SUPER_ADMIN` | Full admin access |

- Admin `list_users` PII masking: email returns as `abc***@domain.com`
- Role checking via `get_admin_user` dependency (403 for insufficient role)

### 10. Secrets Management
- `.env` files + environment variables for all secrets
- `JWT_SECRET` validated at startup (≥ 32 chars)
- Gitleaks pre-commit hook (v8.18.2) — blocks commits containing secrets
- Gitleaks CI job — fails pipeline on any secret leak
- `.gitleaks.toml` allowlist: excludes `node_modules`, `__pycache__`, lockfiles, etc.
- `detect-private-key` pre-commit hook

### 11. Resilience & Circuit Breakers

#### Redis Circuit Breaker (SecurityStore + CacheService)
```
Normal → (3 consecutive failures) → Open (60s) → (cooldown) → Half-Open → Normal
```
- **Threshold**: 3 consecutive Redis failures
- **Reset time**: 60 seconds
- **Degraded mode**: All operations fall back to in-memory dictionaries
- Used by: `SecurityStore` (rate limiting, token blacklist, refresh tokens) and `CacheService` (all cache operations)

#### Graceful Degradation
| Component | Redis Down Behavior |
|-----------|-------------------|
| Rate limiter | In-memory sliding window |
| Token blacklist | In-memory dict with approximate TTL |
| Refresh tokens | In-memory dict |
| Cache | In-memory LRU (500 entries) |
| Login tracking | In-memory counter |

### 12. Audit Logging
- **Login success/failure**: Logged with hashed IP and user agent
- **Password change**: Full audit event
- **API abuse**: Rate limit lockout triggers `audit_api_abuse`
- **PII redaction**: Emails and IPs are SHA-256 hashed (first 16 hex chars) in all logs
- **Correlation IDs**: Every request gets a UUID4 or forwards `X-Correlation-ID`

### 13. Supply Chain Security (CI/CD)
| Tool | What It Scans | Severity Threshold |
|------|---------------|-------------------|
| Gitleaks | Secrets in code | Any leak → fail |
| Checkov | IaC (Docker, K8s) | Skipped CKV_DOCKER_2/3/7 |
| pip-audit | Python dependencies | High+ → fail |
| npm audit | Node dependencies | High+ → fail |
| Trivy | Filesystem vulnerabilities | CRITICAL/HIGH → fail |
| Bandit | Python SAST | `-ll` severity |
| Cosign | Container image signing | Sigstore |

#### Pre-commit Hooks
```yaml
- gitleaks (v8.18.2)       # Secrets scanning
- trailing-whitespace       # Cleanup
- end-of-file-fixer         # Newline at EOF
- check-yaml                # YAML validation
- check-added-large-files   # Large file block
- detect-private-key        # Key detection
- check-merge-conflict      # Merge marker block
- bandit                    # Python SAST
```

### Kubernetes Security
```yaml
# PodSecurityContext
securityContext:
  runAsNonRoot: true
  seccompProfile:
    type: RuntimeDefault

# ContainerSecurityContext
securityContext:
  allowPrivilegeEscalation: false
  capabilities:
    drop: ["ALL"]
  readOnlyRootFilesystem: true

# NetworkPolicy: default-deny for all pods
```

---

## Testing

### Test Infrastructure

```
backend/tests/
├── __init__.py
├── test_auth.py              # Password policy, token generation, IP hashing
├── test_security_store.py    # Rate limiting, blacklist, refresh tokens, circuit breaker
├── test_failure_modes.py     # Redis outage, cache degradation, concurrent submissions
├── test_api_validation.py    # Pydantic schema validation, XSS rejection
└── load/
    ├── __init__.py
    ├── conftest.py           # Load test fixtures
    ├── test_benchmarks.py    # Baseline performance benchmarks
    ├── test_concurrent.py    # 100/1000/10000 concurrent user simulation
    └── test_stress.py        # Cache degradation, write contention
```

### Running Tests

```bash
cd backend

# Unit + integration tests
pytest -v

# With coverage
pytest --cov=app --cov-report=term-missing

# Load tests (requires running backend)
pytest -m loadtest -v

# Specific test file
pytest tests/test_auth.py -v
```

### Test Coverage

#### Auth Tests (`test_auth.py`) — 177 lines
| Test | Coverage |
|------|----------|
| `TestPasswordStrength` | Min 16 chars, 4 char classes, entropy ≥ 80 bits, rejects repeated/pattern passwords |
| `TestPasswordHistory` | Rejects last 5 passwords via bcrypt comparison |
| `TestPasswordExpiry` | None → expired, 91+ days → expired, 30 days → valid |
| `TestIPHashing` | Deterministic, 16-char output, not reversible, different IPs → different hashes |
| `TestUserAgentHashing` | Consistent 16-char output |
| `TestJTI` | Unique, 32-char hex, no collisions |
| `TestVerifyPasswordHash` | bcrypt correctness, wrong password, None/invalid hash handling |

#### Security Store Tests (`test_security_store.py`) — 144 lines
All tests run with Redis forced offline (local fallback mode):
| Test | Coverage |
|------|----------|
| `TestRateLimiting` | Local fallback blocks after limit, per-IP independence, reset clears counters |
| `TestTokenBlacklist` | Blacklist + check, expired entries auto-removed |
| `TestRefreshTokens` | Single-use consumption enforced, expired tokens rejected |
| `TestFailedLoginTracking` | Increment tracking, reset works |
| `TestCircuitBreaker` | Opens after 3 failures, closes after 60s cooldown |

#### Failure Mode Tests (`test_failure_modes.py`) — 115 lines
| Test | Coverage |
|------|----------|
| `TestRedisOutage` | Rate limit, token blacklist, refresh tokens all work in local mode |
| `TestCacheServiceOutage` | All cache methods return graceful defaults, never crash |
| `TestConcurrentSubmission` | `setnx`-based lock prevents double-counting |
| `TestAuthFailureModes` | Empty password, 15-char near-miss, expired/future password |

#### API Validation Tests (`test_api_validation.py`) — 105 lines
| Test | Coverage |
|------|----------|
| `TestUserCreateValidation` | Email format, name length, phone pattern (`+919876543210`) |
| `TestPassageCreateValidation` | Rejects HTML/XSS in content/title fields |
| `TestTestSubmissionValidation` | Negative time, null keystroke_events, invalid mode |
| `TestLoginEmailValidation` | Email stripped + lowered, schema valid |

#### Load Tests (`test_concurrent.py` + `test_stress.py`)
| Test | Scenario | Requirements |
|------|----------|-------------|
| `TestLoad100` | 100 concurrent users | Error < 5%, p95 < 5000ms |
| `TestLoad1000` | 1000 concurrent users | Error < 10%, p95 < 10000ms |
| `TestLoad10000` | 10000 concurrent users | Error < 20% |
| `TestCacheDegradation` | Cache returns None on Redis fail, set doesn't crash |
| `TestWriteContention` | 100 concurrent local cache writes, 500 concurrent rate limit checks |

---

## CI/CD Pipeline

### Pipeline Stages (sequential)

```
┌──────────────┐
│  Commit/Push │
└──────┬───────┘
       │
┌──────▼──────────────┐
│  1. Security Scan   │  ← Gitleaks, Checkov, pip-audit, npm audit, Trivy
└──────┬──────────────┘
       │
┌──────▼──────────────┐
│  2. Backend Tests   │  ← flake8, mypy, bandit (SARIF uploaded)
└──────┬──────────────┘
       │
┌──────▼──────────────┐
│  3. Frontend Tests  │  ← ESLint, TypeScript typecheck
└──────┬──────────────┘
       │
┌──────▼──────────────┐
│  4. Build & Push    │  ← Docker Buildx, Cosign signing → GHCR
└──────┬──────────────┘
       │
┌──────▼──────────────┐
│  5. Deploy          │  ← kubectl apply + set image + rollout wait
└─────────────────────┘
```

### Pipeline Details

**Security Scan** (fast-fail):
```yaml
- gitleaks detect --verbose -f saral
- checkov --directory . --skip CKV_DOCKER_2 CKV_DOCKER_3 CKV_DOCKER_7
- pip-audit
- npm audit
- trivy filesystem --severity CRITICAL,HIGH --exit-code 1
```

**Backend Tests**:
```yaml
- flake8 . --count --select=E,F,W,C --max-complexity=10 --max-line-length=120
- mypy app
- bandit -r app -f sarif -ll -o bandit-results.sarif
```

**Frontend Tests**:
```yaml
- npm run lint
- npm run typecheck
```

**Build & Push** (main only):
```yaml
- docker buildx build --cache-from=... --tag ghcr.io/... --push
- cosign sign ghcr.io/...@sha256:...
```

**Deploy** (main only):
```yaml
- kubectl apply -f infrastructure/k8s/security-context.yaml
- kubectl set image deployment/... ...
- kubectl rollout status deployment/...
```

---

## Database

### Schema Overview

```
users
├── id (UUID, PK)
├── email (unique, validated)
├── password_hash (bcrypt-12)
├── full_name
├── role (USER | ADMIN | SUPER_ADMIN)
├── xp, level
├── state, district, city, college
├── is_active, locked_until, failed_login_attempts
├── password_changed_at, password_history (JSON)
└── created_at, last_active

typing_tests
├── id (UUID, PK)
├── user_id (FK → users)
├── passage_id (FK → passages)
├── mode (chsl | cgl_dest | practice | ...)
├── status (in_progress | completed | submitted)
├── wpm (net), gross_wpm, accuracy, keystrokes
├── errors (JSON — full error breakdown)
├── passed (boolean)
├── started_at, completed_at
└── keystroke_events (JSON — full replay data)

keystroke_events
├── id (UUID, PK)
├── test_id (FK → typing_tests)
├── timestamp_ms (int)
├── event_type (keydown | keyup)
├── key, expected_char, typed_char
├── correct (boolean)
├── finger_zone, hand
└── metadata (JSON — shift, caps, etc.)

passages
├── id (UUID, PK)
├── title, content (sanitized)
├── category, difficulty, language
├── word_count, char_count
├── embedding (pgvector, 1536d)
├── is_active, times_used
└── created_at

user_analytics
├── id (UUID, PK)
├── user_id (FK → users)
├── total_tests, total_time_seconds
├── avg_wpm, best_wpm, avg_accuracy
├── xp_earned, level
└── updated_at
```

### Indexes

23 performance indexes including:
- `ix_typing_tests_user_status_completed` — test history queries
- `ix_passages_pick` — random passage selection
- `ix_passages_embedding` — pgvector HNSW index (`m=16, ef_construction=200`, `vector_cosine_ops`) for semantic search
- `ix_users_xp DESC` — leaderboard sorting
- `ix_users_state_xp`, `ix_users_district_xp` — geo-scoped leaderboards
- `ix_keystroke_events_test_timestamp` — replay playback

### Migrations

```
backend/app/migrations/versions/
├── 001_initial_schema.py
├── 002_performance_indexes.py    # All 23 indexes
└── 003_add_missing_user_columns.py
```

---

## Monitoring & Observability

### Metrics (`/metrics`)
- Prometheus metrics exposed at `/metrics`
- Custom metrics: test submissions, user registrations, error rates

### Grafana Dashboards
- Port 3001
- Real-time dashboards for API latency, error rates, DB connections

### Alerts
| Alert | Threshold |
|-------|-----------|
| CPU | > 80% |
| DB Latency | > 200ms |
| Error Rate | > 1% |
| Redis Down | Circuit breaker open |

### Audit Events
- `user_login_success` / `user_login_failure`
- `user_password_change`
- `user_refresh_token`
- `api_abuse_rate_limit`
- `test_submitted` / `test_failed`

### Correlation IDs
- Every request tagged with `X-Correlation-ID` (UUID4 or forwarded)
- Propagated through logs and error responses

---

## API Documentation

Full OpenAPI/Swagger spec at `/api/docs` when running.

### Key Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/v1/auth/register` | — | User registration |
| POST | `/api/v1/auth/login` | — | Login (sets refresh cookie) |
| POST | `/api/v1/auth/refresh` | Cookie | Refresh access token |
| POST | `/api/v1/auth/logout` | Bearer | Logout (blacklist JTI) |
| POST | `/api/v1/auth/logout-all` | Bearer | Revoke all refresh tokens |
| PUT | `/api/v1/auth/password` | Bearer | Change password |
| GET | `/api/v1/auth/me` | Bearer | Current user profile |
| POST | `/api/v1/tests/start` | Bearer | Start new test |
| POST | `/api/v1/tests/{id}/submit` | Bearer | Submit test (atomic lock) |
| POST | `/api/v1/tests/direct-submit` | Bearer | Create + submit in one call |
| GET | `/api/v1/tests/history` | Bearer | Test history (paginated) |
| GET | `/api/v1/passages` | Optional | Get passages |
| GET | `/api/v1/leaderboard` | Optional | Leaderboard (scoped) |
| GET | `/api/v1/dashboard` | Bearer | User dashboard |
| GET | `/api/v1/dashboard/analytics` | Bearer | Detailed analytics |
| POST | `/api/v1/subscriptions/create` | Bearer | Create subscription |
| GET | `/api/v1/health` | — | Health check |

---

## Deployment

### Docker Compose (Development)

```bash
docker-compose up -d
docker-compose logs -f    # Watch logs
docker-compose down       # Stop
```

### Kubernetes (Production)

```bash
kubectl apply -f infrastructure/k8s/
kubectl apply -f infrastructure/k8s/security-context.yaml
kubectl rollout status deployment/frontend
kubectl rollout status deployment/backend
```

### Environment Variables

See `backend/.env.example` and `frontend/.env.local.example` for full reference.

#### Key Backend Variables
| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `JWT_SECRET` | HMAC signing key (64+ chars) |
| `JWT_EXPIRY_MINUTES` | Access token TTL (default: 15) |
| `JWT_REFRESH_EXPIRY_DAYS` | Refresh token TTL (default: 7) |
| `CORS_ORIGINS` | Comma-separated allowed origins |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Supabase service role key |

#### Key Frontend Variables
| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |

---

## Performance

- **Response caching**: 60s–600s TTL depending on endpoint (dashboard: 180s, leaderboard: 120s, passages: 300s)
- **Two-tier cache**: Redis + in-memory LRU (500 entries, O(1) get)
- **Cache invalidation**: `SCAN` cursor-based (no blocking `KEYS *`)
- **Database**: 23 covering indexes, pgvector HNSW for semantic search
- **Frontend**: Next.js App Router with automatic code splitting, lazy-loaded 3D components

---

## Troubleshooting

### Common Issues

**"CORS error on API calls"**
→ Verify `CORS_ORIGINS` in backend `.env` includes your frontend URL
→ Check CSP `connect-src` in `next.config.js`

**"Redis connection refused"**
→ Verify Redis is running: `docker ps | grep redis`
→ Circuit breaker will auto-open after 3 failures → local fallback kicks in

**"401 on refresh"**
→ Verify `Path=/api/v1/auth` on refresh cookie (Next.js proxy must not strip the path)
→ Check that the access token is sent in `Authorization: Bearer` header

**"Build fails — Module not found: three"**
→ Ensure `@react-three/fiber@8.5.0` and `@react-three/drei@9.122.0` are installed
→ 3D components use `dynamic(() => import(...), { ssr: false })`

---

## Contributing

1. Install pre-commit hooks: `pre-commit install`
2. Run tests: `pytest -v` (backend) / `npm run typecheck` (frontend)
3. Ensure all security scans pass locally:
   ```bash
   gitleaks detect --source . -v
   bandit -r backend/app -ll
   pip-audit
   ```
4. Sign your commits
5. Submit PR to `develop` branch

---

## License

Proprietary — All rights reserved.

Not affiliated with SSC, TCS iON, or any government body. This is a practice platform for exam aspirants.
