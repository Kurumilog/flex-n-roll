# FlexRouter AI

> AI-powered lead routing system for Flex-N-Roll PRO — a B2B label manufacturing company (Minsk + Moscow).

[![Tests](https://img.shields.io/badge/tests-274%20passed-brightgreen)]()
[![NestJS](https://img.shields.io/badge/NestJS-10.4-e01563)]()
[![Prisma](https://img.shields.io/badge/Prisma-5.22-2d3748)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178c6)]()

---

## 📋 Problem

Flex-N-Roll PRO had **8,850 leads** in their Bitrix24 CRM but only **23 were converted** into deals. Incoming messages from Telegram, WhatsApp, and email were manually assigned to managers, causing delays, lost clients, and VIP customers being handled by interns.

## 💡 Solution

**FlexRouter AI** automatically routes incoming client messages to the optimal manager using:
1. **Personal manager lookup** — if a client has ≥ 2 prior interactions with a manager
2. **LLM-based routing** — qwen2.5:14b analyzes the message and picks the best specialist
3. **Fallback** — highest-KPI manager when LLM is unavailable

Plus: daily KPI recalculation, reactivation email campaigns, and a full analytics dashboard.

---

## 🏗 Architecture (3 Nodes)

```
┌─────────────────────┐     ┌──────────────────────────┐
│  Bitrix24 (cloud)   │────▶│  VPS: kurumi.software     │
│  Telegram/WhatsApp  │     │  Nginx + SSL + Tailscale  │
└─────────────────────┘     └────────────┬─────────────┘
                                         │ Tailscale
                            ┌────────────┴─────────────┐
                            │  Node 2: MacBook M4       │
                            │  n8n (:5678) + Ollama     │
                            │  qwen2.5:14b-instruct     │
                            └────────────┬─────────────┘
                                         │ Tailscale
                                         ↓
                            ┌──────────────────────────┐
                            │  Node 3: Your Server      │
                            │  NestJS API (:3000)       │
                            │  Supabase (PostgreSQL)    │
                            │                           │
                            │  /api/employees           │
                            │  /api/routing             │
                            │  /api/kpi                 │
                            │  /api/mailing             │
                            │  /api/analytics           │
                            │  /api/sync                │
                            └──────────────────────────┘
```

### Traffic Flow

1. **Client** writes to Telegram → Bitrix24 Open Line
2. **Bitrix24** fires `ONOPENLINEMESSAGEADD` → webhook to `https://n8n.kurumi.software`
3. **VPS** forwards via Tailscale → **n8n** on MacBook M4
4. **n8n** calls `GET /api/employees/available` (Tailscale → NestJS)
5. **n8n** calls `POST /api/routing/route` → NestJS returns `{ managerId, topic, urgency }`
6. **n8n** calls Bitrix24 API: `imopenlines.session.transfer`, `crm.lead.add`, `tasks.task.add`
7. **Manager** sees the dialog in Bitrix24 and responds directly

---

## 🚀 Quick Start

### Prerequisites

- Node.js 20+ / 25+
- pnpm 10+
- PostgreSQL (Supabase recommended)

### 1. Install & Run

```bash
pnpm install
cd apps/api

# Generate Prisma Client
pnpm prisma:generate

# Apply database migrations
pnpm prisma:migrate

# Seed 23 employees from CRM data
pnpm prisma:seed

# Start development server
pnpm dev
```

API: http://localhost:3000
Swagger docs: http://localhost:3000/api/docs

### 2. Configure Environment

Copy `.env.example` to `.env.local` and fill in:

```bash
cp apps/api/.env.example apps/api/.env.local
```

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | Supabase PostgreSQL connection string | `postgresql://postgres.xxx:...@aws-0-xx.pooler.supabase.com:6543/postgres` |
| `BITRIX24_WEBHOOK_URL` | Bitrix24 REST API webhook | `https://your-portal.bitrix24.ru/rest/1/CODE/` |
| `BITRIX24_INCOMING_SECRET` | Secret for validating incoming events | `your-secret` |
| `OLLAMA_BASE_URL` | Ollama API URL (via Tailscale) | `http://100.x.x.x:11434` |
| `OLLAMA_ROUTING_MODEL` | LLM model name | `qwen2.5:14b-instruct` |
| `OLLAMA_TIMEOUT_MS` | Ollama request timeout (ms) | `15000` |
| `SMTP_HOST` / `SMTP_PORT` | Email server for mailings | `smtp.gmail.com` / `587` |
| `SMTP_USER` / `SMTP_PASS` | Email credentials | `noreply@example.com` / `app-password` |
| `SMTP_FROM` | From address for mailings | `FlexRouter <noreply@example.com>` |
| `API_SECRET_KEY` | Key protecting endpoints from n8n | `generate-a-strong-random-key` |
| `N8N_BASE_URL` | n8n URL (via Tailscale) | `http://100.x.x.x:5678` |

### 3. Run Tests

```bash
cd apps/api
pnpm test          # 274 unit tests
pnpm test:cov      # with coverage
```

---

## 📦 API Endpoints

### Employees

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/employees/available` | Available managers sorted by KPI |
| `PATCH` | `/api/employees/:id/availability` | Update manager availability |
| `GET` | `/api/employees/:id/kpi` | Manager KPI + 30-day history |

### Routing (MVP)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/routing/route` | Route a client message to optimal manager |

### KPI

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/kpi` | Current KPI of all employees |
| `POST` | `/api/kpi/recalculate` | Force KPI recalculation from Bitrix24 |
| `GET` | `/api/kpi/:id` | Employee KPI + history |

### Mailing

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/mailing/candidates` | Leads eligible for reactivation mailing |
| `POST` | `/api/mailing/send` | Send mailing to selected leads |
| `GET` | `/api/mailing/stats` | Mailing statistics (30 days) |

### Analytics

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/analytics/funnel` | Lead conversion funnel by status |
| `GET` | `/api/analytics/rejections` | Top rejection reasons |
| `GET` | `/api/analytics/managers` | Manager summary table |
| `GET` | `/api/analytics/mailing` | Mailing performance stats |

### Sync

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/sync/leads` | Sync leads from Bitrix24 → cache |
| `GET` | `/api/sync/cache-stats` | Lead cache statistics |

---

## 🧪 Tests

| Type | Count | Command |
|------|-------|---------|
| Unit | 274 | `pnpm --filter api test` |
| Test Suites | 27 | `pnpm --filter api test` |

**Convention:** Tests FIRST (unit → integration → e2e), >80% coverage target.

---

## 🗄 Database Schema

| Table | Description |
|-------|-------------|
| `employees` | 23 managers with KPI, availability, working hours |
| `assignments` | Client→manager relationship history (for "personal manager" logic) |
| `kpi_history` | Daily KPI snapshots (30 days) |
| `leads_cache` | Cached leads from Bitrix24 (synced hourly) |
| `mailings` | Mailing campaign records |
| `incoming_events` | Event deduplication log |

---

## 🛠 Tech Stack

| Component | Technology |
|-----------|------------|
| Framework | NestJS 10.4 |
| ORM | Prisma 5.22 |
| Database | Supabase (PostgreSQL 17) |
| LLM | Ollama qwen2.5:14b-instruct |
| HTTP Client | Axios |
| Email | Nodemailer |
| Validation | class-validator + class-transformer |
| Testing | Jest + ts-jest |
| Docs | Swagger (OpenAPI) |
| Package Manager | pnpm |

---

## 📂 Project Structure

```
Flexnroll/
├── apps/api/
│   ├── src/
│   │   ├── modules/
│   │   │   ├── employees/    # Manager availability, personal manager lookup
│   │   │   ├── routing/      # AI message routing (personal → LLM → fallback)
│   │   │   ├── kpi/          # KPI formula, history, daily recalculation
│   │   │   ├── mailing/      # Reactivation email campaigns
│   │   │   ├── analytics/    # Funnel, rejections, manager/mailing stats
│   │   │   ├── sync/         # Bitrix24 lead synchronization
│   │   │   ├── bitrix/       # Bitrix24 REST API wrapper
│   │   │   └── ollama/       # Ollama HTTP client (chat + embeddings)
│   │   ├── prisma/           # Prisma module (global)
│   │   ├── health/           # Health check
│   │   ├── common/           # Guards, pipes, decorators
│   │   ├── config/           # ConfigModule + env validation
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   └── test/
├── FNR_PRO_Hackathon/data/   # CRM data (employees, leads, deals, dialogs)
├── docs/superpowers/         # Design docs and implementation plans
├── AGENTS.md                 # Full hackathon specification
└── hackathon_plan.md         # Detailed implementation timeline
```

---

## 🔐 Security

- All protected endpoints require `x-api-key` header
- Environment variables validated at startup
- Database credentials in `.env.local` (never committed)
- `FNR_PRO_Hackathon/` contains CRM data — handle with care
- `pnpm-lock.yaml` and `.gitignore` exclude secrets

---

## 📖 Documentation

- **[AGENTS.md](AGENTS.md)** — Complete hackathon specification (architecture, API, tests, business logic)
- **[hackathon_plan.md](hackathon_plan.md)** — Detailed implementation plan with timelines
- **[PROJECT_STATUS.md](PROJECT_STATUS.md)** — Current project status and architecture
- **[preSTRUCTURE.md](preSTRUCTURE.md)** — Project structure and env variables
- **[QWEN.md](QWEN.md)** — AI memory (known issues, progress)
- **Swagger** — http://localhost:3000/api/docs (when running)

---

## 📊 KPI Formula

```
KPI = conversionScore (60%) + responseScore (20%) + volumeScore (20%)

conversionScore  = (dealsWon / totalDeals) × 60
responseScore    = max(0, 20 × (1 - log(avgResponseMin / 5) / log(300)))
volumeScore      = min(20, (totalDeals / 100) × 20)
```

No deals → KPI = 50 (neutral default).

---

## 👥 Team

| Role | Responsibility |
|------|---------------|
| Backend + Automation | NestJS, Supabase, n8n workflows via MCP, analytics |
| Bitrix24 | Portal setup, Open Lines, data import, local app |
| Design | Figma → iframe dashboard in Bitrix24 |

---

## 📝 License

Private repository — Flex-N-Roll PRO Hackathon.
