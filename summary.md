## Goal
- Fix passage formatting to follow standard typing test conventions, fix dashboard not showing recent tests, build interactive 3D keyboard lessons on the Learn page, persist all test results in a central repo (localStorage + API) displayed under Dashboard "Recent Tests", fix double navbar across all pages, add 3D mouse component for Level 0 mouse lessons, add stationery-themed mobile hamburger menu, and fix persistent login (add frontend refresh token rotation).

## Constraints & Preferences
- All hardcoded strings remain in `lib/config.ts`.
- Supabase cloud project for persistence (not local Docker Postgres).
- Backend runs in Docker, connects via Supavisor session pooler (IPv4).
- Frontend talks to Supabase for passages, FastAPI for auth + test evaluation.
- Hand-drawn "stationery" theme (wobbly borders, Patrick Hand / Kalam fonts).
- 3D keyboard/mouse uses React Three Fiber with React 18 (not React 19); `@react-three/fiber@8.5.0` + `@react-three/drei@9.122.0` + `three@0.160.0`.

## Progress
### Done
- **Frontend Docker read-only filesystem fix**: removed `/app/.next/server` tmpfs mount (was masking built server files). Added individual tmpfs for `/app/.next/cache`, `/app/.next/trace`, `/home/nextjs/.npm`. Set `HOME=/home/nextjs` in Dockerfile. Removed duplicate timer interval in `typing-exam.tsx`.
- **Monkeytype-style typing UI**: created `TypingDisplay` component with character-by-character word rendering, color-coded feedback (green=correct, red=incorrect, gray=untyped), blinking caret, progress bar, live WPM/accuracy/timer stats header, auto-scroll, submit button. Uses `useTypingEngine` hook for global keyboard capture (no textarea). TCS iON replica mode preserved with side-by-side passage+textarea layout.
- **CSP fix**: `connect-src` was missing → blocked all cross-origin fetch/API/Supabase calls. Added `'self' http://localhost:8000 https://awfqpmgshuicrfiwyvhy.supabase.co ws://localhost:8000`. Added `font-src 'self' https://fonts.gstatic.com` for Google Fonts. Removed `block-all-mixed-content` / `upgrade-insecure-requests` (incompatible with http://localhost:8000 API calls).
- **Proxy rewrite fix**: Next.js `rewrites()` evaluated API_URL at build time (not runtime). Hardcoded destination to `http://backend:8000/api/v1/:path*` (Docker service name). Removed legacy `serverRuntimeConfig` / `publicRuntimeConfig`.
- **Supabase env vars at build time**: fixed `.dockerignore` excluding `.env.local`. Added `build.args` in `docker-compose.yml` and `ARG` declarations in `Dockerfile`.
- **404 page**: created `app/not-found.tsx` with stationery-themed layout.
- **CSRF protection**: `CSRFProtectMiddleware` validates `X-CSRF-Token` header against non-httpOnly `csrf_token` cookie for sensitive POST endpoints when no `Authorization: Bearer` header present.
- **Admin PII masking**: `admin.py list_users` returns `email[:3] + "***@" + domain`.
- **Rate limiting on all public endpoints**: general API 100 req/60s per IP; auth 10 req/60s + 15-min lockout.
- **Passage content sanitization**: strips HTML/control chars, `javascript:/data:` prefixes, truncates at 10k chars. `_format_content()` auto-detects Title Case → sentence case.
- **PII redaction in audit logs**: SHA-256 hashes of email and IP (first 16 hex chars).
- **Kubernetes security context**: PodSecurityContext (non-root, seccomp), ContainerSecurityContext (drop ALL caps, RO filesystem), NetworkPolicy default-deny.
- **Redis circuit breaker**: 3 failures → 60s open circuit (both `SecurityStore` and `CacheService`).
- **Cookie SameSite=strict**: all cookies use strict same-site.
- **Atomic test submit lock**: `cache.setnx()` instead of non-atomic `get`+`set`.
- **Auth hardening**: Redis-backed token revocation, refresh token rotation, httpOnly cookies, logout-all, multi-device revocation.
- **CI/CD security**: Gitleaks, Checkov, pip/npm audit, Trivy (CRITICAL/HIGH only), Bandit, Cosign, pre-commit hooks.
- **JWT**: 64-char secret, 2h expiry, `jti` + `type` claims mandatory.
- **Passage formatting fix**: 4 word-list passages rewritten as proper sentences. Supabase migration applied.
- **Dashboard recent tests fix**: `initTest()` waits for auth loading, `startTest()` retries once, added `POST /api/v1/tests/direct-submit` endpoint, `loadUser()` refreshes XP after submission.
- **3D Keyboard**: Full QWERTY 3D keyboard (React Three Fiber 8.x) with finger-zone coloring, keypress animation, orbit controls, next-key highlighting, home row glow. `Keyboard3D` (dynamic import, SSR disabled), `KeyboardScene` (Three.js scene), `keyboard-layout.ts` (key definitions).
- **Lesson exam page**: `app/exam/lesson/[id]/page.tsx` dynamic route, `LessonExam` component with countdown, typing display, 3D keyboard/mouse, pass/fail result.
- **Learn page wiring**: "Start Lesson" button routes to `/exam/lesson/${lesson.id}`.
- **AuthInitializer SSR fix**: `providers.tsx` `AuthInitializer` no longer blocks `{children}` rendering (removed `initialized` state guard that always returned `<LoadingLogo />` during SSR). Now renders `{children}` immediately, calls `loadUser()` in effect.
- **Single navbar per page**: Removed duplicate `<Navbar />` from all page files (`learn`, `about`, `contact`, `privacy`, `terms`, `leaderboard`, `dashboard`, `dashboard/analytics`, `coach`). Only `layout.tsx` renders the navbar. Also removed stale `LoadingLogo`/`useState` imports from cleaned-up files.
- **Central test repo (localStorage)**: Created `lib/test-storage.ts` with `saveTestResult()`, `getRecentTestResults()` — all 3 submission paths in `typing-exam.tsx` (API submit, direct-submit, client-side fallback) + `lesson-exam.tsx` save results to localStorage under key `typing_test_results`. Dashboard `page.tsx` merges API + localStorage results sorted by date.
- **3D Mouse for Level 0**: `components/learn/mouse-3d.tsx` — 3D mouse model (body, left/right buttons, scroll wheel) with yellow highlighting on click/scroll key events, body depression animation, orbit controls. Auto-shown when lesson `keys` contain `'click'` or `'scroll'`.
- **Dynamic 3D component import**: `Keyboard3D` and `Mouse3D` imported via `dynamic(() => import(...), { ssr: false })` to prevent Three.js module loading errors from crashing the page.
- **Mobile hamburger menu (stationery theme)**: Rewrote `components/layout/navbar.tsx` — hamburger button (visible `<md`), fixed overlay (`bg-paper/95 backdrop-blur-sm`), body scroll locked, nav links as card with wobble borders, user section with avatar/name/level/XP. Matches hand-drawn theme.
- **Frontend refresh token rotation**: Added `refreshToken()` method to `ApiClient` — calls `POST /auth/refresh` with expired access token in `Authorization` header (bypasses CSRF) + `credentials: 'include'` (sends httpOnly refresh cookie). Auto-retry logic in `request()`: when a 401 is received and a token exists, refreshes once and retries the original request. Dedup via `refreshing` Promise to prevent concurrent refresh storms. All existing API methods (`getMe`, `startTest`, `submitTest`, etc.) automatically benefit from auto-refresh. `loadUser()` in auth store no longer needs changes — `api.getMe()` transparently handles expired tokens.

### In Progress
- (none)

### Blocked
- (none)

## Key Decisions
- Refresh tokens stored as SHA-256 hash + single-use rotation — leaked refresh token cannot be replayed after consumption.
- In-memory fallback for `SecurityStore` when Redis unavailable — prevents hard failure during development.
- Access tokens remain in `Authorization: Bearer` header (not httpOnly cookie) — SPA needs `Authorization` header for API calls; XSS mitigation via CSP + short token expiry + revocation capability.
- CSRF protection only enforced on cookie-based refresh/logout endpoints (where `Authorization: Bearer` absent) — Bearer tokens are immune to CSRF.
- Refresh token rotation in frontend: send the (possibly expired) access token in `Authorization: Bearer` when calling `/auth/refresh` to bypass CSRF middleware while the httpOnly refresh cookie authenticates the request. Dedup via instance-level Promise to prevent concurrent refresh calls.
- `NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1` for client-side direct API calls; rewrite hardcoded to `http://backend:8000/api/v1` (Docker service name) to avoid build-time vs runtime env var conflict.
- CI/CD scans block on CRITICAL/HIGH with `exit-code: 1`.
- 3D keyboard/mouse uses React Three Fiber 8.x (not 9.x) to stay on React 18; older `@react-three/drei@9.122.0` for compatibility.
- All test results saved to `localStorage` key `typing_test_results` — merged with API results in dashboard.
- `AuthInitializer` must never block `{children}` rendering during SSR.
- `Keyboard3D`/`Mouse3D` dynamically imported with `ssr: false`.
- ESM import of `bcrypt` in passlib triggers harmless version-detection warnings in backend logs (`AttributeError: module 'bcrypt' has no attribute '__about__'`) — does not affect bcrypt hashing.

## Next Steps
1. Rotate all production secrets (JWT_SECRET, DB password, Redis password) to fresh values.
2. Penetration-test the CSRF + refresh token rotation flow end-to-end.
3. Implement dependency lockfiles (`requirements.txt` → `requirements-lock.txt` with hashes for supply-chain attacks).
4. Deploy hardened k8s manifests by merging to `main`.

## Critical Context
- **Frontend** running on `http://localhost:3000` (Docker). All 9 exam pages return 200. Lesson pages render with "Start Lesson" + instruction card + 3D keyboard/mouse. All pages have exactly 1 `<nav>` (from `layout.tsx` Navbar). Mobile hamburger menu uses stationery-themed overlay with wobble borders and scroll lock.
- **Backend** on `http://localhost:8000` (Docker). `GET /api/v1/health` returns 200. Refresh token rotation verified end-to-end (login → cookie → refresh → new token → `/auth/me` with new token).
- **CSP**: `connect-src 'self' http://localhost:8000 https://awfqpmgshuicrfiwyvhy.supabase.co ws://localhost:8000`.
- **Auth flow**: `POST /auth/login` returns access token + sets `refresh_token` (httpOnly/Secure/Strict, path=/api/v1/auth) + `csrf_token` (non-httpOnly/Secure/Strict). `POST /auth/refresh` with `Authorization: Bearer <any_token>` bypasses CSRF; httpOnly refresh cookie authenticates the request. Refresh token rotation consumes old cookie+Redis entry, issues new one. Access tokens expire in 2h. Frontend `ApiClient.request()` auto-calls refresh on 401 and retries once before clearing token.
- **Dashboard recent tests**: Merges API results + localStorage results (`typing_test_results`) sorted by date, deduplicated by ID prefix (`local_` vs UUID).
- **Test submission**: `POST /tests/{id}/submit` uses `cache.setnx()` atomic lock. `POST /tests/direct-submit` creates + submits in one call. All 3 submission paths call `saveTestResult()`.
- **Rate limiter**: auth 10 req/60s + 15min lockout; general API 100 req/60s per IP. Redis-backed with in-memory fallback.
- **Redis circuit breaker**: 3 consecutive failures → 60s open circuit (both `SecurityStore` and `CacheService`). Login and refresh token operations fall back to in-memory dictionaries when Redis is unavailable.
- **Supabase**: cloud project `awfqpmgshuicrfiwyvhy.supabase.co`, passages table with 37 records, reachable from Docker. Passage formatting migration applied.
- **3D Keyboard**: Full QWERTY (~50 keys), 8 finger-zone colors, keypress animation (Y depression), orbit controls, home row glow, next-key highlight. `@react-three/drei` `RoundedBox` + `Text` + `OrbitControls`.
- **3D Mouse**: Body with left/right button highlighting (yellow `#ffd43b`) on `left-click`/`right-click`/`scroll` events, depression animation, orbit controls. Auto-shown for Level 0 mouse lessons.
- **bcrypt version warning**: Backend logs show `AttributeError: module 'bcrypt' has no attribute '__about__'` from passlib's version detection — harmless, does not affect bcrypt hashing.

## Relevant Files
- `frontend/lib/api.ts`: `ApiClient` — `refreshToken()` method with dedup, `request()` auto-refreshes on 401 and retries once. `credentials: 'include'` on all fetches for cookie-based refresh.
- `frontend/lib/test-storage.ts`: localStorage persistence module — `saveTestResult()`, `getRecentTestResults()`, `clearTestResults()`.
- `frontend/components/learn/mouse-3d.tsx`: 3D Mouse component (body, L/R buttons, scroll wheel, click highlights, orbit controls).
- `frontend/components/layout/navbar.tsx`: Rewritten — mobile hamburger menu with stationery-themed overlay, desktop nav unchanged, wobble borders, body scroll lock, user avatar.
- `frontend/app/providers.tsx`: `AuthInitializer` no longer blocks children — always renders `{children}`, calls `loadUser()` in effect.
- `frontend/components/exam/lesson-exam.tsx`: `Keyboard3D` + `Mouse3D` dynamically imported (`ssr: false`), conditionally renders mouse for click/scroll keys, saves result to localStorage.
- `frontend/components/exam/typing-exam.tsx`: All 3 submission paths call `saveTestResult()`.
- `frontend/app/dashboard/page.tsx`: Merges API + localStorage results sorted by date.
- `frontend/store/auth-store.ts`: `loadUser()` — `api.getMe()` now auto-refreshes expired tokens internally.
- `frontend/components/learn/keyboard-layout.ts`: key definitions, 8 finger zones with colors, home row keys.
- `frontend/components/learn/keyboard-3d.tsx`: 3D keyboard wrapper (dynamic SSR-disabled import), real-time key event capture.
- `frontend/components/learn/keyboard-scene.tsx`: Three.js scene — `RoundedBox` keys, `Text` labels, `OrbitControls`, lights, fog.
- `frontend/lib/typing-curriculum.ts`: 11 levels with 36 lessons.
- `backend/app/api/v1/auth.py`: `POST /auth/refresh` — reads httpOnly cookie, validates against Redis (SHA-256 hash), rotates on success. Requires `Authorization: Bearer` to skip CSRF, or `X-CSRF-Token` if no Bearer.
- `backend/app/core/middleware.py`: `CSRFProtectMiddleware` skips CSRF check when `Authorization: Bearer` header is present; `RateLimitMiddleware` (general 100 req/60s); `SecurityHeadersMiddleware`; `CorrelationIDMiddleware`; `RequestValidationMiddleware`.
- `backend/app/core/security.py`: `SecurityStore` with Redis circuit breaker, `hash_token()` (SHA-256), `generate_refresh_token()` (token_urlsafe(48)).
- `backend/app/config.py`: `JWT_EXPIRY_HOURS: int = 2`, `JWT_REFRESH_EXPIRY_DAYS: int = 7`, `REDIS_URL: str = "redis://localhost:6379/0"`.
- `backend/app/main.py`: CORS configured with `allow_credentials=True`, `allow_origins=["http://localhost:3000", "https://mathsmania.com"]`.
