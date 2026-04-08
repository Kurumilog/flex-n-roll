# FlexRouter AI — Project Status

## Текущий статус

**Ветка**: `feature/nestjs-backend`

**Последнее обновление**: 2026-04-08

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
| **Итого** | **8 модулей** | **274 теста** | **✅** |

---

## 🏗 Архитектура (3 узла)

```
┌─────────────────────┐     ┌──────────────────────────┐
│  Bitrix24 (облако)  │────▶│  VPS: kurumi.software     │
│  Telegram/WhatsApp  │     │  Nginx + SSL + Tailscale  │
└─────────────────────┘     └────────────┬─────────────┘
                                         │ Tailscale
                            ┌────────────┴─────────────┐
                            │  MacBook M4 (друг)       │
                            │  n8n (:5678) + Ollama    │
                            │  qwen2.5:14b-instruct    │
                            └────────────┬─────────────┘
                                         │ Tailscale
                                         ↓
                            ┌──────────────────────────┐
                            │  ТВОЙ СЕРВЕР             │
                            │  NestJS API (:3000)      │
                            │  Supabase (cloud)        │
                            │                          │
                            │  /api/employees          │
                            │  /api/routing            │
                            │  /api/kpi                │
                            │  /api/mailing            │
                            │  /api/analytics          │
                            │  /api/sync               │
                            └──────────────────────────┘
```

### Как работает доступ
- **Bitrix24 → n8n:** webhook на `https://n8n.kurumi.software` → VPS форвардит через Tailscale на MacBook друга
- **NestJS → n8n:** прямой доступ по Tailscale IP (`http://100.x.x.x:5678`)
- **NestJS → Ollama:** прямой доступ по Tailscale IP (`http://100.x.x.x:11434`)

**Удалено (legacy, не импортируется)**: `apps/web/`, `apps/bx24/`, `packages/ui/`
**Старые модули (существуют, но НЕ в AppModule)**: applications, metrics, pipeline, escalations, auth, profile, core

---

## 📦 База данных (Prisma + Supabase PostgreSQL)

| Модель | Описание |
|--------|----------|
| **Employee** | 23 менеджера с KPI, доступностью, рабочими часами |
| **Assignment** | История назначений «клиент → менеджер» (для личных менеджеров) |
| **KpiHistory** | Ежедневные snapshot'ы KPI (30 дней) |
| **LeadCache** | Кэш лидов из Bitrix24 (синхронизируется каждый час) |
| **Mailing** | Записи о рассылках (статус, канал, ответ) |
| **IncomingEvent** | Лог входящих событий (дедупликация по eventId) |

---

## 🔌 API Endpoints

| Module | Endpoints | Description |
|--------|-----------|-------------|
| **Employees** | `GET /employees/available`, `PATCH /employees/:id/availability`, `GET /employees/:id/kpi` | Менеджеры + личные менеджеры |
| **Routing** | `POST /routing/route` | AI маршрутизация (n8n → NestJS) |
| **KPI** | `GET /kpi`, `POST /kpi/recalculate`, `GET /kpi/:id` | KPI + ежедневный пересчёт |
| **Mailing** | `GET /mailing/candidates`, `POST /mailing/send`, `GET /mailing/stats` | Реактивационные рассылки |
| **Analytics** | `GET /analytics/funnel`, `/rejections`, `/managers`, `/mailing` | Дашборд аналитики |
| **Sync** | `POST /sync/leads`, `GET /sync/cache-stats` | Синхронизация из Bitrix24 |
| **Health** | `GET /api/health` | Health check |
| **Swagger** | `GET /api/docs` | API документация |

---

## 🧪 Тесты

| Тип | Кол-во | Команда |
|-----|--------|---------|
| Unit | 274 | `pnpm --filter api test` |
| Test Suites | 27 | `pnpm --filter api test` |

**Конвенция:** Tests FIRST (unit → integration → e2e). >80% coverage target.

---

## 🔧 Технологии

| Компонент | Технология | Версия |
|-----------|------------|--------|
| Framework | NestJS | 10.4.22 |
| ORM | Prisma | 5.22.0 |
| Database | Supabase (PostgreSQL) | — |
| LLM | Ollama (qwen2.5:14b-instruct) | — |
| HTTP Client | Axios | 1.14.0 |
| Email | Nodemailer | 6.10.1 |
| Swagger | @nestjs/swagger | 8.1.1 |
| Validation | class-validator | 0.14.2 |
| Package manager | pnpm | 10.33.0 |
| Runtime | Node.js | 25.8.2 |

---

## 🚀 Запуск

```bash
pnpm install
pnpm --filter api prisma:generate   # Сгенерировать Prisma Client
pnpm --filter api prisma:migrate    # Применить миграции
pnpm --filter api prisma:seed       # Загрузить 23 сотрудников
pnpm --filter api dev               # Запустить сервер
```

**API**: http://localhost:3000
**Swagger**: http://localhost:3000/api/docs

---

## ⏭ Следующие шаги (интеграция)

1. **Supabase** — настроить DATABASE_URL в `.env.local`
2. **Ollama** — подключить к MacBook M4 через Tailscale (qwen2.5:14b)
3. **Bitrix24** — настроить webhook URL, проверить API
4. **n8n** — подключить webhooks к NestJS endpoints
5. **E2E тестирование** — полный flow: Bitrix24 → n8n → NestJS → Менеджер назначен

---

## 🔍 Аудит кода (2026-04-08)

Проверено через **context7** (актуальная документация) и **Supabase MCP**:

| Что проверяли | Результат |
|---------------|-----------|
| NestJS Guards (`@nestjs/passport`) | ✅ Наш guard переписан на standalone CanActivate |
| Prisma `$transaction` array syntax | ✅ Актуален |
| Prisma `upsert` | ✅ Актуален |
| Ollama `/api/chat` | ✅ Актуален |
| Ollama `/api/embeddings` | ✅ Исправлен (был `/api/embed`) |
| Supabase БД | ✅ 6 таблиц созданы, pgvector включён, 0 security warnings |

### Исправления аудита
1. ✅ **Ollama embed**: `/api/embed` → `/api/embeddings`, response `embeddings[]` → `embedding`
2. ✅ **ApiKeyGuard**: standalone `CanActivate` вместо сломанного `@nestjs/passport`
3. ✅ **Supabase миграция**: все 6 таблиц + `CREATE EXTENSION vector`
4. ✅ **274 теста проходят**, typecheck clean
