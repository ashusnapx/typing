# Operations Guide

## Database Backup & Recovery

### Automated Backups (PostgreSQL via Supabase)
Supabase provides daily automated backups with 7-day retention. For self-hosted:

```bash
# Daily backup via pg_dump
pg_dump -h localhost -U postgres -d mathsmania \
  --no-owner --no-acl \
  -F c -f /backups/mathsmania_$(date +%Y%m%d).dump

# Restore
pg_restore -h localhost -U postgres -d mathsmania \
  --clean --if-exists \
  /backups/mathsmania_20260622.dump
```

### Point-in-Time Recovery
Requires WAL archiving enabled:
```sql
ALTER SYSTEM SET wal_level = 'replica';
ALTER SYSTEM SET archive_mode = 'on';
ALTER SYSTEM SET archive_command = 'cp %p /backups/wal/%f';
SELECT pg_create_restore_point('pre_deploy_v2.1');
```

## Rollback Procedures

### Database Rollback
```bash
# Revert last migration
alembic downgrade -1

# Or revert all performance indexes
python -m app.migrations.versions.002_performance_indexes downgrade
```

### Application Rollback
```bash
# Docker rollback
docker-compose down
docker-compose -f docker-compose.previous.yml up -d

# Or tag-based rollback
docker pull ghcr.io/org/mathsmania-backend:previous-stable
docker tag ghcr.io/org/mathsmania-backend:previous-stable mathsmania-backend:latest
docker-compose up -d backend
```

### Cache Invalidation
After rollback, flush stale cache:
```bash
redis-cli FLUSHDB  # clears all cached responses
```

## Disaster Recovery

### Recovery Time Objective (RTO): 1 hour
### Recovery Point Objective (RPO): 5 minutes

### Failure Scenarios

| Scenario | Detection | Recovery | RTO |
|----------|-----------|----------|-----|
| Database failure | Health check fails | Failover to read replica, rebuild from latest backup | 15 min |
| Redis failure | Circuit breaker opens | Local mode (degraded, all caches miss) | 0 min (automatic) |
| Application crash | Container restart | Docker auto-restart policy | 30 sec |
| Region failure | DNS health check | DNS failover to standby region | 30 min |

### Redis Cluster Setup (for HA)
```bash
# Primary with replica
redis-server --port 6379 --replicaof redis-replica 6379

# Sentinel for automatic failover
redis-sentinel /etc/redis/sentinel.conf
```

### Database Connection Pool Sizing
```python
# Current: pool_size=20, max_overflow=40
# Formula: pool_size = (connections_per_core * cpu_count) + headroom
# For 4-core server: (10 * 4) + 20 = 60
# For 8-core server: (10 * 8) + 40 = 120
```

## Monitoring & Alerting

### Prometheus Metrics (port 9090)
- `http_requests_total{method, endpoint, status}` — request count
- `http_request_duration_seconds{method, endpoint}` — latency histogram
- `active_users` — currently authenticated users
- `active_tests` — in-progress typing tests
- `db_pool_size` — current connection pool usage
- `db_pool_overflow` — overflow connections
- `cache_hit_ratio` — response cache hit rate

### Critical Alerts
| Condition | Severity | Action |
|-----------|----------|--------|
| p95 latency > 2s for 5 min | Critical | Scale out, investigate slow query |
| Error rate > 5% for 5 min | Critical | Rollback last deploy |
| DB pool exhaustion | Critical | Increase pool, reduce connection leaks |
| Redis circuit breaker open | Warning | Restart Redis, check network |
| Disk usage > 80% | Warning | Clean old backups, increase volume |

### Health Check Endpoints
- `GET /api/v1/health` — full health check (DB + Redis probe)
- `GET /api/v1/ready` — readiness probe (DB only)
- `GET /api/v1/live` — liveness probe (always 200)

### Grafana Dashboard
Import `ops/grafana-dashboard.json` for pre-built dashboard:
- Request rate, latency, error rate (R.E.D. method)
- Pool utilization
- Cache hit ratio
- Top slow queries (via pg_stat_statements)

## Capacity Planning

### Current Limits
| Resource | Limit | Saturation at | Action |
|----------|-------|---------------|--------|
| DB connections | 60 (pool 20 + overflow 40) | 10,000 concurrent users | Increase pool, add PgBouncer |
| Redis memory | 256 MB | 500k cached responses | Increase maxmemory, add replica |
| API throughput | ~500 req/s per instance | 5,000 concurrent users | Horizontal scaling |
| WebSocket (typing sessions) | 1,000 per instance | 2,000 concurrent exams | Add instance, session affinity |

### Scaling Strategy
1. **Vertical**: Increase backend instance CPU/memory (up to 8 vCPU / 16 GB)
2. **Horizontal**: Add backend instances behind nginx/haproxy
3. **Database**: Add read replica for `/leaderboard`, `/dashboard`, `/analytics`
4. **Cache**: Redis Cluster with 3 primary + 3 replica nodes

### SLO Targets
| Metric | Target | Error Budget (monthly) |
|--------|--------|----------------------|
| API availability | 99.9% | 43 min downtime |
| p95 latency | < 500ms | — |
| p99 latency | < 2s | — |
| Dashboard load time | < 1s | — |
| Test submission | < 3s | — |
