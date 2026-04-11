# FlexRouter AI — Полный Flow Интеграции

> Версия: 2026-04-10
> Статус: n8n воркфлоу исправлены (порт 3001), sync работает (215 лидов), routing через Ollama функционирует

---

## 1. Архитектура (3 ноды)

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Bitrix24 Cloud                               │
│               YOUR-PORTAL.bitrix24.ru                         │
│  Open Lines (Telegram / WhatsApp / Email)                           │
│  CRM (Leads / Deals / Contacts)                                     │
│  Tasks & Activities                                                 │
└──────────────┬──────────────────────────────────────────────────────┘
               │ Webhook (ONOPENLINEMESSAGEADD)
               ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Node 2: VPS kurumi.software (YOUR_VPS_PUBLIC_IP)                        │
│  Nginx + SSL + Tailscale                                             │
│  Форвардит HTTPS → MacBook M4                                        │
└──────────────┬──────────────────────────────────────────────────────┘
               │ Tailscale (100.x.x.x)
               ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Node 1: MacBook M4 (YOUR_TAILSCALE_IP)                                  │
│  ┌──────────────┐    ┌──────────────────────────────────────────┐   │
│  │     n8n      │    │             Ollama                        │   │
│  │  :5678       │    │        :11434                             │   │
│  │  Оркестратор │    │   qwen2.5:14b-instruct                    │   │
│  │              │    │   (OLLAMA_NUM_PARALLEL=4)                 │   │
│  └──────┬───────┘    └──────────────────────────────────────────┘   │
│         │ Tailscale                                                  │
│         ▼                                                            │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  Node 3: Твой сервер (YOUR_TAILSCALE_IP)                          │   │
│  │  ┌──────────────┐    ┌────────────────────────────────────┐  │   │
│  │  │   NestJS API │    │       Supabase (Cloud)             │  │   │
│  │  │   :3000      │    │   postgresql://db.xxx.supabase.co  │  │   │
│  │  │              │    │   Prisma ORM                       │  │   │
│  │  └──────┬───────┘    └────────────────────────────────────┘  │   │
│  │         │ Tailscale                                           │   │
│  │         ▼                                                     │   │
│  │  ┌────────────────────────────────────────────────────────┐   │   │
│  │  │  BitrixService (прямой HTTPS к Bitrix24)               │   │   │
│  │  │  crm.lead.add, imopenlines.session.transfer, и т.д.    │   │   │
│  │  └────────────────────────────────────────────────────────┘   │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. Кто к кому обращается

| Откуда | Куда | Как | URL / Endpoint |
|--------|------|-----|----------------|
| Bitrix24 → n8n | Webhook POST | ONOPENLINEMESSAGEADD → `https://n8n.kurumi.software/webhook/Citrix-leads` |
| n8n → NestJS | HTTP POST | `POST /api/routing/route` с x-api-key |
| n8n → Bitrix24 | HTTP POST | `crm.lead.add`, `imopenlines.session.transfer`, `tasks.task.add`, `im.message.add` |
| NestJS → Bitrix24 | **ПРЯМОЙ HTTPS** | BitrixService: `crm.lead.list`, `crm.deal.list`, `crm.lead.update`, и т.д. |
| NestJS → Ollama | Tailscale прямой | `POST http://YOUR_TAILSCALE_IP:11434/api/chat` |
| NestJS → n8n | HTTP POST | `POST https://n8n.kurumi.software/webhook/{name}` (N8nService) |
| AI (я) → n8n | MCP | Управление workflow через MCP |

---

## 3. Flow 1: Входящее сообщение (Bitrix24 → NestJS → Менеджер)

### 3.1. Что происходит сейчас (реальный n8n)

Текущий workflow в n8n называется **"My workflow"** и **НЕ** является Routing workflow'ом из AGENTS.md. Это отдельный workflow для AI-анализа лидов через Groq.

```
Webhook (POST /Citrix-leads)
  ↓
HTTP Request → Bitrix24 crm.lead.get (получить лид по ID)
  ↓
Basic LLM Chain (Groq: qwen/qwen3-32b)
  ↓ Анализ: category, summary, priority
  ↓
HTTP Request1 → Bitrix24 crm.timeline.item.add (записать анализ в CRM)
  ↓
Log Available Managers → NestJS GET /api/employees/available (ЛОГИРОВАНИЕ, новый узел)
```

**Этот workflow НЕ маршрутизирует сообщения.** Он только анализирует лиды.

### 3.2. Что ДОЛЖНО быть (Routing workflow — ещё НЕ создан)

```
Bitrix24: Клиент пишет в Telegram/WhatsApp
  ↓ ONOPENLINEMESSAGEADD webhook
n8n Webhook (POST /webhook/message)
  ↓
Code Node: извлечь messageText, clientPhone, clientEmail, sessionId, channel
  ↓
HTTP POST → NestJS /api/routing/route
  {
    messageText, channel, clientPhone, clientEmail, clientBitrixId, eventId
  }
  ↓ NestJS делает:
  │  1. Дедупликация по eventId
  │  2. Приоритет 1: Личный менеджер (Assignment lookup)
  │  3. Приоритет 2: Ollama qwen2.5:14b → LLM классификация
  │  4. Приоритет 3: Fallback → первый по KPI
  │  5. Записать Assignment, IncomingEvent
  ↓
  RoutingResultDto: { managerId, managerName, topic, urgency, reason, autoReplyText }
  ↓
n8n IF: managerId != null?
  ├─ YES (True):
  │   ├─ Bitrix24: imopenlines.session.transfer(sessionId, managerId)
  │   ├─ Bitrix24: tasks.task.add (задача менеджеру)
  │   └─ Bitrix24: crm.lead.add (если новый клиент)
  │
  └─ NO (False):
      └─ Bitrix24: im.message.add (автоответ клиенту)
```

### 3.3. Где включается Ollama qwen2.5 14b

**Ollama вызывается ВНУТРИ NestJS**, не в n8n. Конкретно в `RoutingService.routeMessage()`:

```
Приоритет 1: Личный менеджер
  → Assignment lookup по clientPhone/clientEmail
  → Если interactionCount >= 2 И isAvailable → ВЕРНУТЬ (без Ollama!)

Приоритет 2: LLM-маршрутизация  ← ВОТ ТУТ OLLAMA!
  → OllamaService.chat(prompt, systemPrompt)
  → POST http://YOUR_TAILSCALE_IP:11434/api/chat
  → Модель: qwen2.5:14b-instruct
  → temperature: 0.1, num_predict: 500
  → Промпт: "Классифицируй запрос, выбери менеджера"
  → Ответ: JSON { manager_id, topic, urgency, reason }

Приоритет 3: Fallback (если Ollama недоступна)
  → Первый по KPI без LLM
```

**Ключевой момент:** Ollama вызывается **только** если нет личного менеджера. Это экономит токены и время.

---

## 4. Flow 2: Bitrix24 Webhook Setup

### 4.1. Что нам нужно сделать в Bitrix24

**Шаг 1:** Зарегистрировать обработчик событий (ОДИН РАЗ)

```bash
curl -X POST "https://YOUR-PORTAL.bitrix24.ru/rest/1/YOUR_WEBHOOK_CODE/event.bind" \
  -H "Content-Type: application/json" \
  -d '{
    "event": "ONOPENLINEMESSAGEADD",
    "handler": "https://n8n.kurumi.software/webhook/Citrix-leads"
  }'
```

**Важно:** Входящий webhook URL уже создан в n8n:
- Path: `Citrix-leads`
- Полный URL: `https://n8n.kurumi.software/webhook/Citrix-leads`
- Method: POST
- webhookId: `baedd24c-c368-4c83-bbbd-ea43a1eb9db9`

### 4.2. Какие события можно подписать

| Событие | Когда срабатывает | Для чего нужно |
|---------|-------------------|----------------|
| `ONOPENLINEMESSAGEADD` | Новое сообщение в Open Line | **ГЛАВНЫЙ** — запуск маршрутизации |
| `ONOPENLINESESSIONADD` | Новая сессия Open Line | Отслеживание начала диалога |
| `ONCRMLEADADD` | Новый лид в CRM | Синхронизация / кэширование |
| `ONCRMDEALADD` | Новая сделка | KPI расчёт |
| `ONTASKADD` | Новая задача | Уведомления менеджерам |

### 4.3. Формат входящего payload (ONOPENLINEMESSAGEADD)

```json
{
  "event": "ONOPENLINEMESSAGEADD",
  "data": {
    "ID": "12345",
    "MESSAGE": {
      "TEXT": "Привет, нужна консультация по этикетке",
      "AUTHOR_ID": "67890"
    },
    "USER_PHONE": "+375291234567",
    "USER_EMAIL": "client@example.com",
    "SESSION_ID": "54321",
    "CHANNEL_TYPE": "telegram",
    "FIELDS": {
      "ID": "99999"
    }
  },
  "ts": 1712678400
}
```

---

## 5. NestJS → Bitrix24 (прямые вызовы)

### 5.1. BitrixService — все методы

| Метод | Bitrix24 API | Параметры | Когда вызывается |
|-------|-------------|-----------|------------------|
| `createLead()` | `crm.lead.add` | TITLE, STATUS_ID, ASSIGNED_BY_ID, PHONE, EMAIL, COMMENTS | Новый клиент через маршрутизацию |
| `updateLead()` | `crm.lead.update` | id, fields (ASSIGNED_BY_ID, STATUS_ID) | Обновление назначения |
| `getLeads()` | `crm.lead.list` | filter, select, start (с пагинацией) | Sync leads cron |
| `getDeals()` | `crm.deal.list` | filter, select | KPI recalculate |
| `updateDeal()` | `crm.deal.update` | id, fields (ASSIGNED_BY_ID) | Переназначение сделки |
| `transferSession()` | `imopenlines.session.transfer` | sessionId, to (userId) | Передача диалога менеджеру |
| `getOpenSessions()` | `imopenlines.session.list` | filter (ACTIVE: Y) | Проверка открытых сессий |
| `sendMessage()` | `im.message.add` | dialogId, message { text } | Автоответ клиенту |
| `createTask()` | `tasks.task.add` | TITLE, DESCRIPTION, RESPONSIBLE_ID, DEADLINE | Создание задачи менеджеру |
| `addActivity()` | `crm.activity.add` | OWNER_TYPE_ID, OWNER_ID, TYPE_ID, SUBJECT | Логирование email/звонков |

### 5.2. Rate Limiting

Bitrix24 ограничивает **2 запроса/сек** (100 points/сек).

**Что уже реализовано:**
- Retry interceptor при HTTP 429/503 (задержка 500ms)
- Пагинация в `getLeads()` (батчи по 50)

**Что нужно добавить:**
- Throttling (задержка между вызовами)
- Batch метод для массовых операций (до 50 подзапросов за раз)

---

## 6. NestJS → n8n (N8nService)

### 6.1. Что вызывает NestJS

NestJS может триггерить n8n workflow через webhook:

```typescript
// N8nService (ещё не реализован)
async triggerWorkflow(name: string, data: any): Promise<void> {
  await axios.post(
    `https://n8n.kurumi.software/webhook/${name}`,
    data
  );
}
```

**Примеры использования:**
- После создания лида → триггерить n8n для доп. обработки
- После отправки mailing → триггерить n8n для отслеживания ответов
- Cron-задачи (если n8n сам не может запустить cron)

### 6.2. Текущее состояние

N8nService **ещё не реализован** в коде. Это следующий шаг.

---

## 7. Что нужно сделать (Gap Analysis)

### 7.1. n8n — что СДЕЛАНО vs что НУЖНО

| Workflow | Статус | Описание |
|----------|--------|----------|
| **"My workflow"** (AI анализ лидов) | ✅ Существует | Groq + Bitrix timeline, НЕ маршрутизация |
| **Routing workflow** | ❌ НЕ создан | Основной webhook → NestJS → Bitrix24 |
| **KPI Recalculate** | ❌ НЕ создан | Cron → NestJS /kpi/recalculate |
| **Leads Sync** | ❌ НЕ создан | Cron → NestJS /sync/leads |
| **Mailing** | ❌ НЕ создан | Cron → NestJS /mailing/candidates + /send |
| **Transfer Inactive** | ❌ НЕ создан | Cron → Bitrix24 sessions → NestJS /transfer |

### 7.2. Bitrix24 — что нужно настроить

| Задача | Статус | Как сделать |
|--------|--------|-------------|
| Event handler ONOPENLINEMESSAGEADD | ❌ НЕ зарегистрирован | `event.bind` через API |
| Event handler ONCRMDEALADD | ❌ НЕ зарегистрирован | `event.bind` (для KPI) |
| Webhook URL в .env | ⚠️ Нужен реальный | Заменить моковый на рабочий |

### 7.3. NestJS — что реализовано vs чего не хватает

| Модуль | Статус | Тесты | Примечание |
|--------|--------|-------|------------|
| Employees | ✅ | 12 тестов | CRUD, availability, personal manager |
| Routing | ✅ | 10 тестов | Personal → LLM → Fallback |
| KPI | ✅ | 11 тестов | Формула, recalculate, history |
| Mailing | ✅ | 10 тестов | Candidates, LLM email, send |
| Analytics | ✅ | 10 тестов | Funnel, rejections, managers |
| Sync | ✅ | 6 тестов | Bitrix → LeadCache |
| Bitrix | ✅ | Unit тесты | HTTP wrapper, retry logic |
| Ollama | ✅ | Unit тесты | Chat + Embed |
| **N8nService** | ❌ НЕ реализован | — | NestJS → n8n webhook calls |

---

## 8. Ollama qwen2.5 14b — Детали

### 8.1. Конфигурация

```
URL: http://YOUR_TAILSCALE_IP:11434 (Tailscale IP MacBook)
Model: qwen2.5:14b-instruct
Timeout: 15000ms
Temperature: 0.1 (детерминированный)
Max tokens: 500
```

### 8.2. Когда вызывается

1. **Маршрутизация** (RoutingService.routeMessage)
   - Промпт: классификация + выбор менеджера
   - Ответ: JSON { manager_id, topic, urgency, reason }

2. **Автоответ** (RoutingService.handleNoAvailableManagers)
   - Промпт: вежливый ответ "все заняты"
   - Ответ: текст сообщения клиенту

3. **Mailing** (MailingService.buildEmailPrompt)
   - Промпт: реактивационное письмо
   - Ответ: JSON { subject, body }

### 8.3. Fallback策略

Каждый вызов Ollama обёрнут в try/catch:
- `OllamaUnavailableException` → fallback логика
- Маршрутизация → первый по KPI
- Автоответ → шаблонный текст
- Mailing → шаблонное письмо

**Ollama НИКОГДА не крашит основной flow.**

---

## 9. План действий (приоритет)

### Шаг 1: Зарегистрировать Bitrix24 event handler
```bash
curl -X POST "https://YOUR-PORTAL.bitrix24.ru/rest/1/YOUR_WEBHOOK_CODE/event.bind" \
  -H "Content-Type: application/json" \
  -d '{"event": "ONOPENLINEMESSAGEADD", "handler": "https://n8n.kurumi.software/webhook/Citrix-leads"}'
```

### Шаг 2: Создать Routing workflow в n8n
Через n8n API (PUT /api/v1/workflows) или через UI:
- Webhook → Code (extract) → HTTP (NestJS) → IF → Bitrix24 actions

### Шаг 3: Создать cron workflows
- KPI Recalculate (daily 00:00)
- Leads Sync (hourly)
- Mailing (daily 09:00)
- Transfer Inactive (every 5 min)

### Шаг 4: Реализовать N8nService
NestJS сервис для вызова n8n webhooks.

### Шаг 5: E2E тестирование
Bitrix24 → n8n → NestJS → Ollama → Bitrix24

---

## 10. Ссылки

- [Bitrix24 REST API Docs](https://apidocs.bitrix24.ru/)
- [n8n API Reference](./n8n-api-reference.md)
- [AGENTS.md](../AGENTS.md) — полная спецификация проекта
- [N8N_GUIDE.md](../N8N_GUIDE.md) — предыдущий гайд по n8n
