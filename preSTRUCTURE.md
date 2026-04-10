# FlexRouter AI — Архитектура проекта

## Обзор

FlexRouter AI — система умной AI-маршрутизации входящих обращений для Flex-N-Roll PRO (B2B производитель этикетки, Минск + Москва). Автоматически назначает оптимального менеджера по KPI, занятости и истории клиента через LLM (qwen2.5:14b) + Bitrix24 интеграцию.

## Физическая архитектура (3 узла)

```
┌────────────────────────────────────────────────────────────────┐
│                    BITRIX24 (облако)                           │
│           hackathon-team-xx.bitrix24.ru                        │
│     Open Lines: Telegram / WhatsApp / Email                    │
└──────────┬───────────────────────────┬─────────────────────────┘
           │ webhook (HTTPS)           │ REST API (исходящие)
           ↓                           ↓
┌─────────────────────────┐   ┌──────────────────────────────────┐
│  VPS: kurumi.software   │   │  Ноутбук ДРУГА (MacBook M4)     │
│  DigitalOcean           │   │  n8n local (:5678)               │
│  Nginx + SSL            │   │  Ollama (qwen2.5:14b-instruct)  │
│  Tailscale node         │   │  OLLAMA_NUM_PARALLEL=4           │
│                         │   │  Tailscale: 100.x.x.x            │
│  Форвардит HTTPS →      │   └────────────┬─────────────────────┘
│  Tailscale на MacBook   │                │ Tailscale
└──────────┬──────────────┘                │
           │                               │
           │ Tailscale                     │
           ↓                               ↓
┌──────────────────────────────────────────────────────────────┐
│  ТВОЙ СЕРВЕР (ноутбук/сервер)                                │
│  NestJS API (:3000) — FlexRouter backend                     │
│  Supabase (PostgreSQL) — через cloud connection              │
│  Tailscale: 100.x.x.x                                        │
│                                                              │
│  /api/employees   — менеджеры (KPI, доступность)             │
│  /api/routing     — AI маршрутизация                         │
│  /api/kpi         — KPI расчёт + история                     │
│  /api/mailing     — реактивационные рассылки                  │
│  /api/analytics   — дашборд (воронка, отказы, статистика)    │
│  /api/sync        — синхронизация лидов из Bitrix24          │
└──────────────────────────────────────────────────────────────┘
```

### Как работает публичный доступ

Bitrix24 (облако) отправляет события на `https://n8n.kurumi.software`. VPS принимает HTTPS запрос через Nginx с SSL (Let's Encrypt), форвардит их через Tailscale на MacBook M4 друга (порт 5678, n8n). MacBook не имеет публичного IP — он только слушает Tailscale.

Твой NestJS сервер обращается к n8n по Tailscale IP напрямую (без HTTPS прослойки).

## Структура монорепо

```
Flexnroll/
├── apps/
│   └── api/                      # NestJS backend (единственное приложение)
│       ├── src/
│       │   ├── modules/
│       │   │   ├── employees/    # Менеджеры: доступность, KPI, личные менеджеры
│       │   │   ├── routing/      # AI маршрутизация (Ollama qwen2.5:14b)
│       │   │   ├── kpi/          # KPI формула, история, пересчёт
│       │   │   ├── mailing/      # Реактивационные email рассылки
│       │   │   ├── analytics/    # Воронка, отказы, статистика
│       │   │   ├── sync/         # Синхронизация лидов из Bitrix24
│       │   │   ├── bitrix/       # Bitrix24 REST API wrapper
│       │   │   └── ollama/       # Ollama HTTP client (chat + embed)
│       │   ├── prisma/           # Prisma module (global)
│       │   ├── health/           # Health check + redirect на /api/docs
│       │   ├── common/           # Guards, pipes, interceptors, decorators
│       │   ├── config/           # ConfigModule + валидация env
│       │   ├── app.module.ts     # Главный модуль
│       │   └── main.ts           # Точка входа + Swagger setup
│       ├── prisma/
│       │   ├── schema.prisma     # DB schema
│       │   └── seed.ts           # Seed из employees.json
│       ├── test/                 # E2E тесты (legacy)
│       ├── jest.config.json      # Jest конфиг для unit тестов
│       ├── package.json
│       ├── tsconfig.json
│       ├── .env.example          # Шаблон env переменных
│       └── .env.local            # Локальная разработка (не коммитить)
│
├── FNR_PRO_Hackathon/data/       # Данные CRM (не коммитить)
│   ├── employees.json            # 23 сотрудника
│   ├── leads.json                # 200 лидов
│   ├── deals.json                # 20 сделок
│   ├── dialogs.json              # 30 диалогов
│   ├── pipeline.json             # Воронки и статусы
│   └── activities.json           # 50 активностей
│
├── .qwen/
│   ├── settings.json             # Qwen Code конфиг + MCP серверы
│   └── output-language.md        # Правило языка вывода
│
├── docs/
│   └── superpowers/
│       ├── plans/                # Планы реализации
│       └── specs/                # Спецификации
│
├── AGENTS.md                     # Полная спецификация хакатона
├── hackathon_plan.md             # Детальный план с таймлайном
├── PROJECT_STATUS.md             # Текущий статус проекта
├── QWEN.md                       # Памятка AI (прогресс + баги)
├── .env.example                  # Корневой шаблон (Supabase MCP токен)
├── package.json                  # Root workspace (pnpm + turbo)
├── pnpm-workspace.yaml
├── turbo.json
└── tsconfig.base.json
```

## Удалённые компоненты

| Путь | Причина |
|------|---------|
| `apps/web/` | Удалён по спеку `2026-04-07-strip-frontend-design.md` — фронтенд больше не нужен |
| `apps/bx24/` | Пустая папка, удалена |
| `packages/ui/` | UI компоненты привязанные к старому фронтенду, удалены |

## Старые модули (существуют в коде, НЕ импортируются в AppModule)

| Модуль | Причина |
|--------|---------|
| `src/applications/` | Mock-модуль, заменён на routing + employees |
| `src/metrics/` | Mock-модуль, заменён на analytics |
| `src/pipeline/` | Mock-модуль, заменён на routing |
| `src/escalations/` | Не в scope хакатона |
| `src/auth/` | Session auth, заменён на API-key guard |
| `src/profile/` | Не нужен для хакатона |
| `src/core/` | MockAuthStoreService, не нужен |

## Технологии

| Компонент | Технология | Версия |
|-----------|------------|--------|
| Framework | NestJS | 10.4.22 |
| ORM | Prisma | 5.22.0 |
| Database | Supabase (PostgreSQL) | — |
| LLM | Ollama (qwen2.5:14b) | — |
| HTTP Client | Axios | 1.14.0 |
| Email | Nodemailer | 6.10.1 |
| Swagger | @nestjs/swagger | 8.1.1 |
| Validation | class-validator + class-transformer | 0.14.2 / 0.5.1 |
| Test (unit) | Jest + ts-jest | — |
| Package manager | pnpm | 10.33.0 |
| Build orchestrator | Turbo | 2.5.0 |
| Runtime | Node.js | 25.8.2 |

## API Endpoints

| Module | Endpoints | Status |
|--------|-----------|--------|
| **Health** | `GET /api/health` | ✅ |
| **Employees** | `GET /employees/available`, `PATCH /employees/:id/availability`, `GET /employees/:id/kpi` | ✅ |
| **Routing** | `POST /routing/route` | ✅ |
| **KPI** | `GET /kpi`, `POST /kpi/recalculate`, `GET /kpi/:id` | ✅ |
| **Mailing** | `GET /mailing/candidates`, `POST /mailing/send`, `GET /mailing/stats` | ✅ |
| **Analytics** | `GET /analytics/funnel`, `/rejections`, `/managers`, `/mailing` | ✅ |
| **Sync** | `POST /sync/leads`, `GET /sync/cache-stats` | ✅ |
| **Swagger** | `GET /api/docs` | ✅ |

## Тесты

| Тип | Кол-во | Команда |
|-----|--------|---------|
| Unit | 348 | `pnpm --filter api test` |
| Test Suites | 32 | `pnpm --filter api test` |

## Env переменные

| Переменная | Описание | Где берётся |
|------------|----------|-------------|
| `NODE_ENV` | runtime: development / production | local |
| `PORT` | порт API сервера (3000) | local |
| `DATABASE_URL` | строка подключения к PostgreSQL (Supabase) | Supabase dashboard |
| `BITRIX24_WEBHOOK_URL` | webhook для Битрикс24 REST API | Bitrix24 → Маркетплейс |
| `BITRIX24_INCOMING_SECRET` | секрет для валидации входящих событий | Bitrix24 → Маркетплейс |
| `OLLAMA_BASE_URL` | URL Ollama API (Tailscale IP MacBook друга) | `http://100.x.x.x:11434` |
| `OLLAMA_ROUTING_MODEL` | модель для маршрутизации | `qwen2.5:14b` |
| `OLLAMA_TIMEOUT_MS` | таймаут Ollama в мс (60000) | local |
| `SMTP_HOST` | SMTP сервер для рассылок | gmail/outlook |
| `SMTP_PORT` | SMTP порт (587) | local |
| `SMTP_USER` | SMTP пользователь | local |
| `SMTP_PASS` | SMTP пароль (app-specific) | local |
| `SMTP_FROM` | From адрес для рассылок | local |
| `API_SECRET_KEY` | ключ для защиты endpoints от n8n | generated |
| `N8N_BASE_URL` | URL n8n (Tailscale IP MacBook друга) | `http://100.x.x.x:5678` |

## Команды

```bash
# Установка зависимостей
pnpm install

# Разработка
pnpm --filter api dev           # только API

# Prisma
pnpm --filter api prisma:generate   # Сгенерировать Prisma Client
pnpm --filter api prisma:migrate    # Применить миграции
pnpm --filter api prisma:studio     # Открыть Prisma Studio
pnpm --filter api prisma:seed       # Загрузить данные из employees.json

# Тип-чекинг
pnpm --filter api typecheck     # только API

# Тесты
pnpm --filter api test          # unit tests
pnpm --filter api test:cov      # unit tests с покрытием

# Swagger
# http://localhost:3000/api/docs
```

## Поток данных (end-to-end)

```
1. Клиент пишет в Telegram
   ↓
2. Bitrix24 Open Line → событие ONOPENLINEMESSAGEADD
   ↓ (webhook на https://n8n.kurumi.software)
3. VPS → Tailscale → n8n на MacBook друга
   ↓
4. n8n HTTP Request → GET /api/employees/available (Tailscale → твой сервер)
   ↓
5. n8n HTTP Request → POST /api/routing/route
   (NestJS: personal manager lookup → LLM routing via Ollama → fallback)
   ↓
6. NestJS возвращает: { managerId, topic, urgency, reason }
   ↓
7. n8n HTTP Request → Bitrix24 API:
   - imopenlines.session.transfer (передать диалог менеджеру)
   - crm.lead.add (создать лид)
   - tasks.task.add (создать задачу менеджеру)
   ↓
8. Менеджер видит диалог в Bitrix24 и отвечает клиенту
```
