# AGENTS.md — FlexRouter AI

> **Инструкция для AI-агентов** (GitHub Copilot, QwenCoder, Cursor и др.).
> Читай этот файл целиком перед тем как писать любой код в этом проекте.

---

## 1. Обзор проекта

**FlexRouter AI** — бэкенд-система умной AI-маршрутизации входящих обращений клиентов для B2B-компании Flex-N-Roll PRO (производство этикеточной продукции, Минск + Москва).

Клиенты пишут на email или в Telegram/WhatsApp. Сейчас менеджеров выбирают вручную, что приводит к тому, что из ~8 850 лидов закрываются единицы. Система автоматически:
1. Принимает входящее сообщение из Bitrix24 (через n8n webhook)
2. Анализирует тему запроса через локальный LLM (`qwen2.5:14b`)
3. Выбирает оптимального менеджера по KPI, занятости и истории клиента
4. Назначает диалог в Bitrix24 и создаёт лид/задачу
5. Рассылает реактивационные письма клиентам без активности > 30 дней

---

## 2. Стек технологий

| Категория | Технология | Версия |
|---|---|---|
| Runtime | Node.js | 20 LTS |
| Framework | NestJS | 10.x |
| Language | TypeScript | 5.x |
| Database | Supabase (PostgreSQL 15) | — |
| ORM | Prisma | 5.x |
| HTTP Client | Axios | — |
| Email | Nodemailer | — |
| Scheduling | @nestjs/schedule (cron) | — |
| Testing | Jest + Supertest | — |
| Linting | ESLint + Prettier | — |
| Package Manager | pnpm | — |

**Внешние сервисы:**
- **Bitrix24** (облако) — CRM, Open Lines (Telegram/WhatsApp/Email), API
- **n8n** (локально на MacBook M4) — оркестрация воркфлоу, вызывает этот NestJS
- **Ollama** (на MacBook M4) — `qwen2.5:14b-instruct` для маршрутизации и генерации текста
- **DigitalOcean VPS** — Nginx + SSL (kurumi.software) + Tailscale → туннель до MacBook M4

---

## 3. Структура проекта

```
flex-router-api/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   │
│   ├── modules/
│   │   ├── employees/
│   │   │   ├── employees.module.ts
│   │   │   ├── employees.controller.ts
│   │   │   ├── employees.service.ts
│   │   │   ├── dto/
│   │   │   │   ├── update-employee.dto.ts
│   │   │   │   └── employee-response.dto.ts
│   │   │   └── tests/
│   │   │       ├── employees.service.spec.ts
│   │   │       ├── employees.controller.spec.ts
│   │   │       └── employees.e2e-spec.ts
│   │   │
│   │   ├── routing/
│   │   │   ├── routing.module.ts
│   │   │   ├── routing.controller.ts
│   │   │   ├── routing.service.ts
│   │   │   ├── dto/
│   │   │   │   ├── route-message.dto.ts
│   │   │   │   └── routing-result.dto.ts
│   │   │   └── tests/
│   │   │       ├── routing.service.spec.ts
│   │   │       ├── routing.controller.spec.ts
│   │   │       └── routing.e2e-spec.ts
│   │   │
│   │   ├── kpi/
│   │   │   ├── kpi.module.ts
│   │   │   ├── kpi.controller.ts
│   │   │   ├── kpi.service.ts
│   │   │   └── tests/
│   │   │       ├── kpi.service.spec.ts
│   │   │       └── kpi.e2e-spec.ts
│   │   │
│   │   ├── mailing/
│   │   │   ├── mailing.module.ts
│   │   │   ├── mailing.controller.ts
│   │   │   ├── mailing.service.ts
│   │   │   ├── dto/
│   │   │   │   └── send-mailing.dto.ts
│   │   │   └── tests/
│   │   │       ├── mailing.service.spec.ts
│   │   │       └── mailing.e2e-spec.ts
│   │   │
│   │   ├── analytics/
│   │   │   ├── analytics.module.ts
│   │   │   ├── analytics.controller.ts
│   │   │   ├── analytics.service.ts
│   │   │   └── tests/
│   │   │       ├── analytics.service.spec.ts
│   │   │       └── analytics.e2e-spec.ts
│   │   │
│   │   ├── bitrix/
│   │   │   ├── bitrix.module.ts
│   │   │   ├── bitrix.service.ts   ← обёртка над Bitrix24 REST API
│   │   │   └── tests/
│   │   │       └── bitrix.service.spec.ts
│   │   │
│   │   └── ollama/
│   │       ├── ollama.module.ts
│   │       ├── ollama.service.ts   ← HTTP к Ollama API
│   │       └── tests/
│   │           └── ollama.service.spec.ts
│   │
│   ├── common/
│   │   ├── guards/
│   │   │   └── api-key.guard.ts
│   │   ├── interceptors/
│   │   │   └── logging.interceptor.ts
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts
│   │   ├── decorators/
│   │   │   └── api-key.decorator.ts
│   │   └── constants/
│   │       ├── bitrix-statuses.ts   ← enum статусов из pipeline.json
│   │       └── employees-seed.ts    ← данные из employees.json
│   │
│   └── prisma/
│       ├── prisma.module.ts
│       └── prisma.service.ts
│
├── prisma/
│   ├── schema.prisma
│   └── seed.ts          ← сидирование из employees.json + dialogs.json
│
├── test/
│   └── jest-e2e.json
│
├── .env
├── .env.test            ← отдельный env для тестов (test-база)
├── AGENTS.md            ← этот файл
├── nest-cli.json
├── tsconfig.json
└── package.json
```

---

## 4. Схема базы данных (Prisma)

Файл: `prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Employee {
  id                  Int       @id              // bitrix24 ID (из employees.json)
  name                String
  lastName            String
  email               String    @unique
  phone               String?
  position            String?
  department          String?
  kpiScore            Float     @default(50.0)  // 0–100
  dealsWon            Int       @default(0)
  dealsLost           Int       @default(0)
  avgResponseMinutes  Float     @default(0)
  isAvailable         Boolean   @default(true)
  workStart           String    @default("09:00") // HH:mm
  workEnd             String    @default("18:00")
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  assignments         Assignment[]
  kpiHistory          KpiHistory[]
  mailings            Mailing[]
}

// "Личный менеджер" — кто работал с этим клиентом
model Assignment {
  id               Int       @id @default(autoincrement())
  clientPhone      String?
  clientEmail      String?
  clientBitrixId   String?   // ID контакта в Bitrix24
  employeeId       Int
  employee         Employee  @relation(fields: [employeeId], references: [id])
  interactionCount Int       @default(1)
  lastInteraction  DateTime  @default(now())
  createdAt        DateTime  @default(now())

  @@index([clientPhone])
  @@index([clientEmail])
  @@index([clientBitrixId])
}

model KpiHistory {
  id                    Int       @id @default(autoincrement())
  employeeId            Int
  employee              Employee  @relation(fields: [employeeId], references: [id])
  period                DateTime  // дата snapshot'а (начало дня)
  dealsWon              Int
  dealsLost             Int
  avgResponseMinutes    Float
  kpiScore              Float
  createdAt             DateTime  @default(now())

  @@index([employeeId, period])
}

// Кэш лидов из Bitrix24 (синхронизируется ежечасно)
model LeadCache {
  bitrixId     String    @id
  title        String
  statusId     String
  sourceId     String?
  assignedById Int?
  opportunity  Float     @default(0)
  currencyId   String    @default("BYN")
  clientName   String?
  clientEmail  String?
  clientPhone  String?
  comments     String?
  dateCreate   DateTime?
  dateModify   DateTime?
  dateClosed   DateTime?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
}

model Mailing {
  id                Int       @id @default(autoincrement())
  leadBitrixId      String?
  clientEmail       String?
  clientPhone       String?
  clientName        String?
  channel           String    // 'email' | 'telegram' | 'whatsapp'
  subject           String?
  messageText       String
  generatedBy       String    @default("llm")  // 'llm' | 'template'
  employeeId        Int?
  employee          Employee? @relation(fields: [employeeId], references: [id])
  status            String    @default("pending")  // pending | sent | failed
  responseReceived  Boolean   @default(false)
  sentAt            DateTime?
  createdAt         DateTime  @default(now())

  @@index([status])
  @@index([clientEmail])
}

// Входящие события от n8n (лог + дедупликация)
model IncomingEvent {
  id            Int      @id @default(autoincrement())
  eventId       String   @unique  // идентификатор из Bitrix24
  eventType     String            // ONOPENLINEMESSAGEADD, ONCRMLEADADD...
  channel       String            // telegram | email | whatsapp
  clientText    String
  clientPhone   String?
  clientEmail   String?
  assignedTo    Int?
  routingReason String?
  topic         String?
  urgency       String?
  processedAt   DateTime @default(now())

  @@index([eventId])
}
```

---

## 5. Переменные окружения

Файл `.env`:

```env
# Database
DATABASE_URL="postgresql://USER:PASS@db.xxxx.supabase.co:5432/postgres"

# Bitrix24
BITRIX24_WEBHOOK_URL="https://hackathon-team-xx.bitrix24.ru/rest/1/XXXXX"
BITRIX24_INCOMING_SECRET="your-secret-for-validating-incoming-events"

# Ollama (MacBook M4, доступен через Tailscale)
OLLAMA_BASE_URL="http://100.x.x.x:11434"
OLLAMA_ROUTING_MODEL="qwen2.5:14b-instruct"
OLLAMA_TIMEOUT_MS=15000

# Email (для рассылок)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="noreply@kurumi.software"
SMTP_PASS="app-specific-password"
SMTP_FROM="FlexRouter <noreply@kurumi.software>"

# App
PORT=3000
NODE_ENV=development
API_SECRET_KEY="strong-random-key-for-n8n-to-nestjs-calls"

# n8n (Tailscale IP MacBook)
N8N_BASE_URL="http://100.x.x.x:5678"
```

Файл `.env.test`:
```env
DATABASE_URL="postgresql://USER:PASS@localhost:5432/flex_router_test"
NODE_ENV=test
OLLAMA_BASE_URL="http://localhost:11434"
BITRIX24_WEBHOOK_URL="https://mock.bitrix24.ru/rest/1/test"
```

---

## 6. Конвенции кода

### Общие правила
- **Всегда TypeScript**. Запрещены `any` — используй конкретные типы или `unknown`.
- **DTO с class-validator** для всех входящих данных (`@IsString()`, `@IsInt()`, etc.)
- **Dependency Injection** — все зависимости через конструктор, никаких глобальных инстансов.
- **Async/await** везде — никаких `.then().catch()` цепочек.
- **Именование:** `camelCase` для переменных/функций, `PascalCase` для классов/интерфейсов/enum, `SCREAMING_SNAKE` для констант.
- **Ответы API:** всегда через стандартную обёртку:
  ```typescript
  interface ApiResponse<T> {
    success: boolean;
    data: T;
    error?: string;
    meta?: { total?: number; page?: number };
  }
  ```
- **Логирование:** используй `Logger` из `@nestjs/common`, НЕ `console.log`.
- **Ошибки:** бросай `HttpException` или наследники (`NotFoundException`, `BadRequestException`). Глобальный `HttpExceptionFilter` поймает всё остальное.

### Модульная структура
Каждый модуль экспортирует только свой сервис. Контроллеры — только маршруты и DTO-валидация, вся бизнес-логика в сервисах.

### Работа с Prisma
```typescript
// ПРАВИЛЬНО: всегда используй транзакции при множественных операциях
const result = await this.prisma.$transaction([
  this.prisma.employee.update({ ... }),
  this.prisma.kpiHistory.create({ ... }),
]);

// ПРАВИЛЬНО: select только нужные поля
await this.prisma.employee.findMany({
  select: { id: true, name: true, kpiScore: true, isAvailable: true },
});
```

---

## 7. Порядок разработки

> ⚠️ **Жёсткое правило:** backend пишется по принципу **"сначала тест, потом код"**.
> Для каждого модуля: Unit-тесты → Integration-тесты → E2E-тесты → реализация → рефакторинг.

### Фаза 0: Scaffolding (делается один раз)
```bash
pnpm add -g @nestjs/cli
nest new flex-router-api --package-manager pnpm
cd flex-router-api
pnpm add @nestjs/config @nestjs/schedule @prisma/client prisma
pnpm add axios nodemailer class-validator class-transformer
pnpm add -D @types/nodemailer jest @types/jest ts-jest supertest @types/supertest
npx prisma init
```

### Фаза 1: Инфраструктура + тесты инфраструктуры
1. Prisma schema (см. раздел 4)
2. `PrismaService` с onModuleInit/onModuleDestroy
3. `BitrixService` — обёртка всех Bitrix24 API calls с моками для тестов
4. `OllamaService` — HTTP-клиент для qwen2.5, с интерфейсом для мокирования

### Фаза 2: Модуль employees + тесты
1. Написать **unit-тесты** для `EmployeesService` (весь файл)
2. Написать **e2e-тесты** для `GET /api/employees/available`
3. Реализовать сервис и контроллер
4. Прогнать тесты — все должны пройти

### Фаза 3: Модуль routing + тесты (MVP)
1. Unit-тесты: логика выбора менеджера, парсинг LLM-ответа
2. Integration-тесты: `RoutingService` с замоканным `OllamaService`
3. E2E-тесты: `POST /api/routing/route` — полный flow
4. Реализация

### Фаза 4: Модуль kpi + тесты
1. Unit-тесты: формула KPI, edge-cases (0 сделок, 100% проигрышей)
2. Integration-тесты: синхронизация из Bitrix24
3. E2E: `GET /api/kpi`, `POST /api/kpi/recalculate`
4. Реализация + cron-scheduler

### Фаза 5: Модуль mailing + тесты
1. Unit-тесты: генерация текста через Ollama, fallback на шаблон
2. Integration-тесты: nodemailer с транспортом-заглушкой
3. E2E: `POST /api/mailing/send`, `GET /api/mailing/candidates`
4. Реализация + cron-scheduler

### Фаза 6: Модуль analytics + тесты
1. Unit-тесты: агрегация данных по воронке, причинам отказа
2. E2E: все GET-эндпоинты аналитики
3. Реализация

---

## 8. Тестирование — детальные требования

### Структура тест-файла (обязательный шаблон)

```typescript
// employees.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { EmployeesService } from '../employees.service';
import { PrismaService } from '../../../prisma/prisma.service';

// Мок PrismaService — ВСЕГДА мокируй внешние зависимости в unit-тестах
const mockPrismaService = {
  employee: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    create: jest.fn(),
  },
  assignment: {
    findFirst: jest.fn(),
    upsert: jest.fn(),
  },
};

describe('EmployeesService', () => {
  let service: EmployeesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployeesService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<EmployeesService>(EmployeesService);
    jest.clearAllMocks();  // очищать моки перед каждым тестом
  });

  describe('getAvailableEmployees', () => {
    it('should return only available employees sorted by kpiScore DESC', async () => {
      // arrange
      mockPrismaService.employee.findMany.mockResolvedValue([
        { id: 33, name: 'Александр', kpiScore: 78.5, isAvailable: true },
        { id: 13, name: 'Марина', kpiScore: 91.0, isAvailable: true },
      ]);
      // act
      const result = await service.getAvailableEmployees();
      // assert
      expect(result[0].id).toBe(13);  // Марина с KPI 91 идёт первой
      expect(result[0].kpiScore).toBe(91.0);
      expect(mockPrismaService.employee.findMany).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when no employees are available', async () => {
      mockPrismaService.employee.findMany.mockResolvedValue([]);
      const result = await service.getAvailableEmployees();
      expect(result).toEqual([]);
    });

    it('should filter out employees outside working hours', async () => {
      // тест с учётом времени работы
    });
  });
});
```

### Unit-тесты — что обязательно покрыть

**EmployeesService:**
- `getAvailableEmployees()`: сортировка по KPI, фильтр по `isAvailable`, фильтр по рабочему времени
- `getPersonalManager(clientPhone, clientEmail)`: возвращает менеджера если >= 2 взаимодействий
- `updateAvailability(id, isAvailable)`: обновляет флаг
- `seedFromJson()`: корректно создаёт 23 записи из employees.json

**RoutingService:**
- `buildPrompt(messageText, availableEmployees)`: содержит текст сообщения и список сотрудников
- `parseLlmResponse(rawJson)`: корректно парсит `{ manager_id, topic, urgency, reason }`
- `parseLlmResponse(invalidJson)`: бросает `BadRequestException` при невалидном JSON
- `selectManager(message, clientPhone, clientEmail)`: приоритет личного менеджера
- `handleNoAvailableManagers()`: возвращает `null` (будет автоответ)

**KpiService:**
- `calculateKpiScore(won, lost, avgResponseMin)`: формула KPI
- `calculateKpiScore(0, 0, 0)`: edge-case — 0 сделок → KPI = 50 (default)
- `calculateKpiScore(10, 0, 5)`: 100% конверсия → высокий KPI
- `syncFromBitrix24(deals)`: корректно агрегирует сделки по `ASSIGNED_BY_ID`

**MailingService:**
- `getCandidates(inactiveDays)`: лиды без активности > N дней, source не 'JUNK'
- `buildEmailPrompt(lead)`: промпт содержит название компании и тему
- `sendEmail(to, subject, html)`: вызывает nodemailer transport с правильными параметрами
- `sendEmail()` при ошибке SMTP: статус переходит в `failed`, исключение не пробрасывается

**BitrixService:**
- `assignDialog(sessionId, employeeId)`: вызывает `imopenlines.session.transfer` с правильными params
- `createLead(data)`: вызывает `crm.lead.add`
- `updateLeadAssignee(leadId, employeeId)`: вызывает `crm.lead.update`
- retry-логика при HTTP 503 (Bitrix rate limit)

### Integration-тесты — что обязательно покрыть

Используй реальную test-базу (`.env.test`), но мокируй внешние HTTP (Bitrix24, Ollama).

```typescript
// routing.service.integration.spec.ts
// Тут реальный Prisma + test БД, но мок Ollama и Bitrix24
describe('RoutingService (integration)', () => {
  it('should persist assignment after successful routing', async () => {
    // 1. Создать тестового сотрудника в БД
    // 2. Замокать OllamaService.chat() → вернуть JSON с manager_id
    // 3. Вызвать routingService.routeMessage(...)
    // 4. Проверить что Assignment создан в БД
  });

  it('should reuse personal manager if interaction count >= 2', async () => {
    // 1. Создать Assignment с interactionCount = 2
    // 2. Вызвать routeMessage с тем же clientPhone
    // 3. Ollama НЕ должна вызываться (mock.calls.length === 0)
    // 4. Вернулся именно "личный" менеджер
  });
});
```

Обязательные integration-тесты:
- `RoutingService`: персистенция назначений, приоритет личного менеджера, обновление interactionCount
- `KpiService`: recalculate → kpiHistory создаётся, employee.kpiScore обновляется
- `MailingService`: getCandidates → правильная выборка из leads_cache
- `BitrixService`: retry при 429 (rate limit), корректный формат payload

### E2E-тесты (Supertest)

```typescript
// routing.e2e-spec.ts
import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../app.module';

describe('POST /api/routing/route (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => await app.close());

  it('should return 401 without API key', () => {
    return request(app.getHttpServer())
      .post('/api/routing/route')
      .send({ messageText: 'test', channel: 'telegram' })
      .expect(401);
  });

  it('should return 400 with invalid DTO', () => {
    return request(app.getHttpServer())
      .post('/api/routing/route')
      .set('x-api-key', process.env.API_SECRET_KEY)
      .send({ messageText: 123 })  // должна быть строка
      .expect(400);
  });

  it('should return routing result with manager_id', async () => {
    const { body } = await request(app.getHttpServer())
      .post('/api/routing/route')
      .set('x-api-key', process.env.API_SECRET_KEY)
      .send({
        messageText: 'Нужен расчёт на этикетку 58х40мм, тираж 50000',
        channel: 'email',
        clientEmail: 'test@example.com',
      })
      .expect(200);

    expect(body.success).toBe(true);
    expect(body.data.managerId).toBeDefined();
    expect(body.data.topic).toMatch(/price_negotiation|technical_specs|new_client/);
    expect(body.data.urgency).toMatch(/low|medium|high/);
  });
});
```

Обязательные e2e-тесты:
- Аутентификация: 401 без ключа, 403 с неверным ключом, 200 с верным
- Валидация: 400 для каждого обязательного поля
- Happy path: полный flow каждого модуля
- Auto-reply: ответ когда нет доступных менеджеров
- Mailing candidates: правильный список кандидатов
- Analytics: все GET-эндпоинты возвращают правильную структуру

### Запуск тестов

```bash
# Unit-тесты
pnpm test

# Unit-тесты с watch
pnpm test:watch

# E2E (требует .env.test с тестовой БД)
pnpm test:e2e

# Coverage (цель: > 80% для services)
pnpm test:cov
```

`package.json` scripts:
```json
{
  "test": "jest --passWithNoTests",
  "test:watch": "jest --watch",
  "test:cov": "jest --coverage",
  "test:e2e": "jest --config ./test/jest-e2e.json"
}
```

---

## 9. API — полная спецификация

Базовый URL: `http://localhost:3000/api`

Все защищённые эндпоинты требуют заголовок: `x-api-key: <API_SECRET_KEY>`

### Employees

#### `GET /employees/available`
Список доступных менеджеров для маршрутизации.

Query params: `?clientPhone=+375291234567&clientEmail=test@test.com` (опционально — для определения личного менеджера)

Response `200`:
```json
{
  "success": true,
  "data": {
    "employees": [
      {
        "id": 13,
        "name": "Марина",
        "lastName": "Бургацкая",
        "position": "Ведущий специалист отдела сбыта",
        "department": "Сложная этикетка",
        "kpiScore": 91.0,
        "isAvailable": true,
        "isPersonalManager": false
      }
    ],
    "personalManagerId": null
  }
}
```

#### `PATCH /employees/:id/availability`
Обновить доступность менеджера (вызывается n8n при смене статуса в Bitrix24).

Body: `{ "isAvailable": boolean }`

#### `GET /employees/:id/kpi`
Текущий KPI + история за последние 30 дней.

---

### Routing

#### `POST /routing/route`
Главный endpoint. Вызывается n8n после получения сообщения из Bitrix24.

Body (DTO `RouteMessageDto`):
```typescript
class RouteMessageDto {
  @IsString() @IsNotEmpty()
  messageText: string;

  @IsEnum(['telegram', 'email', 'whatsapp', 'phone'])
  channel: string;

  @IsString() @IsOptional()
  clientPhone?: string;

  @IsEmail() @IsOptional()
  clientEmail?: string;

  @IsString() @IsOptional()
  clientBitrixId?: string;  // ID сессии в Bitrix24 Open Line

  @IsString() @IsOptional()
  eventId?: string;  // для дедупликации
}
```

Response `200`:
```typescript
class RoutingResultDto {
  managerId: number | null;  // null = нет доступных → нужен автоответ
  managerName: string | null;
  topic: 'price_negotiation' | 'technical_specs' | 'delivery' | 'complaint' | 'new_client' | 'urgent_reorder' | 'other';
  urgency: 'low' | 'medium' | 'high';
  reason: string;
  isPersonalManager: boolean;
  autoReplyText: string | null;  // если managerId === null
}
```

#### `POST /routing/transfer`
Передача диалога другому менеджеру (вызывается n8n по cron если менеджер недоступен > 15 мин).

Body: `{ "sessionId": string, "currentManagerId": number, "reason": "unavailable" | "end_of_day" }`

---

### KPI

#### `GET /kpi`
Текущий KPI всех сотрудников.

Response `200`:
```json
{
  "success": true,
  "data": [
    {
      "id": 13,
      "name": "Марина Бургацкая",
      "department": "Сложная этикетка",
      "kpiScore": 91.0,
      "dealsWon": 45,
      "dealsLost": 4,
      "avgResponseMinutes": 8.5
    }
  ]
}
```

#### `POST /kpi/recalculate`
Принудительный пересчёт KPI из Bitrix24. Вызывается n8n cron ежедневно в 00:00.

Логика:
1. Забрать все сделки из `LeadCache` (или прямо из Bitrix24 API)
2. Сгруппировать по `assignedById`
3. Посчитать KPI по формуле (раздел 10)
4. Обновить `Employee.kpiScore`
5. Создать запись в `KpiHistory`

---

### Mailing

#### `GET /mailing/candidates`
Лиды для реактивационной рассылки.

Query: `?inactiveDays=30&limit=50`

Критерии выборки:
- Лид существует в `LeadCache`
- `statusId` НЕ в `['CONVERTED', 'JUNK', '15', '20']` (не закрытые, не банкроты)
- `dateModify` < сейчас - `inactiveDays` дней
- `clientEmail` заполнен (email — основной канал)

Response:
```json
{
  "success": true,
  "data": {
    "candidates": [
      {
        "leadId": "27984",
        "clientName": "Тимофей Мишин",
        "companyTitle": "ООО Лесной Край",
        "email": "lesnoykray@example.by",
        "lastActivity": "2025-11-30T17:29:00+03:00",
        "inactiveDays": 129,
        "statusId": "5",
        "comments": "Требуется сложная этикетка с тиснением"
      }
    ],
    "total": 47
  }
}
```

#### `POST /mailing/send`
Запустить рассылку по кандидатам. Вызывается n8n cron ежедневно в 09:00.

Body: `{ "leadIds": string[], "channel": "email" | "telegram" }` (default channel = "email")

Поведение:
1. Для каждого лида запрос к Ollama: сгенерировать персонализированное письмо
2. Если Ollama недоступна → использовать fallback-шаблон (текстовый)
3. Отправить через nodemailer (email) или Bitrix24 `im.message.add` (telegram)
4. Записать результат в `Mailing`

#### `GET /mailing/stats`
Статистика отправленных рассылок за последние 30 дней.

---

### Analytics

#### `GET /analytics/funnel`
Конверсия по статусам лидов из Bitrix24.

Response:
```json
{
  "success": true,
  "data": {
    "total": 8850,
    "byStatus": [
      { "statusId": "NEW", "name": "Новый лид", "count": 3420, "percentage": 38.6 },
      { "statusId": "3", "name": "Установление контакта", "count": 2100, "percentage": 23.7 },
      { "statusId": "CONVERTED", "name": "Размещён заказ", "count": 23, "percentage": 0.26 }
    ]
  }
}
```

#### `GET /analytics/rejections`
Топ причин отказа (для диаграммы на дашборде).

#### `GET /analytics/managers`
Сводка по менеджерам: KPI, сделки, активные диалоги.

#### `GET /analytics/mailing`
Статистика рассылок: отправлено / получен ответ / конверсия.

---

### Sync

#### `POST /sync/leads`
Синхронизировать лиды из Bitrix24 в `LeadCache`. Вызывается n8n cron каждый час.

---

## 10. Бизнес-логика

### Формула KPI

```typescript
function calculateKpiScore(
  dealsWon: number,
  dealsLost: number,
  avgResponseMinutes: number,
): number {
  const totalDeals = dealsWon + dealsLost;
  
  // Нет сделок → нейтральный KPI
  if (totalDeals === 0) return 50.0;

  // Конверсия (60% веса)
  const conversionRate = dealsWon / totalDeals;
  const conversionScore = conversionRate * 60;

  // Скорость ответа (20% веса): идеал = 5 минут, хорошо = 30 минут
  const responseScore = avgResponseMinutes <= 0
    ? 20
    : Math.max(0, 20 * (1 - Math.log(avgResponseMinutes / 5) / Math.log(300)));

  // Объём (20% веса): масштаб 1–100 сделок
  const volumeScore = Math.min(20, (totalDeals / 100) * 20);

  return Math.min(100, Math.max(0, conversionScore + responseScore + volumeScore));
}
```

### Логика выбора менеджера

```
Приоритет 1: Личный менеджер
  → Найти Assignment по clientPhone/clientEmail
  → Если interactionCount >= 2 И менеджер isAvailable → вернуть его

Приоритет 2: LLM-маршрутизация
  → Получить список available employees (отсортированных по kpiScore DESC)
  → Если список пуст → вернуть null (нужен автоответ)
  → Собрать промпт (см. ниже)
  → Вызвать Ollama qwen2.5:14b-instruct
  → Распарсить JSON-ответ
  → Найти сотрудника по returned manager_id, убедиться что он в available list
  → Вернуть результат

Приоритет 3: Fallback (если LLM вернул невалидный JSON или timeout)
  → Взять первого из available employees (с наибольшим kpiScore)
  → topic = 'other', urgency = 'medium'
```

### Промпт для qwen2.5:14b-instruct

```
SYSTEM:
Ты — система автоматической маршрутизации входящих обращений компании Flex-N-Roll PRO.
Компания производит самоклеящуюся, термоусадочную и сложную этикетку.
Сотрудники делятся на специализации:
- "Сложная этикетка": тиснение, фольга, многослойные этикетки
- "Термоусадочная этикетка": шринк-рукава, ПВХ/ПЕТГ плёнка
- "Чистая этикетка": стандартные самоклеящиеся, массовый сегмент
- "Администрация": директора, технологи, диспетчеры

Классифицируй запрос клиента и выбери оптимального менеджера.
Ответь ТОЛЬКО валидным JSON, без markdown, без объяснений:
{
  "manager_id": <number>,
  "topic": "<price_negotiation|technical_specs|delivery|complaint|new_client|urgent_reorder|other>",
  "urgency": "<low|medium|high>",
  "reason": "<1-2 предложения почему выбран этот менеджер>"
}

ПРАВИЛА urgency:
- high: слово "срочно", "горит", "завтра", жалоба, рекламация
- medium: конкретный запрос с параметрами, повторный клиент
- low: общий вопрос, знакомство, "хотели бы узнать"

USER:
Сообщение клиента: "{{messageText}}"

Доступные менеджеры:
{{availableEmployees | json}}
```

### Автоответ (когда нет доступных менеджеров)

```
SYSTEM: Ты — вежливый ассистент компании Flex-N-Roll PRO.
Напиши краткое (2-3 предложения) сообщение клиенту о том, что все специалисты заняты.
Укажи примерное время ответа (следующий рабочий день до 10:00).
Тон: профессиональный, дружелюбный. Язык: русский.
Не упоминай что ты ИИ.

USER: Клиент написал: "{{messageText}}"
```

### Email-рассылка — промпт генерации письма

```
SYSTEM: Ты пишешь реактивационные письма от лица менеджера компании Flex-N-Roll PRO.
Письмо должно быть кратким (3-4 абзаца), персонализированным, не навязчивым.
Не используй слова "напоминаем", "беспокоим", "хотели бы предложить".
Язык: русский, деловой стиль. Подпись: "С уважением, команда Flex-N-Roll PRO"

USER:
Клиент: {{clientName}}, компания: {{companyTitle}}
Последний контакт: {{lastActivity}} ({{inactiveDays}} дней назад)
Статус в CRM: {{statusName}}
Комментарий: {{comments}}

Напиши тему письма (subject) и тело (body) в формате JSON:
{ "subject": "...", "body": "..." }
```

---

## 11. BitrixService — справочник методов

```typescript
// Все методы возвращают Promise<any>, внутри используют axios.post(BITRIX24_WEBHOOK_URL + method, params)
// Rate limit Bitrix24: 2 req/sec → используй задержку 500ms между вызовами

// Лиды
bitrix.createLead({ TITLE, STATUS_ID, SOURCE_ID, ASSIGNED_BY_ID, NAME, LAST_NAME, EMAIL, PHONE, COMMENTS })
bitrix.updateLead(id, { ASSIGNED_BY_ID?, STATUS_ID?, COMMENTS? })
bitrix.getLeads({ filter, select, start })  // SELECT с пагинацией

// Сделки
bitrix.getDeals({ filter: { '>DATE_MODIFY': '2024-01-01' }, select: ['ID', 'STAGE_SEMANTIC_ID', 'ASSIGNED_BY_ID', 'OPPORTUNITY'] })
bitrix.updateDeal(id, { ASSIGNED_BY_ID })

// Open Lines (диалоги)
bitrix.transferSession(sessionId, toUserId)  // imopenlines.session.transfer
bitrix.getOpenSessions()                      // imopenlines.session.list
bitrix.sendMessage(dialogId, text)            // im.message.add

// Задачи
bitrix.createTask({ TITLE, DESCRIPTION, RESPONSIBLE_ID, DEADLINE, UF_CRM_TASK })

// CRM Activity (для email через Bitrix)
bitrix.addActivity({ OWNER_TYPE_ID: 1, OWNER_ID: leadId, TYPE_ID: 4, SUBJECT, DESCRIPTION })
```

---

## 12. OllamaService

```typescript
// src/modules/ollama/ollama.service.ts

interface OllamaResponse {
  model: string;
  message: { role: string; content: string };
  done: boolean;
}

class OllamaService {
  // POST /api/chat (основной метод для маршрутизации и генерации текста)
  async chat(prompt: string, systemPrompt?: string): Promise<string>

  // Таймаут: OLLAMA_TIMEOUT_MS (default 15000ms)
  // При таймауте или сетевой ошибке → бросать OllamaUnavailableException
  // Вызывающий код должен обработать исключение и использовать fallback
}
```

**Важно:** OllamaService НИКОГДА не должен крашить основной flow. Любая ошибка Ollama → graceful fallback (первый по KPI менеджер / шаблонное письмо).

---

## 13. Seed данных

Файл `prisma/seed.ts` — запускается один раз командой `npx prisma db seed`.

Сидирует:
1. **Employees** — 23 записи из `employees.json` (bitrix IDs: 1, 13, 19, 21, 23, 25, 31, 33, 35, 47, 51, 55, 65, 93, 97, 145, 155, 169, 175, 209, 237, 239, 241)
2. **LeadCache** — загрузить первые 100 записей из `leads.json` как начальные данные

Начальные KPI-значения для seed (рассчитаны по `deals.json`):
- ID 13 (Марина Бургацкая): kpiScore = 72, dealsWon = 5, dealsLost = 2
- ID 33 (Александр Кипель): kpiScore = 68, dealsWon = 4, dealsLost = 2
- Остальные: kpiScore = 50 (default, нет достаточно данных)

---

## 14. n8n — воркфлоу (описание для справки)

NestJS не знает про n8n. Воркфлоу описаны здесь чтобы понять откуда приходят запросы.

### WF-01: Routing (основной, MVP)

```
Trigger: Webhook POST /webhook/message
  ↓
HTTP Request: GET https://api.kurumi.software/api/employees/available
  ↓
HTTP Request: POST https://api.kurumi.software/api/routing/route
  { messageText, channel, clientPhone, clientEmail, clientBitrixId, eventId }
  ↓
IF managerId != null:
  → HTTP Request: Bitrix24 imopenlines.session.transfer
  → HTTP Request: Bitrix24 crm.lead.add (если новый клиент)
  → HTTP Request: Bitrix24 tasks.task.add (задача менеджеру)
ELSE:
  → HTTP Request: Bitrix24 im.message.add (автоответ из autoReplyText)
```

### WF-02: KPI Recalculate (cron 00:00)

```
Trigger: Schedule (daily 00:00)
  ↓
HTTP Request: POST https://api.kurumi.software/api/kpi/recalculate
```

### WF-03: Mailing (cron 09:00)

```
Trigger: Schedule (daily 09:00)
  ↓
HTTP Request: GET https://api.kurumi.software/api/mailing/candidates?inactiveDays=30&limit=50
  ↓
HTTP Request: POST https://api.kurumi.software/api/mailing/send
  { leadIds: [...], channel: "email" }
```

### WF-04: Leads Sync (cron каждый час)

```
Trigger: Schedule (every hour)
  ↓
HTTP Request: POST https://api.kurumi.software/api/sync/leads
```

### WF-05: Transfer Inactive Dialogs (cron каждые 5 минут)

```
Trigger: Schedule (every 5 min)
  ↓
HTTP Request: Bitrix24 imopenlines.session.list (открытые > 15 минут)
  ↓
HTTP Request: GET https://api.kurumi.software/api/employees/available
  ↓
IF есть диалоги у недоступных менеджеров:
  → HTTP Request: POST https://api.kurumi.software/api/routing/transfer
```

---

## 15. Данные проекта (реальные)

### Статусы лидов (из pipeline.json)

```typescript
// src/common/constants/bitrix-statuses.ts
export const LEAD_STATUSES = {
  NEW: 'NEW',
  CONTACT: '3',
  NEED_DISCOVERY: '4',
  PROPOSAL: '5',
  CONVERTED: 'CONVERTED',  // success
  JUNK: 'JUNK',            // failure: не используют этикетку
  INTERMEDIARY: '15',      // failure: работают с посредником
  PRICE_FAIL: '16',        // failure: не прошли по ценам
  SPEC_FAIL: '17',         // failure: не прошли по ТЗ
  TIMING_FAIL: '18',       // failure: не прошли по срокам
  LOGISTICS_FAIL: '19',    // failure: не прошли по логистике
  BANKRUPT: '20',          // failure: банкроты/ненадёжные
  OTHER_FAIL: '22',        // failure: другое
};

export const TERMINAL_FAILURE_STATUSES = ['JUNK', '15', '16', '17', '18', '19', '20', '22'];
export const SUCCESS_STATUSES = ['CONVERTED'];
export const ACTIVE_STATUSES = ['NEW', '3', '4', '5'];
```

### Воронки сделок

- **CATEGORY_ID 0** — Основная (самоклеящаяся этикетка): стадии NEW→3→4→5→PREPARATION→WON/LOSE/APOLOGY/6/7/8/9
- **CATEGORY_ID 11** — Повторная проработка: C11:NEW→C11:PREPARATION→C11:WON/C11:LOSE
- **CATEGORY_ID 13** — Готовая этикетка: C13:NEW→C13:WON/C13:LOSE/C13:APOLOGY

Успешные стадии (SEMANTIC="S"): `WON`, `C11:WON`, `C13:WON`
Провальные стадии (SEMANTIC="F"): `LOSE`, `APOLOGY`, `6`, `7`, `8`, `9`, `C11:LOSE`, `C13:LOSE`, `C13:APOLOGY`

---

## 16. Checklist перед PR

- [ ] Все unit-тесты проходят (`pnpm test`)
- [ ] E2E-тесты проходят (`pnpm test:e2e`)
- [ ] Coverage > 80% для services (`pnpm test:cov`)
- [ ] Нет `any` в TypeScript
- [ ] Нет `console.log` — только `this.logger.*`
- [ ] DTO-валидация есть на всех входящих данных
- [ ] `.env.example` обновлён при добавлении новых переменных
- [ ] API-эндпоинт задокументирован в разделе 9
- [ ] OllamaService имеет fallback при недоступности
- [ ] Bitrix24 вызовы не дублируются (дедупликация по eventId)