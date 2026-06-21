# Maths Mania API Specification

## Base URL

Production: `https://api.mathsmania.com/api/v1`
Development: `http://localhost:8000/api/v1`

## Authentication

All endpoints except `/auth/*` require a Bearer JWT token.

```
Authorization: Bearer <token>
```

## Endpoints

### Authentication

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | Login user |
| GET | `/auth/me` | Get current user |

### Users

| Method | Path | Description |
|--------|------|-------------|
| GET | `/users/profile` | Get user profile |
| PUT | `/users/profile` | Update user profile |
| GET | `/users/stats` | Get user statistics |

### Passages

| Method | Path | Description |
|--------|------|-------------|
| GET | `/passages` | List passages (filterable) |
| GET | `/passages/random` | Get random passage |
| GET | `/passages/{id}` | Get passage by ID |
| POST | `/passages` | Create passage (admin) |

### Tests

| Method | Path | Description |
|--------|------|-------------|
| POST | `/tests/start` | Start a new typing test |
| POST | `/tests/{id}/submit` | Submit completed test |
| GET | `/tests/history` | Get test history |
| GET | `/tests/{id}` | Get test result |
| GET | `/tests/{id}/replay` | Get keystroke replay data |

### Analytics

| Method | Path | Description |
|--------|------|-------------|
| GET | `/analytics/overview` | Get analytics overview |
| GET | `/analytics/predictions` | Get qualification predictions |
| GET | `/analytics/recent-scores` | Get recent test scores |

### Leaderboard

| Method | Path | Description |
|--------|------|-------------|
| GET | `/leaderboard` | Get leaderboard (scoped) |

### AI Coach

| Method | Path | Description |
|--------|------|-------------|
| GET | `/coach/feedback/{test_id}` | Get AI feedback for test |
| GET | `/coach/weak-words` | Get user weak words |
| POST | `/coach/practice-passage` | Generate practice passage |
| GET | `/coach/replay/{test_id}` | Get typing replay |

### Subscription

| Method | Path | Description |
|--------|------|-------------|
| POST | `/subscription/create-order` | Create payment order |
| POST | `/subscription/verify` | Verify payment |
| GET | `/subscription/status` | Get subscription status |
| GET | `/subscription/payments` | Get payment history |

### Admin

| Method | Path | Description |
|--------|------|-------------|
| GET | `/admin/dashboard` | Admin dashboard stats |
| GET | `/admin/users` | List all users |
| GET | `/admin/analytics/summary` | Analytics summary |

## Request/Response Examples

### Start Test

```json
POST /tests/start
{
  "mode": "ssc_chsl",
  "passage_id": "uuid-here",
  "duration_seconds": 600
}

Response:
{
  "test_id": "uuid",
  "passage": {
    "id": "uuid",
    "title": "Sample Passage",
    "content": "The government has announced...",
    "language": "english",
    "word_count": 350,
    "exact_key_depressions": 1800
  },
  "mode": "ssc_chsl",
  "duration_seconds": 600,
  "started_at": "2026-06-21T10:00:00Z"
}
```

### Submit Test

```json
POST /tests/{test_id}/submit
{
  "typed_content": "The goverment has announced...",
  "keystroke_events": [
    {"key": "T", "timestamp_ms": 100, "duration_ms": 80, "is_error": false, "is_backspace": false},
    {"key": "h", "timestamp_ms": 200, "duration_ms": 60, "is_error": false, "is_backspace": false}
  ],
  "time_taken_seconds": 587.5
}

Response:
{
  "test_id": "uuid",
  "mode": "ssc_chsl",
  "gross_wpm": 38.5,
  "net_wpm": 36.2,
  "accuracy": 96.8,
  "error_percentage": 3.2,
  "key_depression_count": 1750,
  "total_errors": 12,
  "omission_errors": 2,
  "addition_errors": 1,
  "wrong_word_errors": 3,
  "substitution_errors": 4,
  "formatting_errors": 0,
  "space_errors": 2,
  "time_taken_seconds": 587.5,
  "time_utilization_percentage": 94.2,
  "backspace_count": 5,
  "pause_count": 3,
  "total_pause_duration_seconds": 8.2,
  "typing_rhythm_score": 85.3,
  "consistency_score": 78.9,
  "is_qualified": true,
  "qualification_probability": 93.0,
  "xp_earned": 45,
  "weak_words": ["government", "administration"],
  "feedback": "Good speed! Focus on suffix patterns like -tion and -ment."
}
```

## Error Response Format

```json
{
  "detail": "Error message describing what went wrong"
}
```

## HTTP Status Codes

- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 422: Validation Error
- 429: Rate Limit Exceeded
- 500: Internal Server Error

## Rate Limiting

- Free tier: 100 requests/minute
- Premium tier: 1000 requests/minute
- Admin tier: 5000 requests/minute
