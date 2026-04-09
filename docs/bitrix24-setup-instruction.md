# Инструкция: Настройка Bitrix24 для FlexRouter AI

> **Дата:** 2026-04-09
> **Портал:** `hackathon-team-xx.bitrix24.ru`
> **Текущий webhook:** `https://b24-p0ujtw.bitrix24.ru/rest/1/9591mae2cb8qecvt/`
> **Текущие scope:** `crm`, `user` — **НЕДОСТАТОЧНО**

---

## Проблема

Текущий исходящий вебхук имеет только scope `crm` и `user`. Для полной работы FlexRouter AI нужны:

| Scope | Зачем | Методы |
|-------|-------|--------|
| `crm` | ✅ Уже есть | `crm.lead.list`, `crm.lead.add`, `crm.lead.update` |
| `user` | ✅ Уже есть | `user.current` |
| `imopenlines` | ❌ Нет | `imopenlines.session.transfer`, `imopenlines.session.list` |
| `im` | ❌ Нет | `im.message.add` (автоответ) |
| `task` | ❌ Нет | `tasks.task.add` |
| `entity` | Опционально | Создание сущностей в CRM |

**Два варианта решения:**
1. **Исходящий вебхук** (проще, но ограничен) — через UI Bitrix24
2. **Локальное приложение** (полный доступ) — через OAuth

---

## Вариант 1: Исходящий вебхук (Рекомендуемый для hackathon)

> ⏱ Время: 5 минут

### Шаг 1: Открой Bitrix24

1. Зайди в `hackathon-team-xx.bitrix24.ru`
2. Убедись что ты **администратор** портала
3. Перейди: **Разработчикам** → **Другое** → **Исходящий вебхук**
   - Или напрямую: `https://hackathon-team-xx.bitrix24.ru/marketplace/hook/`

### Шаг 2: Создай новый вебхук

1. Нажми **Создать вебхук** (или обнови существующий)
2. В поле **URL обработчика** вставь:
   ```
   https://n8n.kurumi.software/webhook/routing-message
   ```
3. **Выбери события** (галочки):
   - ☑️ `ONIMCONNECTORMESSAGEADD` — сообщение из Open Line (Telegram/WhatsApp)
   - ☑️ `ONOPENLINEMESSAGEADD` — альтернативное событие Open Line
   - ☑️ `OnCrmLeadAdd` — новый лид
   - ☑️ `OnCrmLeadUpdate` — обновление лида
   - ☑️ `OnCrmDealAdd` — новая сделка
   - ☑️ `OnCrmDealUpdate` — обновление сделки

4. **Выбери права доступа** (scope):
   - ☑️ **CRM** — чтение/запись лидов и сделок
   - ☑️ **Пользователь** — информация о пользователях
   - ☑️ **Open Channels (Чат и поддержки)** — работа с диалогами Open Lines
   - ☑️ **Сообщения и чаты** — отправка сообщений
   - ☑️ **Задачи** — создание задач для менеджеров

5. Нажми **Сохранить**

### Шаг 3: Скопируй новый URL вебхука

После сохранения Bitrix24 покажет URL вида:
```
https://hackathon-team-xx.bitrix24.ru/rest/1/XXXXXXXXXXXXX/
```

**Скопируй этот URL** — он понадобится для обновления `.env.local`.

### Шаг 4: Обнови .env.local

На твоём сервере:
```bash
cd /home/kurumi/code/hackathon/Flexnroll/apps/api
nano .env.local
```

Обнови:
```env
BITRIX24_WEBHOOK_URL=https://hackathon-team-xx.bitrix24.ru/rest/1/XXXXXXXXXXXXX/
```

Перезапусти NestJS:
```bash
pkill -f "nest start" && pnpm dev
```

---

## Вариант 2: Локальное приложение (Полный OAuth доступ)

> ⏱ Время: 15 минут
> Нужно если webhook не даёт нужных scope

### Шаг 1: Создай приложение

1. Зайди в `hackathon-team-xx.bitrix24.ru`
2. Перейди: **Маркетплейс** → **Разработчикам** → **Создать приложение**
   - Или: `https://hackathon-team-xx.bitrix24.ru/marketplace/app/`
3. Выбери тип: **Локальное приложение**
4. Заполни:
   - **Название:** `FlexRouter AI`
   - **Описание:** `Автоматическая маршрутизация входящих обращений`

### Шаг 2: Настрой права доступа

В разделе **Права доступа (Scope)** выбери:
- ☑️ **CRM**
- ☑️ **Пользователь**  
- ☑️ **Open Channels (Чат и поддержки)**
- ☑️ **Сообщения и чаты**
- ☑️ **Задачи**

### Шаг 3: Получи Client ID и Secret

После создания приложение покажет:
- **Client ID:** `local.xxxxx.xxxxx`
- **Client Secret:** `xxxxxxxxxxxxxxxx`

### Шаг 4: Получи OAuth токен

Выполни в браузере:
```
https://hackathon-team-xx.bitrix24.ru/oauth/authorize?client_id=LOCAL_CLIENT_ID&response_type=code
```

Нажми **Разрешить** → получишь `code` в URL.

Обменяй code на token:
```bash
curl -X POST "https://hackathon-team-xx.bitrix24.ru/oauth/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=authorization_code" \
  -d "client_id=LOCAL_CLIENT_ID" \
  -d "client_secret=LOCAL_CLIENT_SECRET" \
  -d "code=CODE_FROM_REDIRECT"
```

Получишь:
```json
{
  "access_token": "xxxxx",
  "refresh_token": "xxxxx",
  "expires_in": 3600,
  "scope": "crm,imopenlines,im,task,user",
  "domain": "hackathon-team-xx.bitrix24.ru"
}
```

### Шаг 5: Зарегистрируй event handler

```bash
curl -X POST "https://hackathon-team-xx.bitrix24.ru/rest/event.bind" \
  -H "Content-Type: application/json" \
  -d '{
    "auth": "ACCESS_TOKEN",
    "event": "ONIMCONNECTORMESSAGEADD",
    "handler": "https://n8n.kurumi.software/webhook/routing-message"
  }'
```

Повтори для каждого события:
- `ONIMCONNECTORMESSAGEADD`
- `ONOPENLINEMESSAGEADD`
- `OnCrmLeadAdd`
- `OnCrmLeadUpdate`
- `OnCrmDealAdd`
- `OnCrmDealUpdate`

### Шаг 6: Обнови n8n workflow

В каждом n8n HTTP Request node для Bitrix24 замени URL:
```
# Было (webhook):
https://b24-p0ujtw.bitrix24.ru/rest/1/9591mae2cb8qecvt/imopenlines.session.transfer

# Стало (OAuth):
https://hackathon-team-xx.bitrix24.ru/rest/imopenlines.session.transfer
```

И добавь параметр `auth` в body:
```json
{
  "auth": "ACCESS_TOKEN",
  "id": "...",
  "to": "..."
}
```

---

## Проверка работоспособности

### 1. Проверь webhook URL

```bash
# Должен вернуть информацию о портале
curl -s "https://hackathon-team-xx.bitrix24.ru/rest/1/XXXXXXXXXXXXX/profile.json" | jq .
```

### 2. Проверь Open Lines подключение

```bash
# Должен вернуть список открытых линий
curl -s -X POST "https://hackathon-team-xx.bitrix24.ru/rest/1/XXXXXXXXXXXXX/imopenlines.network.list" \
  -H "Content-Type: application/json" | jq .
```

### 3. Проверь регистрацию event handler

```bash
# Для webhook — список обработчиков недоступен через webhook API
# Для OAuth приложения:
curl -s -X POST "https://hackathon-team-xx.bitrix24.ru/rest/event.list" \
  -H "Content-Type: application/json" \
  -d '{"auth": "ACCESS_TOKEN", "event": "ONIMCONNECTORMESSAGEADD"}' | jq .
```

### 4. Полный тест

1. Отправь сообщение в Telegram/WhatsApp подключённый к Open Lines
2. Bitrix24 должен вызвать `https://n8n.kurumi.software/webhook/routing-message`
3. n8n → NestJS → Ollama → обратно
4. В Bitrix24 должен появиться диалог, назначенный менеджеру

---

## Что делает каждый метод Bitrix24

### imopenlines.session.transfer
Передаёт открытый диалог от бота/очереди к конкретному менеджеру.

**Параметры:**
```json
{
  "id": "SESSION_ID",       // ID сессии из ONIMCONNECTORMESSAGEADD.DIALOG.ID
  "to": MANAGER_BITRIX_ID   // Bitrix24 ID менеджера (из Employee.id)
}
```

### im.message.add
Отправляет сообщение в диалог (для автоответа когда нет менеджеров).

**Параметры:**
```json
{
  "DIALOG_ID": "SESSION_ID",
  "MESSAGE": "Текст автоответа"
}
```

### tasks.task.add
Создаёт задачу для менеджера с описанием обращения.

**Параметры:**
```json
{
  "fields": {
    "TITLE": "Новое обращение: technical_specs",
    "DESCRIPTION": "Тема: technical_specs\nСрочность: high\n\nСообщение:\n...",
    "RESPONSIBLE_ID": MANAGER_BITRIX_ID,
    "DEADLINE": "2026-04-10T10:00:00+03:00"
  }
}
```

### crm.lead.add
Создаёт лид если клиент новый (нет в CRM).

**Параметры:**
```json
{
  "fields": {
    "TITLE": "Имя клиента - Открытая линия",
    "NAME": "Имя",
    "PHONE": [{ "VALUE": "+375291234567", "VALUE_TYPE": "WORK" }],
    "ASSIGNED_BY_ID": MANAGER_BITRIX_ID,
    "SOURCE_ID": "telegram"
  }
}
```

---

## Troubleshooting

### WRONG_AUTH_TYPE
Метод недоступен для текущего типа авторизации.
- **Решение:** Добавь нужный scope в webhook или используй OAuth приложение.

### ERROR_METHOD_NOT_FOUND
Метод не существует или нет прав.
- **Решение:** Проверь что scope `imopenlines` добавлен.

### Webhook не вызывается
1. Проверь что URL доступен из интернета: `curl https://n8n.kurumi.software/webhook/routing-message`
2. Проверь что n8n workflow активен
3. Проверь логи n8n: executions

### Событие не приходит
1. Open Lines должен быть подключён в Bitrix24 (Telegram/WhatsApp)
2. Событие должно быть выбрано в настройках webhook
3. Проверь очередь событий: `event.offline.list`

---

## Рекомендация

**Для hackathon используй Вариант 1 (Исходящий вебхук)** — быстрее и проще.

Создай новый вебхук с полными правами (CRM + Пользователь + Open Channels + Сообщения + Задачи) и обнови `BITRIX24_WEBHOOK_URL` в `.env.local`.
