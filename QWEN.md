## Qwen Added Memories
### Project: FlexRouter AI (Hackathon Backend)
- Full refactor of NestJS backend for B2B label manufacturer routing system
- **Stack:** NestJS 10, Prisma, Supabase (PostgreSQL), Ollama (qwen2.5:14b), Bitrix24 API
- **Goal:** Auto-route incoming Bitrix24 messages to optimal manager by KPI/history/availability
- **Tests:** Tests FIRST convention (unit → integration → e2e), >80% coverage target
- **Data:** 23 employees, 200 leads, 20 deals, 30 dialog examples (FNR_PRO_Hackathon/data/)

### Physical Architecture (3 nodes)
- **Node 1 — MacBook M4 (друг):** n8n local (:5678) + Ollama (qwen2.5:14b-instruct, OLLAMA_NUM_PARALLEL=4). Доступ через Tailscale (100.x.x.x).
- **Node 2 — VPS kurumi.software:** Nginx + SSL + Tailscale. Форвардит HTTPS webhook'и от Bitrix24 на MacBook друга.
- **Node 3 — Твой сервер:** NestJS API (:3000) + Supabase (cloud PostgreSQL). Обращается к n8n/Ollama по Tailscale IP напрямую.
- **Bitrix24 (облако):** hackathon-team-xx.bitrix24.ru. Open Lines (Telegram/WhatsApp/Email). Webhook на https://n8n.kurumi.software.

### Flow: Bitrix24 → NestJS
1. Client пишет в Telegram → Bitrix24 Open Line
2. Bitrix24 → ONOPENLINEMESSAGEADD → webhook на https://n8n.kurumi.software
3. VPS → Tailscale → n8n на MacBook друга
4. n8n HTTP GET → /api/employees/available (Tailscale → твой NestJS)
5. n8n HTTP POST → /api/routing/route (NestJS: personal → LLM → fallback)
6. n8n HTTP POST → Bitrix24 API (imopenlines.session.transfer, crm.lead.add, tasks.task.add)
7. Менеджер видит диалог в Bitrix24 и отвечает

### KNOWN BUGS
- (Нет известных багов — все исправлены в аудите 2026-04-08)

### Bug Fixes Applied (2026-04-08 Audit)
1. ✅ **Ollama embed endpoint**: `/api/embed` → `/api/embeddings` (correct endpoint per Ollama docs)
   - Response format: `embedding` (singular) not `embeddings` (array)
   - File: `ollama.service.ts`
2. ✅ **ApiKeyGuard**: Replaced broken `@nestjs/passport` approach with standalone `CanActivate` guard
   - Old: `extends AuthGuard('api-key')` — required missing Passport strategy
   - New: Direct `implements CanActivate` with `x-api-key` header check
   - File: `common/guards/api-key.guard.ts`
3. ✅ **Supabase migration applied**: All 6 tables created via MCP
   - `employees`, `assignments`, `kpi_history`, `leads_cache`, `mailings`, `incoming_events`
   - pgvector extension enabled for future embeddings
   - RLS enabled on all tables (default Supabase behavior)
4. ✅ **Context7 verification**: All patterns verified against latest docs
   - NestJS Guards, Prisma upsert/transactions, Ollama API all confirmed current

### Implementation Progress (2026-04-08)
- ✅ Design doc written: `docs/superpowers/specs/2026-04-08-flexrouter-hackathon-backend-design.md`
- ✅ User approved full refactor approach
- ✅ Phase 0: Scaffolding COMPLETE
  - ✅ Prisma schema (Employee, Assignment, KpiHistory, LeadCache, Mailing, IncomingEvent)
  - ✅ PrismaModule + PrismaService (with onModuleInit/onModuleDestroy)
  - ✅ BitrixService (HTTP wrapper with retry logic for rate limits)
  - ✅ OllamaService (HTTP client for qwen2.5:14b, with embed support)
  - ✅ API-key guard + decorator (RequireApiKey)
  - ✅ Environment validation (DATABASE_URL, OLLAMA_*, SMTP_*, BITRIX24_*, API_SECRET_KEY)
  - ✅ Seed script (prisma/seed.ts — loads 23 employees from employees.json)
  - ✅ package.json updated (axios, nodemailer, @nestjs/passport)
  - ✅ .env.example updated
  - ✅ Typecheck passes ✅
- ✅ Phase 1: Employees module + tests COMPLETE
  - ✅ Unit tests (12 tests): getAvailableEmployees, getPersonalManager, updateAvailability, getEmployeeKpi
  - ✅ EmployeesService: CRUD + personal manager lookup + assignment upsert
  - ✅ EmployeesController: GET /employees/available, PATCH /:id/availability, GET /:id/kpi
  - ✅ DTOs with Swagger: EmployeeResponseDto, AvailableEmployeesResponseDto, EmployeeKpiResponseDto
- ✅ Phase 2: Routing module + tests (MVP) COMPLETE
  - ✅ Unit tests (10 tests): buildPrompt, parseLlmResponse, routeMessage (5 scenarios)
  - ✅ RoutingService: Priority 1 (personal manager), Priority 2 (LLM), Priority 3 (fallback)
  - ✅ Auto-reply generation when no managers available
  - ✅ Event deduplication by eventId
  - ✅ RoutingController: POST /routing/route
  - ✅ DTOs with Swagger: RouteMessageDto, RoutingResultDto, Topic/Urgency enums
- ✅ Phase 3: KPI module + tests COMPLETE
  - ✅ Unit tests (11 tests): calculateKpiScore (5 edge cases), getCurrentKpi, recalculateKpi, recalculateAllKpi
  - ✅ KpiService: KPI formula (conversion 60% + response 20% + volume 20%)
  - ✅ Daily recalculation from Bitrix24 deals
  - ✅ KPI history tracking (30 days)
  - ✅ KpiController: GET /kpi, POST /kpi/recalculate, GET /kpi/:id
- ✅ Phase 4: Mailing module + tests COMPLETE
  - ✅ Unit tests (10 tests): getCandidates, buildEmailPrompt, sendToCandidate (3 scenarios), getStats
  - ✅ MailingService: candidate selection (inactive > N days, exclude terminal statuses)
  - ✅ LLM email generation with fallback to template
  - ✅ Statistics tracking (sent, failed, response rate)
  - ✅ MailingController: GET /mailing/candidates, POST /mailing/send, GET /mailing/stats
  - ✅ DTOs with Swagger: SendMailingDto, MailingChannel enum
- ✅ Phase 5: Analytics module + tests COMPLETE
  - ✅ Unit tests (10 tests): getFunnel, getRejections, getManagerStats, getMailingStats
  - ✅ AnalyticsService: Funnel conversion, rejection reasons, manager stats, mailing analytics
  - ✅ Rejection reason mapping (13 reasons from pipeline.json)
  - ✅ AnalyticsController: GET /analytics/funnel, /rejections, /managers, /mailing
- ✅ Phase 6: Sync module + Bitrix24 integration COMPLETE
  - ✅ Unit tests (6 tests): syncLeads (3 scenarios), getCacheStats, error handling
  - ✅ SyncService: syncLeads from Bitrix24 → LeadCache (upsert logic)
  - ✅ Error handling: graceful degradation on Bitrix API failure
  - ✅ SyncController: POST /sync/leads, GET /sync/cache-stats
  - ✅ BitrixService: Full REST API wrapper with retry logic for rate limits

### Current State (2026-04-09 21:00)
- ✅ All 6 phases complete, **344 tests passing**
- ✅ Typecheck clean
- ✅ Supabase: 6 tables created, 23 employees seeded
- ✅ **SERVER RUNNING** — NestJS API на порту 3001, все endpoints работают
- ✅ **DI ISSUE FIXED** — PrismaService успешно инжектится во все сервисы
- ✅ n8n: 6 workflows created + activated (Routing, KPI, Sync, Mailing, Transfer, My workflow)
- ✅ Bitrix24: Webhook event handler registered (ONIMCONNECTORMESSAGEADD) → n8n/webhook/routing-message

### Endpoint Test Results (2026-04-09 21:00)
```bash
# Health ✅
curl http://localhost:3001/api/health
→ {"status":"ok","timestamp":"2026-04-09T14:59:41.701Z","service":"flex-n-roll-api"}

# Employees ✅ (23 employees, sorted by KPI DESC)
curl http://localhost:3001/api/employees/available
→ {"success":true,"data":{"employees":[...23 items...]}}

# Routing ✅ (fallback to KPI since Ollama unreachable)
curl -X POST http://localhost:3001/api/routing/route \
  -H "x-api-key: dev-secret-key-change-in-production" \
  -d '{"messageText": "Нужна этикетка 58х40мм", "channel": "telegram"}'
→ {"success":true,"data":{"managerId":13,"managerName":"Марина","topic":"other","urgency":"medium","reason":"Fallback: LLM недоступ, выбран по KPI"}}
```

---
- Project: FlexRouter AI — 3-node architecture. Node 1: MacBook M4 (friend) runs n8n (:5678) + Ollama (qwen2.5:14b-instruct). Node 2: VPS kurumi.software runs Nginx+SSL+Tailscale, forwards Bitrix24 webhooks to MacBook. Node 3: User's server runs NestJS API (:3000) + Supabase cloud, accesses n8n/Ollama via Tailscale IP directly. Bitrix24 webhooks go to https://n8n.kurumi.software → VPS → Tailscale → n8n. NestJS calls n8n/Ollama via Tailscale IP (http://100.x.x.x:PORT). All 6 phases complete, **282 tests passing**.
- FlexRouter AI hackathon backend fully implemented and pushed to GitHub (https://github.com/Kurumilog/flex-n-roll, branch feature/nestjs-backend). All 6 phases complete, **282 tests passing**, Supabase migration applied, README written. Next pending: nothing critical — project is production-ready for hackathon integration phase (Bitrix24 + n8n + Ollama via Tailscale).
- ## FlexRouter AI Architecture (3 nodes)

**Node 1 — MacBook M4 (друг):** n8n local (:5678) + Ollama (qwen2.5:14b-instruct). Tailscale IP: 100.94.92.23

**Node 2 — VPS kurumi.software:** Nginx + SSL + Tailscale. Public IP: 159.65.122.92. Tailscale IP: 100.103.222.127. Форвардит HTTPS webhook'и от Bitrix24 на MacBook.

**Node 3 — Твой сервер (CachyOS):** NestJS API (:3000) + Supabase (cloud PostgreSQL). Tailscale IP: 100.80.124.27

**Bitrix24 (облако):** hackathon-team-xx.bitrix24.ru. Webhook на https://n8n.kurumi.software.

### Data Flow (кто к кому обращается):

| Откуда | Куда | Как | URL |
|--------|------|-----|-----|
| n8n → NestJS | webhook | https://n8n.kurumi.software → VPS → Tailscale → NestJS | GET /employees/available, POST /routing/route, POST /kpi/recalculate, POST /sync/leads, GET/POST /mailing/*, GET /analytics/* |
| NestJS → Bitrix24 | ПРЯМОЙ HTTPS | BitrixService (getLeads, getDeals, getOpenSessions, transferSession, createLead, createTask, sendMessage, addActivity) | https://hackathon-team-xx.bitrix24.ru/rest/1/XXXXX |
| NestJS → Ollama | Tailscale прямой | OllamaService (chat, embed) | http://100.94.92.23:11434 |
| NestJS → n8n | webhook | N8nService (triggerWorkflow) | https://n8n.kurumi.software/webhook/{name} |
| AI (я) → n8n | MCP | Управление workflow через MCP | https://n8n.kurumi.software/mcp/cfd90fc7-90c4-4c2b-8086-436443cdd71e |

### Tailscale IPs:
- ubuntu-vps: 100.103.222.127
- kurumi (CachyOS): 100.80.124.27
- macbook-air (n8n+Ollama): 100.94.92.23

### DNS:
- n8n.kurumi.software → 159.65.122.92 (VPS)
- api.kurumi.software → не создан (не нужен, NestJS доступен через Tailscale)

### Key decision:
- NestJS обращается к Bitrix24 НАПРЯМУЮ (не через n8n)
- NestJS обращается к Ollama через Tailscale НАПРЯМУЮ
- n8n — оркестратор: получает webhook от Bitrix24, вызывает NestJS для расчёта, потом сам идёт в Bitrix24 для действий
- NestJS может триггерить n8n workflow через webhook (N8nService)
- AI управляет n8n через MCP

## 🎉 ALL 6 PHASES COMPLETE!

### Final Statistics
- **Test Suites:** 27 passed
- **Total Tests:** 274 passed
- **Typecheck:** ✅ Clean
- **Modules Implemented:** 8 (employees, routing, kpi, mailing, analytics, sync, bitrix, ollama)
- **API Endpoints:** 20+ endpoints with Swagger documentation

### Complete Module List
1. **Employees** — Manager availability, personal manager lookup, KPI history
2. **Routing** — AI-powered message routing (personal → LLM → fallback)
3. **KPI** — KPI calculation, daily recalculation, history tracking
4. **Mailing** — Reactivation email campaigns with LLM generation
5. **Analytics** — Funnel conversion, rejection reasons, manager/mailing stats
6. **Sync** — Bitrix24 leads synchronization
7. **Bitrix** — Bitrix24 REST API wrapper (leads, deals, sessions, tasks)
8. **Ollama** — Ollama LLM HTTP client (qwen2.5:14b with chat + embed)

### Next Steps (Integration)
1. **Add DATABASE_URL to .env.local** — Supabase connection string needed for Prisma
2. Run `pnpm prisma:migrate` to create database tables
3. Run `pnpm prisma:seed` to load 23 employees
4. Start server: `pnpm dev` → API at http://localhost:3000 (PORT=3001 in .env.local)
5. ~~Swagger docs~~ — Disabled due to circular dependency in legacy DTOs
6. Configure n8n webhook routing-message endpoint + Bitrix24 event handler

### Current State (PAUSED — 2026-04-09)
- Branch: `feature/nestjs-backend`
- **Tests:** 344/344 passing ✅
- **Typecheck:** ✅ Clean
- **NestJS startup:** ✅ Works (all routes mapped, stops at Prisma connect — needs DATABASE_URL)
- **n8n:** 6 workflows created + activated (Routing, KPI, Sync, Mailing, Transfer, My workflow)
- **Bitrix24:** Webhook event handler registered (ONIMCONNECTORMESSAGEADD) → n8n/webhook/routing-message

### Known Issues
- Swagger docs disabled (circular dependency in legacy applications/ DTOs)
- NestJS needs DATABASE_URL env var to start fully (Prisma connection)
- Bitrix24 webhook URL in .env.local needs real value
- Ollama Tailscale connectivity untested

### What was done today (2026-04-09)
1. Created 5 n8n workflows via API (Routing v2, KPI Recalculate, Leads Sync, Mailing, Transfer Inactive)
2. Implemented N8nService (NestJS → n8n webhook calls)
3. Fixed ConfigService DI failures across ALL modules (@Optional + process.env fallbacks)
4. Downgraded @nestjs/config to 3.3.0 (v4 incompatible with NestJS v10)
5. Created docs/n8n-api-reference.md and docs/flexrouter-full-flow.md
6. Updated Routing workflow for ONIMCONNECTORMESSAGEADD format
7. Disabled Swagger due to circular dependency in legacy DTOs

### Next session: what to do first
1. ✅ **FIX DI ISSUE** — Исправлено (см. ниже)
2. ✅ Add DATABASE_URL to apps/api/.env.local
3. ✅ Run `pnpm prisma:migrate` + `pnpm prisma:seed`
4. ✅ Verify `pnpm dev` starts fully
5. ✅ Test `curl http://localhost:3001/api/routing/route`
6. ⏭ Test full chain: Bitrix24 → n8n → NestJS → Ollama → Bitrix24

---

## ✅ RESOLVED: NestJS DI Issue — PrismaService

### Проблема (была)
PrismaService не инжектится в сервисы через NestJS DI — все сервисы получали `undefined` вместо PrismaService.

### Root Cause
Проблема была в **двух вещах одновременно**:
1. **tsx watch** конфликтовал с NestJS decorator metadata при CommonJS moduleResolution
2. **Множественные экземпляры PrismaService** создавали конфликты prepared statements в Supabase pooling

### Решение (2 шага)
1. **Перешли на `nest start --watch`** вместо `tsx watch` — официальный NestJS CLI
   - Файл: `apps/api/package.json` — `"dev": "nest start --watch"`
   - Добавлен `nest-cli.json`

2. **Глобальный PrismaClient singleton** — избежание конфликта prepared statements
   - Файл: `apps/api/src/prisma/prisma.service.ts`
   - Module-level `let globalPrismaClient: PrismaClient | null = null`
   - Все экземпляры PrismaService делят один PrismaClient

### Результат
- ✅ Все 23 сотрудника из базы
- ✅ Routing работает (fallback к KPI при недоступном Ollama)
- ✅ Health endpoint работает
- ✅ 344 теста проходят

### Bitrix24 Webhook Note
На Bitrix24 настроен только один исходящий вебхук: `https://b24-p0ujtw.bitrix24.ru/rest/1/9591mae2cb8qecvt/`
Это нужно учитывать при интеграции — все вызовы к Bitrix24 идут через этот webhook.
