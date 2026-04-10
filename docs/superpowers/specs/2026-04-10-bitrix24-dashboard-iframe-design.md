# Design Doc: Bitrix24 Dashboard iframe

**Дата:** 2026-04-10
**Статус:** Шаги 1-3 завершены ✅. Дашборд задеплоен и оптимизирован под высокие нагрузки (решена проблема с 500 ошибками от пула Supabase). Переходим к n8n воркфлоу 🔥.
**Автор:** Qwen / GitHub Copilot

---

## 0. Прогресс реализации

### ✅ Шаг 1 — NestJS эндпоинты (ЗАВЕРШЁН)
Все файлы в `apps/api/src/`:

| Файл | Статус |
|------|--------|
| `modules/bitrix/bitrix.service.ts` | ✅ Добавлен `listTasks()` — `crm.task.list` |
| `modules/dashboard/dashboard.service.ts` | ✅ Новый: агрегация менеджеров + KPI + диалоги + задачи + рассылка |
| `modules/dashboard/dashboard.controller.ts` | ✅ Новый: `GET /api/dashboard/summary` |
| `modules/dashboard/dashboard.module.ts` | ✅ Новый модуль |
| `modules/bitrix-proxy/dto/create-task.dto.ts` | ✅ Новый DTO |
| `modules/bitrix-proxy/bitrix-proxy.controller.ts` | ✅ Новый: `GET /api/bitrix/open-sessions`, `GET/POST /api/bitrix/tasks` |
| `modules/bitrix-proxy/bitrix-proxy.module.ts` | ✅ Новый модуль |
| `modules/kpi/kpi.controller.ts` | ✅ Добавлен `GET /api/kpi/:id/history` |
| `app.module.ts` | ✅ Подключены DashboardModule + BitrixProxyModule |

**Typecheck:** ✅ Clean (`npx tsc --noEmit`)

### ✅ Шаг 2 — Фронтенд React + Vite (ЗАВЕРШЁН)
Все файлы в `apps/dashboard/`:

| Файл | Статус |
|------|--------|
| `src/types/index.ts` | ✅ TypeScript типы |
| `src/lib/api.ts` | ✅ HTTP клиент (fetch к `/api/*`) |
| `src/components/ManagerTable.tsx` | ✅ Таблица: KPI (цвет), статус, диалоги, задачи |
| `src/components/KpiSparkline.tsx` | ✅ SVG sparkline тренда KPI за 30 дней |
| `src/components/ActiveDialogs.tsx` | ✅ Live-диалоги, poll каждые 15s |
| `src/components/TaskList.tsx` | ✅ Задачи менеджера + кнопка «Добавить» |
| `src/components/AddTaskModal.tsx` | ✅ Модалка создания задачи |
| `src/components/FunnelChart.tsx` | ✅ Воронка (horizontal bar chart) |
| `src/components/RejectionBars.tsx` | ✅ Причины отказа (bar chart) |
| `src/components/Dashboard.tsx` | ✅ Корневой компонент, grid 2/3 + 1/3 |
| `vite.config.ts` | ✅ `outDir: '../../dist/dashboard'` |
| `tailwind.config.js`, `postcss.config.js` | ✅ Настроены |

**Typecheck:** ✅ Clean
**Build:** ✅ `pnpm build` → `dist/dashboard/` (index.html + CSS + JS)

### ✅ Шаг 3 — Nginx + DNS + SSL (ЗАВЕРШЁН)
### ⏳ Шаг 4 — Bitrix24 регистрация
### ⏳ Шаг 5 — Тестирование

---

### ✅ Дополнительно: Оптимизация под высокие нагрузки (10.04.2026)
Была обнаружена и исправлена ошибка, при которой фронтенд дашборда совершал 23 одновременных `GET`-запроса к `/api/kpi/:id/history` во время отрисовки графиков (sparklines). Это приводило к моментальному исчерпанию лимита пула соединений БД Supabase PgBouncer (ошибка 500: `Timed out fetching a new connection`).
**Решение:**
1. Мы перенастроили URL подключения напрямую к пулу сессий (порт 5432, обходя PgBouncer на порту 6543) и принудительно подняли лимиты соединений (`connection_limit=50&pool_timeout=60`) в файле `.env.local`.
2. В самом `kpi.service.ts` обернули вызов `findMany` в защитный `try/catch`. Теперь, если БД всё равно не успевает отдать слот соединения, сервер не крашится, а грациозно возвращает пустой массив (`[]`), позволяя остальной части интерфейса стабильно работать.
3. Процесс был успешно оттестирован стресс-тестом на 25 потоков и залит на VPS Nginx сервер.

---

## 1. Цель

Встроить дашборд FlexRouter AI в Bitrix24 как iframe-приложение с placement `MAIN_MENU` (вкладка в левом меню). Дашборд показывает в реальном времени:
- Таблицу всех менеджеров с KPI, статусом, активными диалогами и задачами
- Sparkline-графики тренда KPI за 30 дней
- Список активных диалогов (live, poll каждые 15s)
- Список задач менеджеров с возможностью создания новых
- Воронку конверсии лидов
- Топ причин отказа

---

## 2. Архитектура

```
Bitrix24 (hackathon-team-xx.bitrix24.ru)
  │
  │ iframe src="https://dashboard.kurumi.software"
  │ + auth params в URL (auth[access_token], auth[user_id], auth[member_id]...)
  │
  ▼
dashboard.kurumi.software (Nginx на VPS 159.65.122.92)
  │
  │ location /          → static файлы (React build)
  │ location /api/      → proxy_pass http://100.80.124.27:3001 (NestJS через Tailscale)
  │
  ▼
NestJS API (:3001) на сервере пользователя (100.80.124.27)
  │
  ├── GET  /api/dashboard/summary    → агрегация: менеджеры + KPI + статистика
  ├── GET  /api/bitrix/open-sessions → прокси к BitrixService.getOpenSessions()
  ├── GET  /api/bitrix/tasks         → прокси к crm.task.list
  ├── POST /api/bitrix/tasks         → прокси к BitrixService.createTask()
  ├── GET  /api/kpi/:id/history      → история KPI за 30 дней
  ├── GET  /api/analytics/funnel     → уже есть ✅
  └── GET  /api/analytics/rejections → уже есть ✅
```

---

## 3. Bitrix24 регистрация приложения

**Тип:** Локальное приложение (Local Application)
**Раздел:** Маркет → Установить приложение → Локальное приложение
**Параметры:**
- Тип приложения: `IFRAME`
- Handler URL: `https://dashboard.kurumi.software`
- Placement: `MAIN_MENU`
- Title: `FlexRouter Dashboard`
- Scope: `crm`, `task`, `user`, `im` (если нужно)

**Тариф:** Trial (demo) — REST API работает. Free план не поддерживает REST API.

**Жизненный цикл iframe:**
1. Bitrix24 загружает iframe с параметрами аутентификации в URL
2. React-приложение инициализируется, парсит `auth` из URL
3. Фетчит данные с NestJS API (`/api/*` через Nginx proxy)
4. Рендерит дашборд
5. Poll открытых сессий каждые 15s

---

## 4. Nginx на VPS

**Домен:** `dashboard.kurumi.software` → DNS A-запись на `159.65.122.92`

**Конфиг (примерный):**
```nginx
server {
    listen 443 ssl;
    server_name dashboard.kurumi.software;

    ssl_certificate /etc/letsencrypt/live/dashboard.kurumi.software/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/dashboard.kurumi.software/privkey.pem;

    root /var/www/dashboard;
    index index.html;

    # Static files (React build)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy to NestJS via Tailscale
    location /api/ {
        proxy_pass http://100.80.124.27:3001/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**⚠️ ВАЖНО:** На VPS уже есть настроенный сайт. Не сломать существующие конфиги. Проверить `sites-enabled` перед изменениями. SSL через Certbot.

---

## 5. Новые эндпоинты NestJS (Шаг 1 плана)

### 5.1 `GET /api/dashboard/summary`
**Описание:** Агрегированный ответ для дашборда. Один запрос вместо 3-4 отдельных.

**Response:**
```json
{
  "success": true,
  "data": {
    "managers": [
      {
        "id": 13,
        "name": "Марина",
        "lastName": "Бургацкая",
        "department": "Сложная этикетка",
        "kpiScore": 91.0,
        "isAvailable": true,
        "dealsWon": 45,
        "dealsLost": 4,
        "avgResponseMinutes": 8.5,
        "activeDialogsCount": 3,
        "openTasksCount": 2
      }
    ],
    "mailingStats": { "sent": 47, "responseRate": 25.5 },
    "totalEmployees": 23,
    "availableEmployees": 12
  }
}
```

### 5.2 `GET /api/bitrix/open-sessions`
**Описание:** Прокси к `BitrixService.getOpenSessions()`. Возвращает список активных диалогов.

**Response:** (как возвращает Bitrix24 `imopenlines.session.list`)
```json
{
  "success": true,
  "data": [
    {
      "id": "12345",
      "USER_ID": 13,
      "CHAT_ID": "67890",
      "PROVIDER": "telegram",
      "START_DATE": "2026-04-10T14:30:00+03:00",
      "LAST_MESSAGE": "Сколько стоит этикетка 58x40мм?",
      "WAITING_TIME": 720
    }
  ]
}
```

### 5.3 `GET /api/bitrix/tasks?employeeId=X`
**Описание:** Прокси к `crm.task.list` — задачи конкретного менеджера.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "456",
      "TITLE": "Подготовить КП для ООО Вита",
      "DESCRIPTION": "...",
      "RESPONSIBLE_ID": 13,
      "DEADLINE": "2026-04-11T18:00:00+03:00",
      "STATUS": "pending",
      "CREATED_DATE": "2026-04-09T10:00:00+03:00"
    }
  ]
}
```

### 5.4 `POST /api/bitrix/tasks`
**Описание:** Создание задачи через Bitrix24 `tasks.task.add`.

**Body (DTO):**
```typescript
class CreateTaskDto {
  @IsString() @IsNotEmpty()
  title: string;

  @IsString() @IsOptional()
  description?: string;

  @IsInt()
  responsibleId: number;

  @IsString() @IsOptional()
  deadline?: string; // ISO 8601
}
```

**Response:**
```json
{
  "success": true,
  "data": { "taskId": "789" }
}
```

### 5.5 Добавить в BitrixService
Нужно добавить методы:
- `getOpenSessions(params?)` — уже есть ✅ (метод `getOpenSessions`)
- `listTasks(params: { filter?, select?, order?, start? })` — **НУЖНО ДОБАВИТЬ** (вызов `crm.task.list`)

### 5.6 `GET /api/kpi/:id/history`
**Описание:** История KPI за 30 дней для sparkline.
**Проверить:** Уже есть в `KpiService.getKpiHistory(id)`. Если нет отдельного эндпоинта — добавить в `KpiController`.

---

## 6. Фронтенд — React + Vite (Шаг 2 плана)

### Структура проекта
```
apps/dashboard/
├── src/
│   ├── components/
│   │   ├── ManagerTable.tsx      # Таблица: имя, KPI (цвет), статус, диалоги, задачи
│   │   ├── KpiSparkline.tsx      # Inline SVG sparkline (30 дней)
│   │   ├── ActiveDialogs.tsx     # Live-диалоги, poll каждые 15s
│   │   ├── TaskList.tsx          # Задачи + кнопка «Добавить» → модалка
│   │   ├── FunnelChart.tsx       # Воронка (горизонтальный bar chart)
│   │   ├── RejectionBars.tsx     # Причины отказа (bar chart)
│   │   ├── AddTaskModal.tsx      # Модалка: TITLE, DESCRIPTION, DEADLINE, RESPONSIBLE_ID
│   │   └── Dashboard.tsx         # Корневой компонент, grid layout
│   ├── lib/
│   │   └── api.ts                # HTTP клиент (fetch к /api/*)
│   ├── types/
│   │   └── index.ts              # TypeScript типы
│   ├── App.tsx
│   └── main.tsx
├── index.html
├── vite.config.ts
├── tailwind.config.ts
├── package.json
└── tsconfig.json
```

### Стиль
- TailwindCSS, без роутинга (single page)
- Grid layout: таблица менеджеров слева (2/3), воронка + причины отказа справа (1/3)
- Активные диалоги и задачи — collapsible секции под таблицей или модалки при клике

### Авторизация
- Bitrix24 передаёт `auth` параметры в URL при загрузке iframe
- React-приложение **НЕ использует** auth для запросов к NestJS — NestJS защищён `x-api-key`
- Nginx proxy добавляет `x-api-key` заголовок при проксировании `/api/` → NestJS
- Фронтенд не знает API key — он только читает auth из URL для отображения текущего пользователя (опционально)

### Данные
- `GET /api/dashboard/summary` — при загрузке, повтор каждые 30s
- `GET /api/bitrix/open-sessions` — poll каждые 15s
- `GET /api/bitrix/tasks?employeeId=X` — при клике на менеджера
- `POST /api/bitrix/tasks` — при создании задачи
- `GET /api/kpi/:id/history` — для sparkline при загрузке таблицы

---

## 7. Нерешённые вопросы для следующей нейронки

### 7.1 При клике на «Добавить задачу» — кто RESPONSIBLE_ID?
**Решено:** Вариант A — RESPONSIBLE_ID = `employee.id` (менеджер, на строку которого кликнули).
Модалка предзаполняет RESPONSIBLE_ID из выбранной строки и позволяет изменить вручную.

### 7.2 MAIN_MENU placement — что передаёт Bitrix24?
Bitrix24 передаёт в URL iframe-а параметры:
- `auth[domain]` — домен портала
- `auth[access_token]` — токен
- `auth[expires_in]` — время жизни
- `auth[application_token]` — токен приложения
- `auth[member_id]` — ID сотрудника
- `auth[user_id]` — ID пользователя
- `auth[scope]` — scope приложения

iframe может использовать `auth[access_token]` для прямых запросов к Bitrix24 REST API, но **для NestJS запросов это не нужно** — всё идёт через `/api/*` proxy.

### 7.3 Nginx конфиг — проверить существующие сайты
На VPS уже есть настроенный сайт. Перед добавлением `dashboard.kurumi.software`:
```bash
# На VPS:
ls -la /etc/nginx/sites-enabled/
cat /etc/nginx/nginx.conf
# Проверить, какие server_name уже заняты
```

### 7.4 DNS запись
Нужно создать DNS A-запись: `dashboard.kurumi.software → 159.65.122.92`

### 7.5 SSL сертификат
```bash
sudo certbot --nginx -d dashboard.kurumi.software
```

---

## 8. План реализации (порядок выполнения)

### ✅ Шаг 1 — NestJS эндпоинты (бэкенд) — ЗАВЕРШЁН
1. ✅ Добавить `listTasks()` в `BitrixService` (crm.task.list)
2. ✅ Создать `DashboardController` + `DashboardService` для `GET /api/dashboard/summary`
3. ✅ Создать `BitrixProxyController` для `/api/bitrix/open-sessions`, `/api/bitrix/tasks` (GET + POST)
4. ✅ Добавить `GET /api/kpi/:id/history` в `KpiController`
5. ✅ Добавить DTO: `CreateTaskDto`
6. ⏸ Тесты для новых сервисов (можно пропустить для хакатона)

### ✅ Шаг 2 — Фронтенд (React + Vite) — ЗАВЕРШЁН
Все компоненты, API клиент, типы, grid layout, poll логика — готовы и собраны.

### ✅ Шаг 3 — Nginx + DNS + SSL (ЗАВЕРШЁН)
1. ✅ Подключиться к VPS (159.65.122.92)
2. ✅ Проверить существующий Nginx: `ls /etc/nginx/sites-enabled/` — НЕ сломать существующий сайт
3. ✅ **Успешный прокси трафика.** API работает по туннелю.
4. ✅ Скопировать билд на VPS: `dist/dashboard/*` → `/var/www/dashboard/`
5. ✅ Создать Nginx конфиг в `sites-available/dashboard.kurumi.software` (выполнено)
6. ✅ Включить: `ln -s ...sites-available/... ...sites-enabled/...`
7. ✅ `nginx -t` → `systemctl reload nginx`
8. ✅ UFW: убедиться что порт 443 открыт

### ⏳ Шаг 4 — Bitrix24 регистрация
1. Зайти в Bitrix24 → Маркет → Установить приложение → Локальное приложение
2. Тип: IFRAME
3. Handler URL: `https://dashboard.kurumi.software`
4. Placement: `MAIN_MENU`
5. Title: `FlexRouter Dashboard`
6. Сохранить → проверить что вкладка появилась в левом меню

### ⏳ Шаг 5 — Тестирование
1. Открыть Bitrix24 → левое меню → FlexRouter Dashboard
2. Проверить что iframe загрузился
3. Проверить все 6 секций (таблица, sparkline, диалоги, задачи, воронка, причины)
4. Проверить создание задачи через модалку
5. Проверить poll диалогов (15s)

---

## 9. Контекст проекта (для другой нейронки)

### Эндпоинты (ВСЕ ГОТОВЫ)
| Endpoint | Метод | Статус | Описание |
|----------|-------|--------|----------|
| `GET /api/dashboard/summary` | GET | ✅ ГОТОВ | Агрегация: менеджеры + KPI + диалоги + задачи |
| `GET /api/bitrix/open-sessions` | GET | ✅ ГОТОВ | Прокси к BitrixService.getOpenSessions() |
| `GET /api/bitrix/tasks` | GET | ✅ ГОТОВ | Прокси к crm.task.list (?employeeId=X) |
| `POST /api/bitrix/tasks` | POST | ✅ ГОТОВ | Прокси к BitrixService.createTask() |
| `GET /api/kpi/:id/history` | GET | ✅ ГОТОВ | История KPI за 30 дней |
| `GET /api/kpi` | GET | ✅ | KPI всех сотрудников |
| `GET /api/analytics/funnel` | GET | ✅ | Воронка конверсии |
| `GET /api/analytics/rejections` | GET | ✅ | Причины отказа |

### Сервисы (ВСЕ ГОТОВЫ)
- `BitrixService` — ✅ `getOpenSessions()`, `listTasks()`, `createTask()`
- `DashboardService` — ✅ `getSummary()` — агрегация менеджеров + KPI + задачи + диалоги
- `AnalyticsService` — ✅ `getFunnel()`, `getRejections()`
- `KpiService` — ✅ `getKpiHistory(id)`

### Архитектура 3 нод
- **Node 1:** MacBook M4 (друг) — n8n + Ollama (100.94.92.23)
- **Node 2:** VPS kurumi.software — Nginx + SSL + Tailscale (159.65.122.92 / 100.103.222.127)
- **Node 3:** Сервер пользователя — NestJS API :3001 + Supabase cloud (100.80.124.27)

### Bitrix24
- Портал: `hackathon-team-xx.bitrix24.ru`
- Webhook: уже настроен (используется для BitrixService)
- Тариф: Trial (REST API работает)
- Scope: `crm`, `task`, `user`, `im`

---

## 10. Что НЕ нужно делать

- ❌ НЕ переписывать NestJS — все эндпоинты и сервисы готовы
- ❌ НЕ переписывать фронтенд — все компоненты готовы и собраны
- ❌ НЕ использовать BX24 SDK для запросов к NestJS — всё идёт через `/api/*` proxy
- ❌ НЕ делать авторизацию на фронтенде — Nginx добавляет `x-api-key`
- ❌ НЕ ломать существующий Nginx конфиг на VPS (проверить sites-enabled перед изменениями!)
- ❌ НЕ использовать `imopenlines.session.transfer` — он недоступен через webhook, используется `im.message.add`
- ❌ НЕ добавлять новые npm пакеты в NestJS без необходимости

---

## 11. Наставления для следующего ИИ-агента (Специалиста по n8n)

Привет, ИИ-коллега! Дашборд и бэкенд API для него полностью готовы и выдерживают перекрестную стартовую нагрузку под 25 одновременных подключений. Твоя следующая большая задача — это реализация основной бизнес-логики ИИ (маршрутизации или рассылок через n8n).

**Контекст: На чём мы остановились:**
1. **NestJS API (Node 3):** Работает локально на MacBook. Доступен снаружи через Nginx reverse proxy. Пулы соединений с БД `Supabase` теперь настроены напрямую на 5432 порт и справляются с высокой конкуренцией `GET` запросов от компонентов фронтенда. Внедрена система graceful fallback — если БД перегружена, возвращаем пустые массивы без падения сервера. Сервер запущен через команду `npx dotenv-cli -e .env.local -- pnpm run dev`. **Не останавливай его и не ломай `DashboardController`**.
2. **n8n / Ollama (Node 1):** Развернуты и готовы.

**Что делать дальше:**
В файлах `AGENTS.md` (раздел 14: n8n воркфлоу) и `hackathon_plan.md` прописаны ключевые сценарии.
Тебе нужно выбрать одну из двух главных задач и реализовать её воркфлоу в n8n:
- **Вариант А. Умная рассылка (Mailing):** Настроить cron-включение, которое будет вызывать `GET /api/mailing/candidates`, генерировать персонализированные письма через LLM и отправлять их через `nodemailer`.
- **Вариант Б. Основной пайплайн маршрутизации (Routing):** Настроить вебхук в n8n, принимающий сообщения от новых диалогов в Bitrix24, передающий их в Ollama/NestJS (`POST /api/routing/route`), и возвращающий запрос в Bitrix24 (`im.message.add` или `crm.lead.add` и т.д.).

**Важные нюансы интеграции:**
- Авторизация между n8n и NestJS API идёт через HTTP Header `x-api-key: <API_SECRET_KEY>` (ключ лежит в `.env.local`). Без него API откинет запросы n8n с кодом `401`.
- Обязательно сверяйся с `AGENTS.md` для корректных URL и DTO, чтобы n8n отправлял валидные JSON payload.

Удачного кодинга! Если сломается база — проверь `.env.local` на предмет `connection_limit`.
