# FlexRouter AI

> AI-powered lead routing system for Flex-N-Roll PRO — a B2B label manufacturing company (Minsk + Moscow).

[![Tests](https://img.shields.io/badge/tests-344%20passing%20%7C%206%20failing-yellow)]()
[![NestJS](https://img.shields.io/badge/NestJS-10.4-e01563)]()
[![Prisma](https://img.shields.io/badge/Prisma-5.22-2d3748)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178c6)]()
[![n8n OAuth](https://img.shields.io/badge/n8n%20OAuth-auto--refresh-green)]()

---

## 📋 Problem

Flex-N-Roll PRO had **8,850 leads** in their Bitrix24 CRM but only **23 were converted** into deals. Incoming messages from Telegram, WhatsApp, and email were manually assigned to managers, causing delays, lost clients, and VIP customers being handled by interns.

## 💡 Solution

**FlexRouter AI** automatically routes incoming client messages to the optimal manager using:
1. **Personal manager lookup** — if a client has ≥ 2 prior interactions with a manager.
2. **LLM-based routing** — locally hosted `qwen2.5:14b` analyzes the message, identifies the requested product type (e.g., complex vs. clean label), urgency, and picks the best specialist.
3. **Fallback & Graceful Degradation** — highest-KPI manager when LLM is unavailable.

Beyond Routing, the platform features:
- **Bitrix24 Real-time Dashboard:** A React+Vite built iframe application embedded directly into Bitrix24 main menu. Visualizes 30-day KPI sparklines, live active dialogs, tasks, and conversion funnels.
- **Smart Reactivation (Mailing):** Identifies inactive leads, generates personalized reactivation emails using LLM, and dispatches them via `nodemailer`.
- **Daily KPI Recalculation:** Aggregates won/lost deals and response times directly from the CRM to continuously adjust manager ratings.

---

## 🏗 Architecture (3 Nodes)

```
┌─────────────────────┐     ┌─────────────────────────────────────────────────────┐
│  Bitrix24 (cloud)   │────▶│  VPS: dashboard.kurumi.software                     │
│  Telegram/WhatsApp  │     │  Nginx Reverse Proxy + SSL + Tailscale + React UI   │
└─────────────────────┘     └────────────┬────────────────────────────────────────┘
                                         │ Tailscale (Secure Tunnel)
                            ┌────────────┴─────────────┐
                            │  Node 2: MacBook M4       │
                            │  n8n (:5678) Workflow App │
                            │  qwen2.5:14b-instruct     │
                            └────────────┬─────────────┘
                                         │ Tailscale
                                         ↓
                            ┌──────────────────────────┐
                            │  Node 3: Core Server      │
                            │  NestJS API (:3001)       │
                            │  Supabase PostgreSQL DB   │
                            │                           │
                            │  /api/dashboard           │
                            │  /api/employees           │
                            │  /api/routing             │
                            │  /api/kpi                 │
                            │  /api/mailing             │
                            │  /api/bitrix              │
                            └──────────────────────────┘
```

### Traffic Flow & High-Load Architecture

1. **Client** writes to Telegram → Bitrix24 Open Line.
2. **Bitrix24** fires `ONOPENLINEMESSAGEADD` → webhook to n8n via Tailwind IP.
3. **n8n** makes API calls (`GET /api/employees/available`, `POST /api/routing/route`) to the NestJS Gateway.
4. **qwen2.5:14b** returns structured JSON `{ managerId, topic, urgency }`.
5. **n8n** executes Bitrix24 APIs: `imopenlines.session.transfer`, `crm.lead.add` keeping managers fully within their CRM ecosystem.
6. The **React Dashboard UI** consistently polls `/api/dashboard/summary` providing managers with real-time updates and analytics. Heavy concurrency events (like loading 23 KPI-sparklines at once) are load-managed on the Backend natively with the DB session pool, allowing the dashboard UI to stay responsive over thousands of concurrent CRM inquiries.

---

## 🚀 Quick Start & Full Run Guide

> **Important for Jury / Reviewers:** 
> For a comprehensive step-by-step guide on how to launch the complete 3-node system (n8n, Ollama, API, and Dashboard) for an end-to-end demonstration, please see the [**START_GUIDE.md**](./START_GUIDE.md) document.

### Local Development Prerequisites

- Node.js 20+ / 25+
- pnpm 10+
- PostgreSQL (Supabase recommended)

### 1. Install & Run API

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
npx dotenv-cli -e .env.local -- pnpm run dev
```

API: http://localhost:3001
Swagger docs: http://localhost:3001/api/docs (disabled — circular deps in legacy DTOs)

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
| `OLLAMA_BASE_URL` | Ollama API URL (via Tailscale) | `http://YOUR_TAILSCALE_IP:11434` |
| `OLLAMA_ROUTING_MODEL` | LLM model name | `qwen2.5:14b-instruct` |
| `OLLAMA_TIMEOUT_MS` | Ollama request timeout (ms) | `15000` |
| `SMTP_HOST` / `SMTP_PORT` | Email server for mailings | `smtp.gmail.com` / `587` |
| `SMTP_USER` / `SMTP_PASS` | Email credentials | `noreply@example.com` / `app-password` |
| `SMTP_FROM` | From address for mailings | `FlexRouter <noreply@example.com>` |
| `API_SECRET_KEY` | Key protecting endpoints from n8n | `generate-a-strong-random-key` |
| `N8N_BASE_URL` | n8n URL (via Tailscale) | `http://YOUR_TAILSCALE_IP:5678` |

### 3. Run Tests

```bash
cd apps/api
pnpm test          # 344 unit tests
pnpm test:cov      # with coverage
```

---

## 📦 API Endpoints

### Dashboard (Bitrix24 Real-time Embedded App)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET`  | `/api/dashboard/summary` | Aggregated dashboard stats (dialogs, tasks, mailing, funnel, rejection) |
| `GET`  | `/api/bitrix/open-sessions`| Live open Bitrix CRM conversation proxies |
| `GET`  | `/api/bitrix/tasks`      | Manager specific active tasks |
| `POST` | `/api/bitrix/tasks`      | Create new CRM tasks directly via Nest API |

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
| Unit | 348 | `cd apps/api && pnpm test` |
| Test Suites | 32 | `cd apps/api && pnpm test` |

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
