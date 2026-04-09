# n8n Workflow Guide — FlexRouter AI

## 1. Запуск n8n локально

```bash
# Если ещё не запущен:
n8n start --tunnel
```

Открой http://localhost:5678 в браузере.

---

## 2. Workflow 1: Routing (Bitrix24 → NestJS → Менеджер)

Это основной воркфлоу. Клиент пишет → Bitrix24 шлёт webhook → n8n вызывает NestJS → NestJS через Ollama выбирает менеджера → n8n передаёт сессию.

### Шаги:

#### Шаг 1: Webhook Trigger
- **Node:** Webhook
- **Method:** POST
- **Path:** `webhook/message`
- **Authentication:** None (для теста)
- **Response Mode:** Last Node

#### Шаг 2: Extract data
- **Node:** Code (или Set)
- **Извлекаем из `{{$json.body}}`:**
  ```javascript
  return [{
    json: {
      messageText: $json.body.MESSAGE?.TEXT || $json.body.text || "Нет текста",
      clientPhone: $json.body.USER_PHONE || "",
      clientEmail: $json.body.USER_EMAIL || "",
      sessionId: $json.body.SESSION_ID || "",
      eventId: $json.body.id || `event-${Date.now()}`,
      channel: $json.body.CHANNEL_TYPE || "email"
    }
  }]
  ```

#### Шаг 3: HTTP Request → NestJS Routing
- **Node:** HTTP Request
- **Method:** POST
- **URL:** `http://localhost:3001/api/routing/route`
- **Authentication:** Header Auth
  - Name: `x-api-key`
  - Value: `dev-secret-key-change-in-production`
- **Body:** JSON
  ```json
  {
    "messageText": "{{$json.messageText}}",
    "channel": "{{$json.channel}}",
    "clientPhone": "{{$json.clientPhone}}",
    "clientEmail": "{{$json.clientEmail}}",
    "clientBitrixId": "{{$json.sessionId}}",
    "eventId": "{{$json.eventId}}"
  }
  ```
- **Options:**
  - Response Format: JSON
  - Timeout: 30000

#### Шаг 4: IF — есть менеджер?
- **Node:** IF
- **Condition:** `{{ $json.data.managerId != null }}`
- **True branch:** → Шаг 5
- **False branch:** → Шаг 7 (автоответ)

#### Шаг 5: Bitrix24 — Transfer Session
- **Node:** HTTP Request
- **Method:** POST
- **URL:** `https://b24-p0ujtw.bitrix24.ru/rest/1/9591mae2cb8qecvt/imopenlines.session.transfer`
- **Body:** Form Data
  ```
  id: {{$json.data.managerId}}
  to: {{$json.data.managerId}}
  ```
  *(Примечание: ID сессии нужно получить из шага 1, поле SESSION_ID или аналог)*

#### Шаг 6: Bitrix24 — Create Task
- **Node:** HTTP Request
- **Method:** POST
- **URL:** `https://b24-p0ujtw.bitrix24.ru/rest/1/9591mae2cb8qecvt/tasks.task.add`
- **Body:** JSON
  ```json
  {
    "fields": {
      "TITLE": "Новое обращение: {{$json.data.topic}}",
      "DESCRIPTION": "Клиент: {{$json.clientPhone}}\nТема: {{$json.data.topic}}\nСрочность: {{$json.data.urgency}}\n\nСообщение:\n{{$json.messageText}}\n\nОбоснование:\n{{$json.data.reason}}",
      "RESPONSIBLE_ID": {{$json.data.managerId}},
      "DEADLINE": "{{$now.plus(1, 'day').toISO()}}"
    }
  }
  ```

#### Шаг 7: Автоответ (нет менеджеров)
- **Node:** HTTP Request
- **Method:** POST
- **URL:** `https://b24-p0ujtw.bitrix24.ru/rest/1/9591mae2cb8qecvt/im.message.add`
- **Body:** JSON
  ```json
  {
    "dialogId": "{{$json.sessionId}}",
    "message": {
      "text": "{{$json.data.autoReplyText || 'Все специалисты заняты. Мы ответим вам в следующий рабочий день до 10:00.'}}"
    }
  }
  ```

#### Шаг 8: Response (возврат в Bitrix24)
- **Node:** Respond to Webhook
- **Response Body:**
  ```json
  {
    "success": true,
    "managerId": {{$json.data.managerId}},
    "managerName": "{{$json.data.managerName}}",
    "topic": "{{$json.data.topic}}"
  }
  ```

---

## 3. Workflow 2: KPI Recalculate (Cron)

- **Node:** Schedule Trigger
  - Mode: Cron
  - Cron: `0 0 * * *` (каждый день в полночь)
- **Node:** HTTP Request
  - Method: POST
  - URL: `http://localhost:3001/api/kpi/recalculate`
  - Auth: Header `x-api-key: dev-secret-key-change-in-production`

---

## 4. Workflow 3: Leads Sync (Cron каждый час)

- **Node:** Schedule Trigger
  - Mode: Cron
  - Cron: `0 * * * *`
- **Node:** HTTP Request
  - Method: POST
  - URL: `http://localhost:3001/api/sync/leads`
  - Auth: Header `x-api-key: dev-secret-key-change-in-production`

---

## 5. Workflow 4: Mailing (Cron 09:00)

- **Node:** Schedule Trigger
  - Mode: Cron
  - Cron: `0 9 * * *`
- **Node:** HTTP Request (Get Candidates)
  - Method: GET
  - URL: `http://localhost:3001/api/mailing/candidates?inactiveDays=30&limit=50`
  - Auth: Header `x-api-key: dev-secret-key-change-in-production`
- **Node:** HTTP Request (Send Mailing)
  - Method: POST
  - URL: `http://localhost:3001/api/mailing/send`
  - Body: JSON
    ```json
    {
      "leadIds": ["{{$json.leadId}}"],
      "channel": "email"
    }
    ```
  - Auth: Header `x-api-key: dev-secret-key-change-in-production`
- **Node:** Loop (Split Out) для обработки каждого кандидата

---

## 6. Как тестировать БЕЗ Bitrix24 webhook

Если Bitrix24 не может отправить webhook на localhost, протестируй вручную:

### Вариант A: curl прямо в NestJS
```bash
# Маршрутизация через Ollama
curl -s -X POST http://localhost:3001/api/routing/route \
  -H "Content-Type: application/json" \
  -H "x-api-key: dev-secret-key-change-in-production" \
  -d '{
    "messageText": "Добрый день, нужна консультация по термоусадочной этикетке для молочной продукции. Тираж 100 000 шт.",
    "channel": "email",
    "clientEmail": "client@example.com"
  }' | python3 -m json.tool
```

### Вариант B: n8n → curl
1. Создай воркфлоу в n8n
2. Первый нод — **Manual Trigger** (вместо Webhook)
3. Второй нод — **HTTP Request** → NestJS `/api/routing/route`
4. Нажми "Test workflow" в n8n

### Вариант C: ngrok (если нужен внешний URL)
```bash
# Установи ngrok
brew install ngrok

# Создай туннель к n8n
ngrok http 5678

# Скопируй URL (напр. https://xxxx.ngrok.io)
# Используй его как webhook URL в Bitrix24
```

---

## 7. Настройка Bitrix24 webhook

### 7.1. Создание входящего webhook
1. Открой https://b24-p0ujtw.bitrix24.ru
2. Приложения → Вебхуки → Добавить webhook
3. Права: `crm`, `im`, `imopenlines`, `task`, `user`
4. Скопируй URL: `https://b24-p0ujtw.bitrix24.ru/rest/1/9591mae2cb8qecvt/`

### 7.2. Регистрация event handler
```bash
# Через curl зарегистрировать обработчик событий
curl -X POST "https://b24-p0ujtw.bitrix24.ru/rest/1/9591mae2cb8qecvt/event.bind" \
  -H "Content-Type: application/json" \
  -d '{
    "event": "ONOPENLINEMESSAGEADD",
    "handler": "https://ВАШ_NGROK_URL.ngrok.io/webhook/message"
  }'
```

Или через n8n:
1. Node: HTTP Request
2. URL: `https://b24-p0ujtw.bitrix24.ru/rest/1/9591mae2cb8qecvt/event.bind`
3. Method: POST
4. Body JSON:
   ```json
   {
     "event": "ONOPENLINEMESSAGEADD",
     "handler": "https://ВАШ_NGROK_URL.ngrok.io/webhook/message"
   }
   ```

---

## 8. Import n8n workflow (JSON)

Можешь импортировать этот JSON в n8n → Import from File:

```json
{
  "nodes": [
    {
      "parameters": {},
      "id": "manual-trigger",
      "name": "Manual Trigger",
      "type": "n8n-nodes-base.manualTrigger",
      "typeVersion": 1,
      "position": [250, 300]
    },
    {
      "parameters": {
        "url": "http://localhost:3001/api/routing/route",
        "method": "POST",
        "authentication": "genericCredentialType",
        "genericAuthType": "httpHeaderAuth",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "x-api-key",
              "value": "dev-secret-key-change-in-production"
            }
          ]
        },
        "sendBody": true,
        "bodyParameters": {
          "parameters": [
            {
              "name": "messageText",
              "value": "Нужен расчёт на этикетку 58х40мм, тираж 50000 шт"
            },
            {
              "name": "channel",
              "value": "email"
            },
            {
              "name": "clientEmail",
              "value": "test@example.com"
            }
          ]
        },
        "options": {}
      },
      "id": "http-request",
      "name": "NestJS Routing",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [450, 300]
    },
    {
      "parameters": {
        "options": {}
      },
      "id": "respond-webhook",
      "name": "Result",
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1,
      "position": [650, 300]
    }
  ],
  "connections": {
    "Manual Trigger": {
      "main": [
        [
          {
            "node": "NestJS Routing",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "NestJS Routing": {
      "main": [
        [
          {
            "node": "Result",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  },
  "meta": {
    "templateId": "1",
    "instanceId": ""
  }
}
```

---

## 9. Чеклист тестирования

### Локально (без VPS):
- [ ] `GET /api/employees/available` → 23 сотрудника
- [ ] `POST /api/routing/route` → AI выбирает менеджера через Ollama
- [ ] `GET /api/analytics/managers` → список менеджеров
- [ ] n8n workflow → ручной запуск → NestJS → результат

### Полная цепочка (с VPS или ngrok):
- [ ] Bitrix24 webhook → n8n → NestJS → Bitrix24 transfer
- [ ] Клиент пишет в Telegram → Bitrix24 → n8n → NestJS → менеджер получает диалог
- [ ] KPI recalculate (cron)
- [ ] Mailing (cron)
- [ ] Sync leads (cron)
