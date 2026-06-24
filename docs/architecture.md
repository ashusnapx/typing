# Maths Mania - System Architecture

## Overview

Enterprise-grade SSC Typing Exam Simulator serving 2M+ students with 99.99% uptime target.

## Architecture Diagram

```
Users
  ↓
Cloudflare CDN + WAF
  ↓
Global Load Balancer
  ↓
Kubernetes Cluster
  ├── Next.js Pods (Frontend, tRPC API & Server Functions)
  ├── Redis Cluster (Cache + Sessions)
  ├── PostgreSQL Primary + Read Replicas
  ├── Apache Kafka (Event Streaming)
  └── Analytics Workers + AI Coach Service
```

## Data Flow

### Typing Test Flow

1. User starts test → tRPC Mutation `trpcClient.tests.startTest`
2. Passage loaded into browser memory
3. Keystrokes captured in browser (NOT sent to DB)
4. Redis stores active session data
5. On submit → tRPC Mutation `trpcClient.tests.submitTest`
6. Next.js server-side error engine evaluates:
   - Levenshtein Distance analysis
   - Character-level diff
   - Word-level mapping
7. Results saved to PostgreSQL
8. AI Coach generates feedback
9. Kafka triggers async analytics

### Keystroke Data Flow

```
During Test:
  Browser Memory (primary)
  ↓
  Redis (backup, TTL = test duration)

After Test:
  Summarized analytics → PostgreSQL
  Raw keystrokes → KeystrokeEvent table (for replay)
  Behavioral patterns → UserAnalytics table
```

## Database Architecture

### PostgreSQL Schema

Tables: `users`, `passages`, `typing_tests`, `keystroke_events`, `error_patterns`, `typing_sessions`, `user_analytics`, `subscriptions`, `payments`

- Primary DB: Writes
- Read Replicas: Analytics, Leaderboards, History
- Daily backups with point-in-time recovery
- pgvector extension for passage embeddings

### Redis Usage

- Active test sessions (TTL = test duration)
- Live leaderboards
- Rate limiting counters
- Real-time WPM/accuracy for active tests
- Session cache

## Scalability Strategy

### Horizontal Scaling

- Frontend: Auto-scale 3-20 pods based on CPU/memory
- Backend: Auto-scale 5-50 pods based on CPU/memory
- Read Replicas: Scale based on query load
- Redis Cluster: Shard across nodes

### Traffic Handling

- 50,000 concurrent users
- 250,000 writes/sec (keystrokes → Redis)
- 50 test submissions/sec → PostgreSQL
- CDN absorbs static asset traffic

## Monitoring

### Prometheus Metrics

- HTTP request rate, latency, error rate
- Active users and tests
- Database query performance
- Redis memory and hit rate
- Kafka consumer lag

### Grafana Dashboards

- Real-time system monitoring
- User activity trends
- Error rate tracking
- Infrastructure health

### Alerts

- CPU > 80% for 5 minutes
- DB latency > 200ms
- Error rate > 1%
- Redis/Kafka down

## Security

- JWT authentication with RBAC
- TLS everywhere (Cloudflare + Ingress)
- Encryption at rest (PostgreSQL + R2)
- DDoS protection (Cloudflare)
- Rate limiting per user/IP
- Audit logging for admin actions

## Disaster Recovery

### Backup Strategy

- PostgreSQL: Daily full backup, WAL archiving
- Redis: AOF persistence, periodic snapshots
- R2: Cross-region replication

### Recovery

- Point-in-time recovery for PostgreSQL
- Redis cluster auto-failover
- Kubernetes pod auto-recovery
- Blue-green deployments for zero-downtime updates

## Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | Next.js 15, TypeScript, TailwindCSS |
| Backend | FastAPI, Python 3.12 |
| Database | PostgreSQL 16 + pgvector |
| Cache | Redis Cluster 7 |
| Search | OpenSearch |
| Queue | Apache Kafka |
| AI | LangGraph + Voyage AI |
| Storage | Cloudflare R2 |
| Auth | Custom JWT / Clerk |
| CDN | Cloudflare |
| Container | Docker |
| Orchestration | Kubernetes |
| Monitoring | Prometheus + Grafana + OpenTelemetry |
| CI/CD | GitHub Actions |
