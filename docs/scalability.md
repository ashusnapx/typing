# Scalability Documentation

## Current Capacity

- 2,000,000+ registered users
- 500,000 monthly active users
- 100,000 daily active users
- 50,000 concurrent users during peak

## Architecture Decisions

### Why not write every keystroke to PostgreSQL?

Typing test generates data every second.

50,000 users × 5 keypress/sec = 250,000 writes/sec

PostgreSQL cannot handle this volume.

**Solution:**
- During test: Browser Memory + Redis (not PostgreSQL)
- After test: Only summarized data to PostgreSQL

### Why Redis is mandatory

- Active sessions with TTL
- Live leaderboards (real-time ranking)
- Current test tracking
- Rate limiting counters
- Temporary keystroke buffer

### Why Cloudflare CDN

- DDoS protection absorbs traffic spikes
- Edge caching reduces origin load
- Global acceleration for users across India
- WAF protects against attacks

### Why Kubernetes

Auto-scaling based on load:
- 5k users → 5 servers
- 20k users → 20 servers
- 50k users → 50 servers

### Database Scaling

- **Primary**: All writes
- **Read Replicas**: 2+ replicas for analytics/leaderboard queries
- **Connection Pooling**: 50-100 connections per instance
- **Query Optimization**: Indexed columns, materialized views for leaderboards

## Horizontal Scaling Strategy

### Frontend (Next.js)
- Stateless - scale horizontally
- CDN cache static assets
- Server-side rendering with caching

### Backend (FastAPI)
- Stateless - scale horizontally
- Sessions in Redis (not in-memory)
- Async handlers for non-blocking I/O

### Redis
- Cluster mode with sharding
- Key prefix based sharding: `session:*`, `leaderboard:*`, `ratelimit:*`

### PostgreSQL
- Read replicas for analytics queries
- Leaderboard caching in Redis (refreshed every 60s)
- Archival of old test data

## Disaster Recovery

### Database Backup
- Daily full backup at 2 AM IST
- WAL archiving for point-in-time recovery
- 30-day retention
- Cross-region backup storage

### Failover
- PostgreSQL: Automatic primary failover with Patroni
- Redis: Cluster auto-failover
- Kubernetes: Pod auto-recovery, node failure handling

### Recovery Time Objective (RTO)
- Database: < 15 minutes
- Application: < 5 minutes
- Full recovery: < 1 hour

### Recovery Point Objective (RPO)
- Database: < 1 minute (WAL)
- Redis: < 5 seconds (AOF)

## Cost Projections at Scale

### Monthly Infrastructure (50k concurrent)
| Component | Cost |
|-----------|------|
| Kubernetes (50 pods) | $2,000 |
| PostgreSQL (primary + 2 replicas) | $1,500 |
| Redis Cluster (6 nodes) | $900 |
| Cloudflare Enterprise | $200 |
| Kafka (3 brokers) | $600 |
| Monitoring | $300 |
| R2 Storage | $100 |
| **Total** | **~$5,600** |

## Performance Targets

- P95 API response time: < 200ms
- Typing test submission: < 500ms
- Leaderboard load: < 100ms
- AI Coach feedback: < 2s
- Page load (CDN cached): < 1s
- Database query (indexed): < 50ms

## Load Testing

Recommended tools: k6, Locust

Test scenarios:
1. Concurrent test starts: 1000/s
2. Keystroke events to Redis: 250,000/s
3. Test submissions: 50/s
4. Leaderboard queries: 500/s
5. AI Coach feedback: 10/s
