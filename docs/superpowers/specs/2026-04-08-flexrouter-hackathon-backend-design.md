# FlexRouter AI — Hackathon Backend Design

**Date:** 2026-04-08
**Type:** Full refactor design
**Status:** Approved ✅

---

## 1. Overview

FlexRouter AI is an intelligent routing system for Flex-N-Roll PRO (B2B label manufacturer). The system automatically routes incoming client messages (from Bitrix24 via n8n) to the optimal manager based on KPI, availability, and client history.

**Problem:** 8,850 leads in CRM, only 23 converted. Managers are chosen manually, losing deals.

**Solution:** AI-powered routing via Ollama (qwen2.5:14b) + KPI-based manager selection + reactivation mailing system.

---

## 2. Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Bitrix24   │────▶│     n8n      │────▶│   NestJS API │
│  (cloud)     │◀────│  (local)     │◀────│  (apps/api)  │
└──────────────┘     └──────┬───────┘     └──────┬───────┘
                            │                    │
                            │              ┌─────▼──────┐
                            │              │  Supabase  │
                            │              │ PostgreSQL │
                            │              └─────┬──────┘
                            │                    │
                     ┌──────▼───────┐     ┌──────▼───────┐
                     │   Ollama     │     │   Prisma     │
                     │ qwen2.5:14b  │     │    ORM       │
                     └──────────────┘     └──────────────┘
```

---

## 3. What Changes

### Remove (old mock-based modules)
- `apps/api/src/applications/` — not in hackathon scope
- `apps/api/src/metrics/` — replaced by analytics
- `apps/api/src/pipeline/` — replaced by routing
- `apps/api/src/escalations/` — not in scope
- `apps/api/src/auth/` — replaced by API-key guard
- `apps/api/src/profile/` — not needed
- `apps/api/src/core/` — mock store removed

### Keep
- `apps/api/src/analytics/` — refactored for real Supabase data
- `apps/api/src/health/` — health check endpoint
- `apps/api/src/common/` — shared guards, pipes, interceptors
- `apps/api/src/config/` — environment validation

### Add (new hackathon modules)
- `apps/api/src/modules/employees/` — Manager CRUD, availability, personal manager lookup
- `apps/api/src/modules/routing/` — AI message routing via Ollama
- `apps/api/src/modules/kpi/` — KPI calculation, history, daily recalculation
- `apps/api/src/modules/mailing/` — Reactivation email campaigns
- `apps/api/src/modules/bitrix/` — Bitrix24 REST API wrapper
- `apps/api/src/modules/ollama/` — Ollama LLM HTTP client
- `apps/api/src/modules/sync/` — Leads sync from Bitrix24
- `apps/api/src/prisma/` — Prisma module for database access

---

## 4. Database Schema (Prisma)

See AGENTS.md section 4 for full schema. Key tables:
- **Employee** — 23 employees from employees.json
- **Assignment** — Client-manager relationship history
- **KpiHistory** — Daily KPI snapshots
- **LeadCache** — Synced leads from Bitrix24
- **Mailing** — Sent mailing campaigns
- **IncomingEvent** — Deduplication log

---

## 5. API Endpoints

### Employees
- `GET /api/employees/available` — Available managers sorted by KPI
- `PATCH /api/employees/:id/availability` — Update manager availability
- `GET /api/employees/:id/kpi` — Manager KPI + 30-day history

### Routing
- `POST /api/routing/route` — Main routing endpoint (n8n calls this)
- `POST /api/routing/transfer` — Transfer dialog to another manager

### KPI
- `GET /api/kpi` — Current KPI of all employees
- `POST /api/kpi/recalculate` — Force KPI recalculation

### Mailing
- `GET /api/mailing/candidates` — Leads for reactivation mailing
- `POST /api/mailing/send` — Send mailing to candidates
- `GET /api/mailing/stats` — Mailing statistics

### Analytics
- `GET /api/analytics/funnel` — Conversion funnel
- `GET /api/analytics/rejections` — Top rejection reasons
- `GET /api/analytics/managers` — Manager summary
- `GET /api/analytics/mailing` — Mailing stats

### Sync
- `POST /api/sync/leads` — Sync leads from Bitrix24

---

## 6. Testing Strategy

Per AGENTS.md: **tests FIRST** for every module.

```
For each module:
1. Unit tests (service logic, edge cases)
2. Integration tests (real Prisma + mocked external services)
3. E2E tests (Supertest with full app)
```

**Mock strategy:**
- BitrixService → mocked HTTP responses
- OllamaService → mocked LLM responses
- PrismaService → unit test mocks, real DB for integration/e2e

**Coverage target:** >80% for services

---

## 7. Implementation Phases

### Phase 0: Scaffolding
- Prisma schema + seed script
- PrismaModule + PrismaService
- BitrixService (HTTP wrapper with retry logic)
- OllamaService (HTTP client for qwen2.5)
- API-key guard + decorator
- Environment variables update

### Phase 1: Employees Module
- Unit tests → Integration tests → E2E tests → Implementation
- CRUD + availability + personal manager lookup

### Phase 2: Routing Module (MVP)
- Unit tests → Integration tests → E2E tests → Implementation
- LLM routing with fallback to first-by-KPI
- Auto-reply when no managers available

### Phase 3: KPI Module
- Unit tests → Implementation
- KPI formula: conversion (60%) + response speed (20%) + volume (20%)
- Daily recalculation + cron

### Phase 4: Mailing Module
- Unit tests → Implementation
- Candidate selection + LLM email generation + SMTP send
- Daily cron at 09:00

### Phase 5: Analytics Module
- Refactor existing for real Supabase data
- Funnel, rejections, managers, mailing stats

### Phase 6: Sync + Integration
- Leads sync from Bitrix24
- Final testing + bug fixes

---

## 8. Key Business Rules

### Manager Selection Priority
1. **Personal manager** — if interactionCount >= 2 AND available
2. **LLM routing** — qwen2.5:14b-instruct analyzes message + picks manager
3. **Fallback** — first by KPI if LLM fails

### KPI Formula
```
KPI = conversionScore (60%) + responseScore (20%) + volumeScore (20%)
conversionScore = (won / total) * 60
responseScore = max(0, 20 * (1 - log(avgResponseMin / 5) / log(300)))
volumeScore = min(20, (total / 100) * 20)
```

### Auto-reply (no managers available)
LLM generates polite message: "All specialists busy, will respond by tomorrow 10:00 AM"

---

## 9. Risks & Mitigation

| Risk | Mitigation |
|------|-----------|
| Ollama timeout/unavailable | Graceful fallback to first-by-KPI manager |
| Bitrix24 rate limit (2 req/sec) | Retry logic with 500ms delay between calls |
| Swagger circular dependency | Exclude express types, add explicit @ApiResponse schemas |
| Prisma migration issues | Use `apply_migration` for DDL operations |
| Test DB not available | Mock PrismaService for unit tests |

---

**Design approved by user.** Implementation proceeds phase by phase.
