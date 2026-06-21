# Maths Mania - India's Most Accurate SSC Typing Exam Simulator

[![CI/CD](https://github.com/mathsmania/platform/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/mathsmania/platform/actions)

## Overview

Maths Mania replicates actual SSC examination conditions with near-identical experience to the TCS iON exam environment used by SSC. Built for India's largest education ecosystem with 2M+ students.

### Primary USP

- **Exact SSC Evaluation Logic** - Levenshtein Distance, Character-Level Diff, Word-Level Mapping
- **TCS iON Exam Replica** - Same layout, fonts, timer placement, and instructions
- **AI-Powered Typing Coach** - Personalized feedback after every test
- **Enterprise-Grade** - 99.99% uptime, Kubernetes, horizontal scaling

## Quick Start

```bash
# Clone repository
git clone https://github.com/mathsmania/platform.git
cd typing

# Start development environment
docker-compose up -d

# Backend will be at http://localhost:8000
# Frontend will be at http://localhost:3000
```

## Manual Setup

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```

## Exam Modes

| Mode | Duration | Target | Description |
|------|----------|--------|-------------|
| SSC CHSL | 10 min | 35 WPM | Exact SSC CHSL simulation |
| SSC CGL DEST | 15 min | ~2000 KD | SSC CGL Data Entry Skill Test |
| SSC Hindi | 10 min | 30 WPM | Unicode Hindi typing |
| Practice | Variable | - | Learning-focused |
| Blind Mode | Variable | - | Advanced practice |
| Mock Test | 10 min | 35 WPM | Real exam environment |
| TCS iON Replica | 10 min | 35 WPM | Exact TCS iON replica |

## SSC Official Rules

### SSC CHSL Typing Test
- English: 35 WPM | Hindi: 30 WPM
- Duration: 10 Minutes
- Nature: Qualifying
- Evaluation: Speed + Accuracy (95%+)

### SSC CGL DEST
- Duration: 15 Minutes
- Passage: ~2000 key depressions
- Nature: Qualifying

## Error Evaluation Engine

Uses SSC Error Engine v1 with:
- **Levenshtein Distance** for edit distance calculation
- **Character-Level Diff** for exact error classification
- **Word-Level Mapping** for contextual error analysis

Error types: Omission, Addition, Wrong Word, Substitution, Formatting, Space

## Features

### SSC Error Engine v1
- Levenshtein Distance, Character-Level Diff, Word-Level Mapping
- Not naive word matching - handles partial matches, transpositions
- Auditable and explainable results

### Keystroke Intelligence
- Every keystroke analyzed
- Heatmaps, error zones, typing rhythm graphs
- Left/Right hand, Shift key, Number row error tracking

### AI Typing Coach
- Personalized feedback after every test
- Identifies fatigue patterns
- Generates daily drills and weak-word exercises
- Predicts improvement trajectory

### Qualification Prediction
- Predicts SSC CHSL/CGL qualification probability
- Based on last 20 tests with trend analysis
- 93%+ confidence with sufficient data

### Typing Replay
- Like Chess.com game review
- Replay every keystroke, correction, and pause
- Speed controls and mistake highlights

### Smart Practice Generator
- Automatic passage generation focused on weak words
- Adaptive difficulty based on performance

## Tech Stack

### Frontend
- Next.js 15, TypeScript, TailwindCSS, Shadcn UI
- TanStack Query, Zustand, Framer Motion

### Backend
- FastAPI, SQLAlchemy, Pydantic
- Redis Cluster, Apache Kafka
- LangGraph, Voyage AI

### Infrastructure
- PostgreSQL 16 + pgvector
- Kubernetes, Docker
- Prometheus + Grafana
- Cloudflare CDN + WAF

## Deployment

### Kubernetes

```bash
kubectl apply -f infrastructure/k8s/
```

### Environment Variables

See `backend/.env.example` and `frontend/.env.local.example`

## API Documentation

Full API spec at `/api/docs` when running, or see `docs/api-specification.md`.

## Monitoring

- Prometheus metrics at `/metrics`
- Grafana dashboards at port 3001
- Alerts configured for:
  - CPU > 80%
  - DB latency > 200ms
  - Error rate > 1%

## License

Proprietary - All rights reserved.
