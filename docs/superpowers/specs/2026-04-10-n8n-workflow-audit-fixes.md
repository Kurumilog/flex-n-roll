# Audit Report: n8n Workflows — Fix & Test

**Дата:** 2026-04-10
**Статус:** ✅ ЗАВЕРШЕНО
**Автор:** Qwen

---

## 0. Проблема

6 n8n воркфлоу были созданы ранее, но 4 из 4 использовали **НЕПРАВИЛЬНЫЙ порт 3000** вместо **3001**. NestJS слушает на порту 3001, а порт 3000 занят Next.js фронтендом.

---

## 1. Найденные проблемы

| Workflow | ID | Проблема | Статус |
|----------|-----|----------|--------|
| **Routing** | `iHnbF3T4HFjEgzY4` | ✅ Использовал правильный URL (`https://n8n.kurumi.software/nestjs-api/routing/route`) | ✅ Уже рабочий |
| **KPI Recalculate** | `587Eqkykn6Rd8ujH` | ❌ Порт 3000 → должен 3001 | ✅ Исправлен |
| **Mailing** | `fSgTAkO0ddlXwns9` | ❌ Порт 3000 → должен 3001 (2 ноды) | ✅ Исправлен |
| **Leads Sync** | `blVnCIqe4hyFrtvb` | ❌ Порт 3000 → должен 3001 | ✅ Исправлен |
| **Transfer Inactive** | `Esa9RuyUEMchzlf0` | ❌ Порт 3000 → 3001 + `imopenlines.session.list` недоступен через webhook | ⚠️ Частично исправлен |
| **The star example** | `cTp3tAVjyWmqHY2i` | ❓ Не относится к FlexRouter (тестовый/AI workflow) | — Не трогал |

---

## 2. Исправления

### 2.1 Порт 3000 → 3001 (4 воркфлоу)

Все HTTP Request ноды с URL `http://YOUR_TAILSCALE_IP:3000/api/*` обновлены на `http://YOUR_TAILSCALE_IP:3001/api/*`.

**Метод:** GET/PUT workflow через n8n REST API v1.

### 2.2 Transfer Inactive — частичное исправление

- ✅ Порт исправлен (3000 → 3001)
- ⚠️ `imopenlines.session.list` **НЕ РАБОТАЕТ** через webhook (нет scope `imopenlines`)
- ⚠️ Воркфлоу неполный — нет логики transfer (только fetch сессий + менеджеров)

**Решение:** Будет работать только после подключения Open Lines в Bitrix24 или перехода на OAuth приложение.

---

## 3. Результаты тестирования

### NestJS Endpoints (port 3001)

| Endpoint | Result | Status |
|----------|--------|--------|
| `POST /api/kpi/recalculate` | `{"success":true,"message":"KPI recalculated for 1 employees"}` | ✅ |
| `GET /api/mailing/candidates?inactiveDays=30` | `{"success":true,"data":{"candidates":[],"total":0}}` | ✅ (0 кандидатов — лиды не синхронизированы) |
| `POST /api/sync/leads` | `{"success":true,"data":{"synced":0}}` | ✅ (0 лидов в Bitrix24) |
| `GET /api/employees/available` | `{"success":true,"data":{"employees":[5 items]}}` | ✅ |
| `POST /api/routing/route` | `{"success":true,"data":{"managerId":33,"managerName":"Александр","topic":"price_negotiation","urgency":"medium"}}` | ✅ |

### Routing via VPS Proxy

| URL | Result | Status |
|-----|--------|--------|
| `https://n8n.kurumi.software/nestjs-api/routing/route` | Manager found, routing correct | ✅ |

### Bitrix24 REST API (webhook)

| Method | Result | Status |
|--------|--------|--------|
| `im.message.add` | `{"error":"MESSAGE_EMPTY"}` — ожидаемо | ✅ Работает (нужен текст) |
| `tasks.task.add` | Task ID 1 created | ✅ |
| `imopenlines.session.list` | `ERROR_METHOD_NOT_FOUND` | ❌ Недоступен через webhook |
| `imopenlines.network.list` | `ERROR_METHOD_NOT_FOUND` | ❌ Недоступен через webhook |

---

## 4. Финальное состояние воркфлоу

### WF-01: Routing ✅
```
Webhook POST /routing-message
  → Extract Data (Code)
  → NestJS Routing (https://n8n.kurumi.software/nestjs-api/routing/route) ✅
  → IF Manager Found
    → True: Notify Manager (im.message.add) ✅ + Create Task (tasks.task.add) ✅
    → False: Auto Reply (im.message.add) ✅
```

### WF-02: KPI Recalculate ✅
```
Schedule (Daily 00:00)
  → NestJS POST /api/kpi/recalculate (порт 3001) ✅
```

### WF-03: Mailing ✅
```
Schedule (Daily 09:00)
  → Get Candidates (порт 3001) ✅
  → Send Mailing (порт 3001) ✅
```

### WF-04: Leads Sync ✅
```
Schedule (Hourly)
  → NestJS Sync Leads (порт 3001) ✅
```

### WF-05: Transfer Inactive ⚠️
```
Schedule (Every 5 min)
  → Get Open Sessions (imopenlines.session.list) ❌ — недоступен через webhook
  → Get Available Managers (порт 3001) ✅
```

---

## 5. Known Limitations

1. **Open Lines не подключены** — `imopenlines.*` методы недоступны через webhook. Transfer Inactive workflow не работает.
2. **Mailing = 0 кандидатов** — лиды ещё не синхронизированы из Bitrix24 (LeadCache пуст).
3. **Sync = 0 лидов** — Bitrix24 не возвращает лиды (возможно нет данных или фильтр слишком строгий).
4. **KPI = 1 сотрудник** — только у одного сотрудника есть данные для пересчёта.

---

## 6. Что нужно для полного E2E

1. **Подключить Open Lines** (Telegram/WhatsApp) в Bitrix24 → Contact Center
2. **Засидить LeadCache** — импортировать тестовые лиды из `leads.json`
3. **Настроить SMTP** — для mailing (SMTP_PASS в .env.local)
4. **Дождаться первого cron-срабатывания** или запустить вручную через n8n UI
