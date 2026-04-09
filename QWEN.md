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

### Current State (2026-04-09)
- ✅ All 6 phases complete, **282 tests passing** (was 274)
- ✅ Typecheck clean (removed dotenv dependency)
- ✅ Supabase: 6 tables created, 23 employees seeded
- ✅ Production-ready for hackathon integration phase

---
- Project: FlexRouter AI — 3-node architecture. Node 1: MacBook M4 (friend) runs n8n (:5678) + Ollama (qwen2.5:14b-instruct). Node 2: VPS kurumi.software runs Nginx+SSL+Tailscale, forwards Bitrix24 webhooks to MacBook. Node 3: User's server runs NestJS API (:3000) + Supabase cloud, accesses n8n/Ollama via Tailscale IP directly. Bitrix24 webhooks go to https://n8n.kurumi.software → VPS → Tailscale → n8n. NestJS calls n8n/Ollama via Tailscale IP (http://100.x.x.x:PORT). All 6 phases complete, **282 tests passing**.
- FlexRouter AI hackathon backend fully implemented and pushed to GitHub (https://github.com/Kurumilog/flex-n-roll, branch feature/nestjs-backend). All 6 phases complete, **282 tests passing**, Supabase migration applied, README written. Next pending: nothing critical — project is production-ready for hackathon integration phase (Bitrix24 + n8n + Ollama via Tailscale).

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
1. Configure Supabase connection string in `.env.local`
2. Run `pnpm prisma:migrate` to create database tables
3. Run `pnpm prisma:seed` to load 23 employees
4. Start server: `pnpm dev` → API at http://localhost:3000
5. Swagger docs: http://localhost:3000/api/docs
6. Integrate with n8n webhooks once Bitrix24 is configured

### Key Files
- AGENTS.md — Complete hackathon spec (architecture, API, tests, business logic)
- hackathon_plan.md — Detailed implementation plan with timelines
- FNR_PRO_Hackathon/data/ — employees.json, dialogs.json, leads.json, deals.json, pipeline.json

### Current State
- Branch: `feature/nestjs-backend`
- Old modules (applications, metrics, pipeline, escalations, auth, profile) still exist but are NOT imported in AppModule
- New modules directory: `src/modules/{employees,routing,kpi,mailing,bitrix,ollama,sync}`
- Prisma schema updated for hackathon
- Dependencies: axios, nodemailer, @nestjs/passport added
