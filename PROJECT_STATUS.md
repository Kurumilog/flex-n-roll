# FlexRouter AI — Project Status

## Текущий статус

**Ветка**: `feature/nestjs-backend`

**Последнее обновление**: 2026-04-10 00:00

**Статус**: ✅ **INTEGRATION PHASE** — n8n → NestJS → Ollama работает, Bitrix24 настроен частично

---

## ✅ Integration Session Results (2026-04-09 evening)

| Компонент | Статус | Детали |
|-----------|--------|--------|
| **Bitrix24** | ⚠️ Частично | Scope: `crm`, `im`, `task`, `user`. `imopenlines` недоступен через webhook |
| **Ollama** | ✅ | qwen2.5:14b на MacBook M4, ~27s на ответ, Tailscale: 100.94.92.23 |
| **NestJS** | ✅ | Порт 3001, 23 сотрудника, маршрутизация через LLM работает |
| **Nginx proxy** | ✅ | `/nestjs-api/` → NestJS через VPS (159.65.122.92) |
| **n8n workflow** | ✅ | Extract Data → NestJS → IF → Notify Manager + Create Task + Auto Reply |
| **n8n → NestJS → Ollama** | ✅ | Полный поток проходит за ~30-35 секунд |
| **Bitrix24 → n8n** | ⏳ | Требует подключённого Open Lines (Telegram/WhatsApp) |

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
| **Итого** | **8 модулей** | **344 теста** | **✅** |

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
                            └────────────┬─────────────┘
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
                            └──────────────────────────┘
```

### Как работает доступ
- **Bitrix24 → n8n:** webhook на `https://n8n.kurumi.software` → VPS форвардит через Tailscale на MacBook
- **n8n → NestJS:** `https://n8n.kurumi.software/nestjs-api/` → VPS Nginx proxy → `http://100.80.124.27:3001/api/`
- **NestJS → Ollama:** прямой доступ по Tailscale (`http://100.94.92.23:11434`)
- **NestJS → Bitrix24:** прямой HTTPS (`https://b24-p0ujtw.bitrix24.ru/rest/1/9591mae2cb8qecvt/`)

**Удалено (legacy, не импортируется)**: `apps/web/`, `apps/bx24/`, `packages/ui/`
**Старые модули (существуют, но НЕ в AppModule)**: applications, metrics, pipeline, escalations, auth, profile, core

---

## 📦 База данных (Prisma + Supabase PostgreSQL)

| Модель | Описание |
|--------|----------|
| **Employee** | 23 менеджера с KPI, доступностью, рабочими часами (workEnd временно 23:59) |
| **Assignment** | История назначений «клиент → менеджер» (для личных менеджеров) |
| **KpiHistory** | Ежедневные snapshot'ы KPI (30 дней) |
| **LeadCache** | Кэш лидов из Bitrix24 (синхронизируется каждый час) |
| **Mailing** | Записи о рассылках (статус, канал, ответ) |
| **IncomingEvent** | Лог входящих событий (дедупликация по eventId) |

---

## 🔌 API Endpoints

| Module | Endpoints | Description |
|--------|-----------|-------------|
| **Employees** | `GET /employees/available`, `PATCH /:id/availability`, `PATCH /:id/workhours`, `GET /:id/kpi` | Менеджеры + личные менеджеры |
| **Routing** | `POST /routing/route`, `POST /routing/transfer` | AI маршрутизация (n8n → NestJS) |
| **KPI** | `GET /kpi`, `POST /kpi/recalculate`, `GET /kpi/:id` | KPI + ежедневный пересчёт |
| **Mailing** | `GET /mailing/candidates`, `POST /mailing/send`, `GET /mailing/stats` | Реактивационные рассылки |
| **Analytics** | `GET /analytics/funnel`, `/rejections`, `/managers`, `/mailing` | Дашборд аналитики |
| **Sync** | `POST /sync/leads`, `GET /sync/cache-stats` | Синхронизация из Bitrix24 |
| **Health** | `GET /api/health` | Health check |

### VPS Proxy Endpoints
| URL | Description |
|-----|-------------|
| `https://n8n.kurumi.software/nestjs-api/health` | NestJS health через VPS |
| `https://n8n.kurumi.software/nestjs-api/routing/route` | NestJS routing через VPS |
| `https://n8n.kurumi.software/nestjs-api/employees/available` | NestJS employees через VPS |

---

## 🧪 Тесты

| Тип | Кол-во | Команда |
|-----|--------|---------|
| Unit | 344 | `pnpm --filter api test` |
| Test Suites | 27 | `pnpm --filter api test` |

**Конвенция:** Tests FIRST (unit → integration → e2e). >80% coverage target.

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
| Swagger | @nestjs/swagger | 8.1.1 |
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
pnpm dev               # Запустить сервер (nest start --watch)
```

**API**: http://localhost:3001
**VPS Proxy**: https://n8n.kurumi.software/nestjs-api/
**Port**: 3001 (указано в `.env.local`)

---

## ⏭ Следующие шаги (интеграция)

1. **Open Lines** — подключить Telegram/WhatsApp канал в Bitrix24 Open Lines
2. **E2E тест** — написать сообщение в подключённый канал → полный flow до менеджера
3. **workEnd** — вернуть актуальные рабочие часы после hackathon демо
4. **SMTP** — включить когда нужен mailing (сейчас отключён)

---

## 🔍 Исправления (2026-04-09 evening)

| Проблема | Решение |
|----------|---------|
| Prisma prepared statements conflict | Убран global singleton, каждый процесс — свой PrismaClient |
| Ollama model mismatch | `qwen2.5:14b-instruct` → `qwen2.5:14b`, timeout 60s |
| n8n → NestJS недоступен | Nginx proxy `/nestjs-api/` → NestJS через VPS |
| Bitrix24 imopenlines недоступен | Заменён на `im.message.add` (Notify Manager) |
| UFW blocked port 3001 | `ufw allow in on tailscale0 to any port 3001` |
| Nginx duplicate configs | Удалены `n8n`, `api.kurumi.software` symlinks |
| Employee work hours filter | Временно `workEnd: 23:59` для тестирования |

---

## 📄 Документация

- **[AGENTS.md](AGENTS.md)** — Полная спецификация hackathon (архитектура, API, тесты, бизнес-логика)
- **[STOPPED_AT.md](STOPPED_AT.md)** — Где остановился, что делать дальше
- **[docs/bitrix24-setup-instruction.md](docs/bitrix24-setup-instruction.md)** — Инструкция по настройке Bitrix24
- **[docs/n8n-api-reference.md](docs/n8n-api-reference.md)** — n8n API и workflow документация
- **[docs/flexrouter-full-flow.md](docs/flexrouter-full-flow.md)** — Полная схема потоков данных
