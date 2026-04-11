# FlexRouter AI — Project Status

## Текущий статус

**Ветка**: `feature/nestjs-backend`

**Последнее обновление**: 2026-04-10 08:35

**Статус**: ✅ **BACKEND RUNNING** — NestJS API на порту 3001, routing через Ollama работает, n8n OAuth credential с auto-refresh, Transfer Inactive деактивирован

---

## ✅ n8n Workflow Audit & Fixes (2026-04-10)

| Workflow | ID | Было | Стало | Статус |
|----------|-----|------|-------|--------|
| **Routing** | `iHnbF3T4HFjEgzY4` | ✅ уже правильный (через VPS proxy) | OAuth credential | ✅ |
| **KPI Recalculate** | `587Eqkykn6Rd8ujH` | `:3000/api/kpi/recalculate` | `:3001/api/kpi/recalculate` | ✅ |
| **Mailing** | `fSgTAkO0ddlXwns9` | `:3000/api/mailing/*` | `:3001/api/mailing/*` | ✅ |
| **Leads Sync** | `blVnCIqe4hyFrtvb` | `:3000/api/sync/leads` | `:3001/api/sync/leads` | ✅ |
| **Transfer Inactive** | `Esa9RuyUEMchzlf0` | `:3000/api/employees/available` | OAuth credential | ⏸️ Deactivated |
| **AI Lead Analysis** | `cTp3tAVjyWmqHY2i` | Groq, не относится | OAuth credential | ✅ |

## ✅ n8n OAuth2 Credential (2026-04-10 08:00)

| Параметр | Значение |
|----------|----------|
| **Credential ID** | `YOUR_N8N_CREDENTIAL_ID` |
| **Credential Name** | `Bitrix24 OAuth (hackathon-team-xx)` |
| **Type** | `oAuth2Api` (n8n generic credential) |
| **Grant Type** | `authorizationCode` |
| **authUrl** | `https://YOUR-PORTAL.bitrix24.ru/oauth/authorize/` |
| **accessTokenUrl** | `https://YOUR-PORTAL.bitrix24.ru/oauth/token/` |
| **Auto-refresh** | ✅ n8n автоматически refresh'ит access_token через refresh_token |
| **Refresh Token Test** | ✅ Проверено — возвращает новый access_token + refresh_token |
| **6 нод привязаны** | Routing (3), My workflow (2), Transfer Inactive (1) |

**Как работает auto-refresh:**
```
n8n HTTP Request node → запрос с access_token
  → Если 401 (token expired)
    → n8n POST /oauth/token/ с refresh_token
    → Сохраняет новые tokens в credential
    → Повторяет оригинальный запрос
```

## ✅ Sync Fix (2026-04-10)

1. **Bitrix24 pagination** — `getLeads()` переделан с numeric offset на cursor pagination (`next`). Загружает все 215 лидов.
2. **Type mismatch** — `ASSIGNED_BY_ID` из строки `"1"` конвертируется в `parseInt()` для Prisma Int.

**Результат:** `POST /api/sync/leads` → 215/215 synced ✅

---

## 📊 Компоненты

| Компонент | Статус | Детали |
|-----------|--------|--------|
| **Dashboard UI** | ✅ | React+Vite дашборд, задеплоен на VPS |
| **Bitrix24** | ⚠️ | Webhook: `crm`, `im`, `task`, `user`. OAuth credential настроена с auto-refresh. Open Lines не подключён → Transfer Inactive деактивирован |
| **Ollama** | ✅ | qwen2.5:14b на MacBook M4 (YOUR_TAILSCALE_IP:11434), routing ~2.5-19s |
| **NestJS / DB** | ✅ | Порт 3001, 215 лидов, routing работает, 344 тестов |
| **n8n** | ✅ | 5 активных workflow, 1 деактивирован, OAuth credential с auto-refresh |
| **Nginx proxy** | ✅ | `/nestjs-api/` → NestJS через VPS |

---

## 🎉 ALL PHASES COMPLETE — Hackathon Backend Ready

| Фаза | Модуль | Тесты | Статус |
|------|--------|-------|--------|
| 0 | Scaffolding (Prisma, BitrixService, OllamaService) | — | ✅ |
| 1 | Employees (менеджеры, доступность, личные менеджеры) | 12 | ✅ |
| 2 | Routing (AI маршрутизация через Ollama) | 10 | ✅ |
| 3 | KPI (формула, пересчёт, история) | 11 | ✅ |
| 4 | Mailing (реактивационные рассылки) | 10 | ✅ |
| 5 | Analytics (воронка, отказы, статистика) | 10 | ✅ |
| 6 | Sync (синхронизация лидов из Bitrix24) | 6 | ✅ |
| **Итого** | **8 модулей** | **344 тестов** | **✅** |

---

## 🏗 Архитектура (3 узла + VPS proxy)

```
┌─────────────────────┐     ┌──────────────────────────┐
│  Bitrix24 (облако)  │────▶│  VPS: kurumi.software     │
│  Telegram/WhatsApp  │     │  Nginx + SSL + Tailscale  │
└─────────────────────┘     └────────────┬─────────────┘
                                         │ Tailscale
                            ┌────────────┴─────────────┐
                            │  MacBook M4 (друг)       │
                            │  n8n (:5678) + Ollama    │
                            │  qwen2.5:14b             │
                            └─────────────────────────┘
                                         │ Tailscale
                                         ↓
                            ┌──────────────────────────┐
                            │  ТВОЙ СЕРВЕР (CachyOS)   │
                            │  NestJS API (:3001)      │
                            │  Supabase (cloud)        │
                            │                          │
                            │  /api/employees          │
                            │  /api/routing            │
                            │  /api/kpi                │
                            │  /api/mailing            │
                            │  /api/analytics          │
                            │  /api/sync               │
                            │  /api/dashboard          │
                            │  /api/bitrix             │
                            └──────────────────────────┘
```

### Как работает доступ
- **Bitrix24 → n8n:** webhook на `https://n8n.kurumi.software/webhook/routing-message` → VPS форвардит через Tailscale на MacBook
- **n8n → NestJS:** `https://n8n.kurumi.software/nestjs-api/` → VPS Nginx proxy → `http://YOUR_TAILSCALE_IP:3001/api/`
- **NestJS → Ollama:** прямой доступ по Tailscale (`http://YOUR_TAILSCALE_IP:11434`)
- **n8n → Bitrix24:** через **OAuth2 credential** `YOUR_N8N_CREDENTIAL_ID` (auto-refresh)
- **NestJS → Bitrix24:** прямой HTTPS (через webhook URL `https://YOUR-PORTAL.bitrix24.ru/rest/1/YOUR_WEBHOOK_CODE/`)

**Legacy (НЕ импортируется в AppModule)**: applications, metrics, pipeline, escalations, auth, profile, core

---

## 📦 База данных (Prisma + Supabase PostgreSQL)

| Модель | Описание |
|--------|----------|
| **Employee** | 23 менеджера с KPI, доступностью, рабочими часами (workEnd временно 23:59) |
| **Assignment** | История назначений «клиент → менеджер» (для личных менеджеров) |
| **KpiHistory** | Ежедневные snapshot'ы KPI (30 дней) |
| **LeadCache** | Кэш лидов из Bitrix24 (**215 лидов загружено**) |
| **Mailing** | Записи о рассылках (статус, канал, ответ) |
| **IncomingEvent** | Лог входящих событий (дедупликация по eventId) |

---

## 🔌 API Endpoints

| Module | Endpoints | Description |
|--------|-----------|-------------|
| **Employees** | `GET /employees/available`, `PATCH /:id/availability`, `PATCH /:id/workhours`, `GET /:id/kpi` | Менеджеры + личные менеджеры |
| **Routing** | `POST /routing/route`, `POST /routing/transfer` | AI маршрутизация (n8n → NestJS) |
| **KPI** | `GET /kpi`, `POST /kpi/recalculate`, `GET /kpi/:id`, `GET /kpi/:id/history` | KPI + ежедневный пересчёт |
| **Mailing** | `GET /mailing/candidates`, `POST /mailing/send`, `GET /mailing/stats` | Реактивационные рассылки |
| **Analytics** | `GET /analytics/funnel`, `/rejections`, `/managers`, `/mailing` | Дашборд аналитики |
| **Sync** | `POST /sync/leads`, `GET /sync/cache-stats` | Синхронизация из Bitrix24 |
| **Dashboard** | `GET /dashboard/summary` | Агрегация для дашборда |
| **Bitrix Proxy** | `GET /bitrix/open-sessions`, `GET/POST /bitrix/tasks` | Прокси к Bitrix24 |
| **Health** | `GET /api/health` | Health check |

---

## 🧪 Тесты

| Тип | Кол-во | Команда |
|-----|--------|---------|
| Unit (passing) | 344 | `pnpm --filter api test` |
| Unit (failing) | 6 | pre-existing: tracking DI (2), analytics mock (2), bitrix start (2) |
| Test Suites | 28/32 | `pnpm --filter api test` |

**Конвенция:** Tests FIRST (unit → integration → e2e). >80% coverage target.

---

## ⚡ Performance Optimizations (2026-04-10)

| Оптимизация | Файл | До | После | Δ |
|-------------|------|----|-------|---|
| **Ollama warmup** | `ollama.service.ts` | Первый запрос: ~27s+ | ~4s при старте | **-23s** |
| **keep_alive: -1** | `ollama.service.ts` | Модель выгружалась через 5min | Остаётся в VRAM | **убирает 20-27s reload** |
| **num_predict: 150** | `ollama.service.ts` | 500 токенов | 150 токенов | **-1-3s** |
| **In-memory cache** | `employees.service.ts` | ~200ms каждый | ~11ms (TTL 60s) | **-95%** |
| **Cache invalidation** | `employees.service.ts` | — | Сброс при `updateAvailability()` | — |

**Real benchmarks:**
- First routing request: ~16s (was ~35-39s)
- Subsequent routing: ~11-15s (was ~27-35s при >5min простоя)
- Employees API: 220ms → 11ms (cached)
- Routing accuracy: 4/4 correct (price→Александр, urgent→Марина, technical→Марина, complaint→Марина)

---

## 🔧 Технологии

| Компонент | Технология | Версия |
|-----------|------------|--------|
| Framework | NestJS | 10.4.22 |
| ORM | Prisma | 5.22.0 |
| Database | Supabase (PostgreSQL) | — |
| LLM | Ollama (qwen2.5:14b) | — |
| HTTP Client | Axios | 1.14.0 |
| Email | Nodemailer | 6.10.1 |
| Validation | class-validator | 0.14.2 |
| Package manager | pnpm | 10.33.0 |
| Runtime | Node.js | 25.8.2 |

---

## 🚀 Запуск

```bash
pnpm install
cd apps/api
pnpm prisma:generate   # Сгенерировать Prisma Client
pnpm prisma:migrate    # Применить миграции
pnpm prisma:seed       # Загрузить 23 сотрудников
npx dotenv-cli -e .env.local -- node dist/main.js  # Запустить сервер
```

**API**: http://localhost:3001
**VPS Proxy**: https://n8n.kurumi.software/nestjs-api/
**Port**: 3001 (указано в `.env.local`)

---

## ⏭ Оставшиеся задачи

| Задача | Приоритет | Детали |
|--------|-----------|--------|
| **Подключить Open Lines** | 🔴 Высокий | Telegram/WhatsApp в Bitrix24 Contact Center → включить Transfer Inactive |
| **E2E тест** | 🔴 Высокий | Bitrix24 сообщение → полный flow до менеджера |
| **workEnd** | 🟢 Низкий | Вернуть актуальные рабочие часы (18:00) после демо |
| **SMTP** | 🟢 Низкий | Включить когда нужен mailing |
| **Failing тесты** | 🟡 Средний | 6 pre-existing: tracking DI, analytics mock, bitrix start param |
