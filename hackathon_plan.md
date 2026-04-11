# FlexRouter AI — План хакатона

## Описание проекта

**Название:** FlexRouter AI  
**Клиент:** Flex-N-Roll PRO — производитель этикеточной продукции (Минск + Москва), B2B-сегмент.  
**Проблема:** 8 850 лидов в CRM, конвертированы только 23 в сделки. Клиент пишет или звонит — и его гоняют между сотрудниками, теряя время и сделки.  
**Решение:** ИИ-система умной маршрутизации входящих обращений (Telegram, WhatsApp, email) с автоматическим назначением оптимального менеджера по KPI, занятости и истории клиента. Плюс аналитический дашборд и умная рассылка.

---

## Архитектура системы

```
┌──────────────────────────────────────────────────────────────────┐
│                     BITRIX24 (облако)                            │
│         YOUR-PORTAL.bitrix24.ru                                  │
│   Open Lines: Telegram / WhatsApp / Email                        │
└────────┬────────────────────────────┬────────────────────────────┘
         │ события (webhook, HTTPS)   │ REST API (исходящий)
         ↓                            ↓
┌─────────────────────┐    ┌──────────────────────────────────────┐
│  n8n.kurumi.software│    │  Ноутбук 1 — BEK (R3 3300u, 10GB)   │
│  DigitalOcean VPS   │    │  NestJS API                          │
│  Nginx + SSL        │    │  /api/employees (KPI, занятость)     │
│  Tailscale node     │    │  /api/analytics  (дашборд)           │
└─────────┬───────────┘    │  /api/mailing    (рассылка)          │
          │ Tailscale      │  Supabase (pgvector + данные)        │
          │ WireGuard      │  nomic-embed-text (Ollama)           │
          ↓                └──────────────┬───────────────────────┘
┌─────────────────────────┐               │ Tailscale
│  Ноутбук 2 — ML         │←──────────────┘
│  MacBook M4, 32GB       │
│  n8n local (:5678)      │
│  qwen2.5:14b (Ollama)   │
│  OLLAMA_NUM_PARALLEL=4  │
└─────────────────────────┘
```

### Как работает публичный доступ

Bitrix24 (облако) отправляет события на `https://n8n.kurumi.software`. VPS принимает запрос через Nginx с SSL (Let's Encrypt), форвардит его через Tailscale на MacBook M4 (порт 5678, n8n). MacBook не имеет публичного IP — он только слушает Tailscale. Ноутбук 1 обращается к n8n по Tailscale IP напрямую.

---

## Команда и роли

| Участник | Роль | Задачи |
|---|---|---|
| **Ты** | Backend + автоматизация | NestJS, Supabase, n8n воркфлоу через MCP, аналитика |
| **Друг** | Bitrix24 | Настройка портала, Open Lines, импорт данных, локальное приложение |
| **Дизайнер** | UI/UX | Figma → iframe-дашборд в Bitrix24 |

---

## Стек технологий

| Категория | Технология |
|---|---|
| Backend | NestJS (TypeScript) |
| База данных | Supabase (PostgreSQL + pgvector) |
| Автоматизация | n8n local |
| LLM маршрутизация | qwen2.5:14b-instruct через Ollama |
| Embeddings | nomic-embed-text через Ollama |
| Инфраструктура | DigitalOcean VPS, Tailscale, Nginx, Let's Encrypt |
| CRM | Bitrix24 (облако, бесплатный тариф) |
| Каналы | Telegram Bot, WhatsApp, Email |
| Вайбкодинг | QwenCoder, VS Code Copilot Chat, Antigravity |
| Дизайн | Figma |

---

## Данные из CRM (реальные данные Flex-N-Roll PRO)

### Сотрудники (23 человека)
Ключевые для маршрутизации:
- **ID 1** — Алексей Мезрин, Директор по продажам (Администрация)
- **ID 13** — Марина Бургацкая, Ведущий специалист (Сложная этикетка)
- **ID 23** — Оксана Стреляева, Ведущий специалист (Сложная этикетка)
- **ID 47** — Ольга Передерий, Начальник отдела сопровождения (Чистая этикетка)
- **ID 51** — Анастасия Чернецкая, Инженер-технолог
- **ID 155** — Александр Кургузов, Руководитель отдела продаж Москва
- **ID 175** — Екатерина Краскевич, Начальник отдела (Термоусадочная этикетка)

### Воронки сделок (3 воронки)
- **Основная** — самоклеящаяся этикетка (6 стадий процесса + 6 причин проигрыша)
- **Повторная проработка** — 4 стадии
- **Продажа готовой этикетки** — 4 стадии

### 13 причин отказа
Цены, ТЗ, сроки, логистика, посредники, банкроты, тестирование — все учитываются в аналитике.

### Диалоги (30 штук) — основа для промптов LLM
Реальные переписки по сценариям: расчёт стоимости, подбор материалов, рекламации, срочные заказы. Размечены по ролям: `sales`, `economist`, `technologist`, `dispatcher`, `manager`.

---

## Порядок работы: что делать сначала

### Час 1–2: Инфраструктура (параллельно ты + друг)

**Ты:**
1. Поднять NestJS проект (`nest new flex-router-api`)
2. Подключить Supabase — создать проект, получить connection string
3. Установить Tailscale на ноутбуке 1
4. Настроить VPS (DigitalOcean): Nginx + certbot + Tailscale
   ```bash
   # На VPS
   sudo apt install nginx certbot python3-certbot-nginx
   curl -fsSL https://tailscale.com/install.sh | sh && sudo tailscale up
   sudo certbot --nginx -d n8n.kurumi.software
   # Nginx config: proxy_pass http://YOUR_TAILSCALE_IP:5678 (Tailscale IP MacBook)
   ```

**Друг (MacBook M4):**
1. Установить Ollama: `brew install ollama`
2. Запустить и скачать модели:
   ```bash
   OLLAMA_NUM_PARALLEL=4 OLLAMA_MAX_LOADED_MODELS=1 ollama serve
   ollama pull qwen2.5:14b
   ollama pull nomic-embed-text
   ```
3. Установить n8n:
   ```bash
   npm install -g n8n
   WEBHOOK_URL=https://n8n.kurumi.software N8N_EDITOR_BASE_URL=https://n8n.kurumi.software n8n start
   ```
4. Установить Tailscale, добавиться в сеть

### Час 2–4: Bitrix24 (друг)

1. Создать портал `YOUR-PORTAL.bitrix24.ru`
2. Режим CRM → Классическая (лиды + сделки)
3. Создать входящий вебхук, выдать права: `crm`, `im`, `imopenlines`, `task`, `user`
4. Создать локальное приложение (для событий) → указать URL `https://n8n.kurumi.software/webhook/install`
5. Подключить Telegram-бот через Open Lines (Контакт-центр → Открытые линии → Telegram)
6. Создать 5 тестовых сотрудников (по ролям из ТЗ)
7. Импортировать тестовые данные (leads.json → CSV конвертер)
8. Настроить событие `ONOPENLINEMESSAGEADD` → handler `https://n8n.kurumi.software/webhook/message`

### Час 4–6: База данных (ты)

Создать схему Supabase:

```sql
-- Сотрудники с KPI
CREATE TABLE employees (
  bitrix_id INTEGER PRIMARY KEY,
  name TEXT,
  position TEXT,
  department TEXT,
  kpi_score FLOAT DEFAULT 50.0,  -- 0-100, начальное значение
  deals_won INTEGER DEFAULT 0,
  deals_lost INTEGER DEFAULT 0,
  is_available BOOLEAN DEFAULT true,
  working_hours_start TIME DEFAULT '09:00',
  working_hours_end TIME DEFAULT '18:00'
);

-- История назначений (для "личного менеджера")
CREATE TABLE client_manager_history (
  id SERIAL PRIMARY KEY,
  client_phone TEXT,
  client_email TEXT,
  manager_bitrix_id INTEGER REFERENCES employees(bitrix_id),
  last_interaction TIMESTAMP DEFAULT NOW(),
  interaction_count INTEGER DEFAULT 1
);

-- Диалоги для векторного поиска
CREATE TABLE dialogs_embeddings (
  id SERIAL PRIMARY KEY,
  dialog_id INTEGER,
  scenario TEXT,
  role TEXT,
  content TEXT,
  embedding vector(768),  -- nomic-embed-text размерность
  rating FLOAT DEFAULT 0  -- рейтинг качества диалога
);

-- KPI история
CREATE TABLE kpi_history (
  id SERIAL PRIMARY KEY,
  employee_bitrix_id INTEGER REFERENCES employees(bitrix_id),
  period DATE,
  deals_won INTEGER,
  deals_lost INTEGER,
  avg_response_time_minutes FLOAT,
  kpi_score FLOAT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Лиды (дубликат из Bitrix24 для быстрой аналитики)
CREATE TABLE leads_cache (
  bitrix_id INTEGER PRIMARY KEY,
  title TEXT,
  status_id TEXT,
  source_id TEXT,
  assigned_by_id INTEGER,
  opportunity FLOAT,
  currency TEXT,
  date_create TIMESTAMP,
  date_modify TIMESTAMP,
  date_closed TIMESTAMP
);

-- Рассылки
CREATE TABLE mailings (
  id SERIAL PRIMARY KEY,
  lead_bitrix_id INTEGER,
  channel TEXT,  -- 'email' | 'telegram' | 'whatsapp'
  message_text TEXT,
  sent_at TIMESTAMP,
  status TEXT DEFAULT 'pending',
  response_received BOOLEAN DEFAULT false
);
```

Заполнить `employees` из `employees.json` (23 записи, начальный KPI = 50).  
Заполнить `dialogs_embeddings` — прогнать `dialogs.json` через `nomic-embed-text`.

---

## Фичи и реализация

### ФИЧА MVP — Умная маршрутизация входящих сообщений

**Поток:**
```
Клиент пишет в Telegram
    ↓
Bitrix24 Open Line → событие ONOPENLINEMESSAGEADD
    ↓
n8n Webhook Trigger (https://n8n.kurumi.software/webhook/message)
    ↓
n8n HTTP Request → NestJS /api/employees/available
    (возвращает: список менеджеров с KPI, занятостью, историей клиента)
    ↓
n8n AI Agent → qwen2.5:14b (Ollama HTTP Request нода)
    Промпт: [системный промпт с few-shot из dialogs.json]
    → возвращает JSON: { manager_id, reason, urgency, topic }
    ↓
n8n HTTP Request → Bitrix24 API
    imopenlines.session.transfer (передать диалог менеджеру)
    crm.lead.add (создать лид, если новый клиент)
    tasks.task.add (создать задачу менеджеру)
    ↓
Менеджер видит диалог в Bitrix24 и отвечает клиенту напрямую
```

**Промпт для qwen2.5:14b (системная часть):**
```
Ты — система маршрутизации для компании Flex-N-Roll PRO (производство этикеток).
Получи сообщение клиента и список доступных менеджеров с их KPI и специализацией.
Верни ТОЛЬКО JSON без объяснений:
{
  "manager_id": <bitrix_id>,
  "topic": "price_negotiation|technical_specs|delivery|complaint|new_client",
  "urgency": "low|medium|high",
  "reason": "<краткое объяснение выбора>"
}

Примеры диалогов для контекста:
[Вставить 3-5 примеров из dialogs.json по каждому сценарию]

Доступные менеджеры:
[Динамически: список из NestJS /api/employees/available]
```

**NestJS endpoint `/api/employees/available`:**
```typescript
// Возвращает менеджеров с учётом:
// 1. is_available = true
// 2. Рабочее время (сейчас между working_hours_start и working_hours_end)
// 3. KPI score (сортировка)
// 4. Если клиент уже был — приоритет его "личному" менеджеру (client_manager_history)
```

### ФИЧА 3 — Передача сделки другому менеджеру

**Триггеры для автопередачи (n8n scheduler каждые 5 минут):**
- Менеджер недоступен (`is_available = false`) AND диалог ожидает > 15 минут
- Рабочий день окончен (после `working_hours_end`) AND есть активные диалоги

**Реализация:**
```
n8n Cron Trigger (каждые 5 мин)
    ↓
Bitrix24 API: imopenlines.session.list (открытые диалоги)
    ↓
NestJS /api/employees/available (кто свободен)
    ↓
Bitrix24 API: crm.deal.update { ASSIGNED_BY_ID: new_manager_id }
Bitrix24 API: imopenlines.session.transfer
    ↓
Сообщение клиенту: "Ваш запрос передан менеджеру [Имя]"
```

### ФИЧА 4 + 5 — KPI и умное распределение

**Откуда берётся KPI:**

```
KPI = (deals_won / (deals_won + deals_lost)) * 60     # конверсия (вес 60%)
    + (1 / avg_response_time_minutes) * 20             # скорость ответа (вес 20%)
    + client_satisfaction_score * 20                   # оценки клиентов (вес 20%)
```

**n8n scheduler (раз в сутки):**
1. Забрать из Bitrix24 все сделки за период (`crm.deal.list`)
2. Посчитать KPI каждого сотрудника
3. Обновить `employees.kpi_score` в Supabase
4. Сохранить snapshot в `kpi_history`
5. Обновить `ASSIGNED_BY_ID` в Bitrix24 для новых лидов (опционально)

**Правило "личного менеджера":**
```typescript
// В NestJS при выборе менеджера:
const history = await supabase
  .from('client_manager_history')
  .select('manager_bitrix_id, interaction_count')
  .eq('client_phone', clientPhone)
  .single();

if (history && history.interaction_count >= 2) {
  // Клиент уже взаимодействовал с этим менеджером — приоритет ему
  return personalManager;
}
// Иначе — выбор по KPI и занятости
```

### ФИЧА 6 — Векторный поиск по старым переписках

**Когда используется:** менеджер не знает ответа на технический/ценовой вопрос клиента.

**Реализация:**
```
n8n: менеджер нажимает кнопку "Найти похожие диалоги"
    ↓
NestJS /api/search/similar { query: "текст вопроса клиента" }
    ↓
nomic-embed-text (Ollama): создать embedding запроса
    ↓
Supabase pgvector: SELECT * FROM dialogs_embeddings
  ORDER BY embedding <-> query_embedding LIMIT 5
    ↓
Вернуть топ-5 похожих диалогов с ответами
```

Индексация диалогов (один раз при старте):
```typescript
for (const dialog of dialogs) {
  const embedding = await ollama.embed({ model: 'nomic-embed-text', input: dialog.content });
  await supabase.from('dialogs_embeddings').insert({ ...dialog, embedding });
}
```

### ФИЧА 8 — AI-ассистент для менеджера

**Что умеет:** отвечает на вопросы менеджера о компании, продукции, ценах, техических параметрах.

**Источники знаний:**
- `dialogs.json` (30 реальных диалогов с экспертными ответами)
- Информация о продукции (3 направления: самоклеящаяся, термоусадочная, сложная)
- История конкретного клиента из Supabase

**Реализация в n8n:** AI Agent нода + qwen2.5:14b + контекст из Supabase через HTTP Request.

### ФИЧА 9 — Автоответ когда все заняты

**Логика:**
```
Если нет доступных менеджеров (is_available = false для всех ИЛИ нерабочее время)
    ↓
qwen2.5:14b генерирует персонализированный автоответ:
"Здравствуйте! В данный момент все специалисты заняты.
Ваш вопрос о [тема] зафиксирован. Первый освободившийся
менеджер свяжется с вами до [время]. Примерное время ожидания: X мин."
    ↓
Создаётся задача в Bitrix24 с дедлайном
```

### ФИЧА 10 — Умная рассылка

**Email-рассылка (приоритет), иногда Telegram/WhatsApp:**

```
n8n Cron Trigger (ежедневно в 09:00)
    ↓
NestJS /api/mailing/candidates
    Критерии: лиды без активности > 30 дней
    Берёт из: Supabase leads_cache (синхронизируется с Bitrix24)
    ↓
Для каждого лида: qwen2.5:14b генерирует письмо
    Контекст: название компании, отрасль, последний диалог, продукция
    Пример: "Здравствуйте, [имя]! Несколько месяцев назад вы
    интересовались термоусадочной этикеткой для [продукт].
    Мы обновили прайс и сейчас проводим акцию..."
    ↓
NestJS отправляет email через SMTP (nodemailer)
ИЛИ Bitrix24 API: im.message.add (если Telegram/WhatsApp)
    ↓
Записать в mailings: { lead_id, channel, text, sent_at }
```

**Через Bitrix24 API для email:**
```bash
POST /crm.activity.add
{
  "fields": {
    "OWNER_TYPE_ID": 1,  # лид
    "OWNER_ID": lead_id,
    "TYPE_ID": 4,        # email
    "SUBJECT": "...",
    "DESCRIPTION": "...",
    "COMPLETED": "N"
  }
}
```

---

## Дашборд (ФИЧА аналитика)

**Встроен в Bitrix24 как iframe-приложение.**  
Дизайнер делает Figma → ты реализуешь HTML/JS страницу, данные из NestJS.

**Блоки дашборда:**

1. **Воронка конверсии** — по данным leads_cache (8 статусов из pipeline.json)
2. **13 причин отказа** — pie chart (топ причины почему теряем клиентов)
3. **KPI менеджеров** — таблица: имя, сделки выиграно/проиграно, KPI score, статус
4. **Активные диалоги** — сколько сейчас в работе, у кого
5. **Рассылка** — статистика: отправлено / получено ответов

**API для дашборда (NestJS):**
```typescript
GET /api/analytics/funnel      // конверсия по статусам лидов
GET /api/analytics/rejections  // топ причин отказа
GET /api/analytics/kpi         // KPI всех сотрудников
GET /api/analytics/dialogs     // активные диалоги
GET /api/analytics/mailing     // статистика рассылок
```

---

## Делегация задач

### Ты (Backend + автоматизация)

**Часы 1–8 (первый день):**
- [ ] NestJS проект, подключить Supabase
- [ ] Создать схему БД (SQL выше)
- [ ] Загрузить employees.json, dialogs.json в Supabase
- [ ] Прогнать dialogs.json через nomic-embed-text → сохранить embeddings
- [ ] Настроить VPS: nginx + certbot + tailscale → форвард на MacBook
- [ ] Эндпоинты: `/api/employees/available`, `/api/search/similar`
- [ ] n8n воркфлоу: основной пайплайн маршрутизации (через n8n MCP)

**Часы 8–24 (первый день):**
- [ ] KPI-система: дневной пересчёт, `kpi_history`
- [ ] Логика "личного менеджера"
- [ ] Фича 9: автоответ
- [ ] Синхронизация leads_cache с Bitrix24

**Часы 24–36 (второй день):**
- [ ] Фича 10: умная рассылка (email через nodemailer + Bitrix24 API)
- [ ] Фича 3: автопередача диалога
- [ ] Аналитические эндпоинты для дашборда
- [ ] Фича 8: AI-ассистент для менеджера
- [ ] Тестирование end-to-end

**Часы 36–48 (финал):**
- [ ] Интеграция дашборда с NestJS
- [ ] Подготовка demo-сценария
- [ ] Фикс багов

### Друг (Bitrix24)

**Часы 1–4:**
- [ ] Создать портал Bitrix24, 5 сотрудников
- [ ] Настроить воронки по pipeline.json
- [ ] Создать входящий вебхук (сохранить URL)
- [ ] Создать локальное приложение (для событий)
- [ ] Подключить Telegram-бот через Open Lines
- [ ] Импортировать тестовые данные (leads.json → CSV)

**Часы 4–12:**
- [ ] Настроить события: ONOPENLINEMESSAGEADD, ONCRMLEADADD
- [ ] Протестировать: написать в Telegram → убедиться что событие летит в n8n
- [ ] Разобраться с `imopenlines.session.transfer` API
- [ ] Настроить правила очереди Open Lines

**Часы 12–36:**
- [ ] Подключить WhatsApp (если успеваем)
- [ ] Протестировать все API-методы из Инструкции
- [ ] Помочь с demo-сценарием

### Дизайнер

**Часы 1–12:**
- [ ] Изучить данные (какие метрики показывать в дашборде)
- [ ] Создать wireframes в Figma: дашборд, iframe для Bitrix24

**Часы 12–30:**
- [ ] Дизайн дашборда в Figma (desktop, 1280px)
- [ ] Дизайн презентации (PDF, 10-12 слайдов)

**Часы 30–48:**
- [ ] Помочь с вёрсткой дашборда (если нужна)
- [ ] Финальная презентация

---

## Demo-сценарий (для жюри)

**Сценарий 1 — Новый клиент, технический вопрос:**
1. Жюри пишет в Telegram: *"Здравствуйте, нам нужна этикетка для стеклянной бутылки вина, термоусадочная. Тираж 30 000."*
2. Экран: n8n воркфлоу запускается → LLM определяет тему (shrink_sleeve, technologist) → выбирает менеджера с лучшим KPI
3. В Bitrix24: у менеджера появляется диалог, создаётся лид
4. Менеджер отвечает → клиент получает ответ в Telegram

**Сценарий 2 — Постоянный клиент:**
1. Пишет клиент, который уже был (есть в `client_manager_history`)
2. Система сразу направляет к "личному" менеджеру
3. Менеджер видит историю предыдущих диалогов

**Сценарий 3 — Все заняты:**
1. Пометить всех менеджеров `is_available = false`
2. Клиент пишет → получает AI-автоответ с временем ожидания

**Сценарий 4 — Дашборд:**
1. Открыть iframe в Bitrix24
2. Показать: воронку конверсии, топ-3 причины отказа, KPI менеджеров

---

## Структура презентации (для финала)

1. **Проблема** — цифры из ТЗ: 8 850 лидов, 23 сделки. VIP-клиент попал на стажёра. Письмо пролежало 2 дня.
2. **Решение** — FlexRouter AI: умная маршрутизация + аналитика + рассылка
3. **Как работает** — live demo (сценарии выше)
4. **Данные говорят** — инсайты из leads.json: топ причин отказа, источники с лучшей конверсией
5. **ROI для Flex-N-Roll** — если конверсия вырастет с 0.26% до 2% → +174 сделки → при среднем чеке ~15 000 BYN → +2.6 млн BYN/год
6. **Что дальше** — WhatsApp, MAX, звонки, предиктивная аналитика

---

## Риски и митигация

| Риск | Вероятность | Митигация |
|---|---|---|
| Tailscale нестабилен во время demo | Низкая | Иметь fallback: ngrok как запасной туннель |
| qwen2.5:14b медленно отвечает | Средняя | Кэшировать часто встречающиеся паттерны; таймаут 10 сек |
| Telegram не подключается к Bitrix24 | Средняя | Иметь web-widget как альтернативный канал для demo |
| Ноутбук 1 (R3 3300u) перегревается | Средняя | NestJS не делает ML — только API и БД, нагрузка минимальная |
| Bitrix24 rate limit (2 req/sec) | Высокая | Использовать batch API для массовых операций |

