# n8n API Reference & Workflow Guide

> **Instance:** https://n8n.kurumi.software
> **API Key:** `<rotate-a-fresh-n8n-api-key>`
> **Note:** the previously documented JWT has expired; generate a new key in n8n Settings > n8n API and keep it outside git.
> **Auth Header:** `X-N8N-API-KEY: <API_KEY>`
>
> **Updated:** 2026-04-09 — All 6 workflows created and active

---

## API Endpoints

### List all workflows
```bash
GET https://n8n.kurumi.software/api/v1/workflows
```

### Get workflow by ID
```bash
GET https://n8n.kurumi.software/api/v1/workflows/{id}
```

### Update workflow (PUT)
```bash
PUT https://n8n.kurumi.software/api/v1/workflows/{id}
Content-Type: application/json
X-N8N-API-KEY: <API_KEY>

{
  "name": "My workflow",
  "nodes": [...],
  "connections": {...},
  "settings": {"executionOrder": "v1"}
}
```

**Required fields for PUT:**
- `name` (string) — обязательное
- `nodes` (array) — массив узлов
- `connections` (object) — связи между узлами
- `settings` (object) — минимально `{"executionOrder": "v1"}`

**Не передавать в PUT:**
- `meta` — добавляется сервером автоматически
- `pinData` — добавляется сервером
- `activeVersion` — управляется отдельно
- `shared`, `tags`, `versionId`, `activeVersionId` и т.д.

---

## Node Structure

### Основные типы узлов

| Тип | Описание | Пример |
|-----|----------|--------|
| `n8n-nodes-base.webhook` | Webhook триггер | POST /webhook/message |
| `n8n-nodes-base.httpRequest` | HTTP Request | GET/POST к внешним API |
| `@n8n/n8n-nodes-langchain.chainLlm` | LLM Chain | AI анализ текста |
| `@n8n/n8n-nodes-langchain.lmChatGroq` | Groq Chat Model | qwen/qwen3-32b |
| `@n8n/n8n-nodes-langchain.mcpTrigger` | MCP Server Trigger | AI управление через MCP |

### HTTP Request Node — пример конфигурации

#### GET запрос с заголовками
```json
{
  "parameters": {
    "method": "GET",
    "url": "http://100.80.124.27:3000/api/employees/available",
    "sendHeaders": true,
    "headerParameters": {
      "parameters": [
        {"name": "x-api-key", "value": "dev-secret-key-change-in-production"}
      ]
    },
    "options": {
      "response": {
        "response": {
          "neverError": true
        }
      }
    }
  },
  "type": "n8n-nodes-base.httpRequest",
  "typeVersion": 4.4,
  "position": [976, 0],
  "id": "unique-uuid-here",
  "name": "Log Available Managers",
  "onError": "continueRegularOutput"
}
```

#### POST запрос с multipart body
```json
{
  "parameters": {
    "method": "POST",
    "url": "https://b24-p0ujtw.bitrix24.ru/rest/1/9591mae2cb8qecvt/crm.timeline.item.ad",
    "sendBody": true,
    "contentType": "multipart-form-data",
    "bodyParameters": {
      "parameters": [
        {"name": "fields[ENTITY_ID]", "value": "={{ $node[\"Webhook\"].json.body[\"data[FIELDS][ID]\"] }}"},
        {"name": "fields[COMMENTS]", "value": "={{ /* JavaScript expression */ }}"},
        {"name": "fields[ENTITY_TYPE_ID]", "value": "lead"}
      ]
    },
    "options": {}
  },
  "type": "n8n-nodes-base.httpRequest",
  "typeVersion": 4.4,
  "position": [768, 0],
  "id": "unique-uuid-here",
  "name": "HTTP Request1"
}
```

---

## Connections

### Структура connections

```json
{
  "connections": {
    "Source Node Name": {
      "main": [
        [
          {
            "node": "Target Node Name",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  }
}
```

**Важно:**
- `main` — основной выход узла
- `ai_languageModel` — подключение модели к LLM Chain
- Массивы вложенные: `main: [[{...}]]` (двойной массив)

### Пример: ветвление
```json
{
  "HTTP Request1": {
    "main": [[{"node": "Log Available Managers", "type": "main", "index": 0}]]
  }
}
```

### Пример: AI модель
```json
{
  "Groq Chat Model": {
    "ai_languageModel": [[{"node": "Basic LLM Chain", "type": "ai_languageModel", "index": 0}]]
  }
}
```

---

## Current Workflows

### ✅ 1. "My workflow" (ID: cTp3tAVjyWmqHY2i) — AI Lead Analysis
**Статус:** Активен ✅
**Триггер:** Webhook POST `/Citrix-leads` + MCP
**Flow:** Webhook → Bitrix crm.lead.get → Groq AI → Bitrix timeline.add → Log Managers

### ✅ 2. "FlexRouter — Routing" (ID: iHnbF3T4HFjEgzY4) — MAIN ROUTING
**Статус:** Активен ✅
**Триггер:** Webhook POST `/routing-message`
**Flow:** Webhook → Extract Data → NestJS /routing/route → IF → Transfer Session + Task OR Auto Reply

### ✅ 3. "FlexRouter — KPI Recalculate" (ID: 587Eqkykn6Rd8ujH)
**Статус:** Активен ✅
**Триггер:** Cron daily 00:00
**Flow:** Schedule → NestJS POST /api/kpi/recalculate

### ✅ 4. "FlexRouter — Leads Sync" (ID: blVnCIqe4hyFrtvb)
**Статус:** Активен ✅
**Триггер:** Cron hourly
**Flow:** Schedule → NestJS POST /api/sync/leads

### ✅ 5. "FlexRouter — Mailing" (ID: fSgTAkO0ddlXwns9)
**Статус:** Активен ✅
**Триггер:** Cron daily 09:00
**Flow:** Schedule → Get Candidates → NestJS POST /api/mailing/send

### ✅ 6. "FlexRouter — Transfer Inactive" (ID: Esa9RuyUEMchzlf0)
**Статус:** Активен ✅
**Триггер:** Cron every 5 minutes
**Flow:** Schedule → Bitrix sessions.list → NestJS GET /employees/available

---

## Common Commands

### List workflows (compact)
```bash
curl -s -X GET "https://n8n.kurumi.software/api/v1/workflows" \
  -H "X-N8N-API-KEY: <API_KEY>" \
  -H "Content-Type: application/json" | jq '.[] | {id, name, active}'
```

### Get workflow nodes
```bash
curl -s -X GET "https://n8n.kurumi.software/api/v1/workflows/{id}" \
  -H "X-N8N-API-KEY: <API_KEY>" \
  -H "Content-Type: application/json" | jq '[.nodes[] | {name, type: (.type | split(".") | last), position}]'
```

### Save workflow to file
```bash
curl -s -X GET "https://n8n.kurumi.software/api/v1/workflows/{id}" \
  -H "X-N8N-API-KEY: <API_KEY>" \
  -H "Content-Type: application/json" > /tmp/n8n-workflow.json
```

---

## Tips & Gotchas

### ✅ ПРАВИЛЬНО:
- Использовать `PUT` для обновления workflow (нет PATCH)
- Включать `name`, `nodes`, `connections`, `settings` в body
- Генерировать новые UUID для новых узлов (`uuidgen` или random v4)
- Позиции узлов: `[x, y]` — сдвиг на 200-250px для следующего
- `onError: "continueRegularOutput"` — не ломает workflow при ошибке

### ❌ НЕПРАВИЛЬНО:
- Передавать `meta`, `pinData`, `activeVersion` в PUT body
- Пытаться использовать PATCH — только PUT
- Забыть `name` — обязательное поле
- Дублировать ID узлов — каждый узел должен иметь уникальный UUID

### Positioning
- Основной flow: `[0, 0] → [208, 0] → [416, 0] → [768, 0] → [976, 0]`
- Вспомогательные узлы (модели): `[352, 208]` (ниже основного flow)
- MCP Trigger: `[16, 256]` (отдельная ветка)

---

## Architecture Context

### n8n Instance Location
- **Хостится:** MacBook M4 (друг) — 100.94.92.23:5678
- **Доступ:** Через VPS kurumi.software (Nginx + SSL + Tailscale)
- **Публичный URL:** https://n8n.kurumi.software

### NestJS Access from n8n
- **NestJS URL:** `http://100.80.124.27:3000` (Tailscale IP)
- **API Key:** `dev-secret-key-change-in-production` (из .env)
- **Header:** `x-api-key: <API_SECRET_KEY>`

### Bitrix24 Access
- **Webhook:** `https://b24-p0ujtw.bitrix24.ru/rest/1/9591mae2cb8qecvt`
- **Methods:** crm.lead.get, crm.timeline.item.ad, imopenlines.session.transfer, и т.д.

---

## Adding New Node — Checklist

1. Получить текущий workflow: `GET /api/v1/workflows/{id}`
2. Сохранить в файл для бэкапа
3. Создать новый узел с уникальным UUID
4. Добавить узел в массив `nodes`
5. Добавить connection в `connections`
6. Убедиться что `position` не перекрывается
7. PUT обновить workflow
8. Проверить что узел появился: `GET /api/v1/workflows/{id}` | jq nodes

---

## References
- [n8n API Docs](https://docs.n8n.io/api/)
- [n8n Node Reference](https://docs.n8n.io/integrations/builtin/core-nodes/)
- [HTTP Request Node](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.httprequest/)
