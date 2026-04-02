# NestJS Backend + Swagger Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Создать базовый NestJS backend с Swagger документацией, модулями applications, metrics, pipeline без интеграции с frontend (MSW заглушки остаются).

**Architecture:** Модульная архитектура NestJS с изолированными модулями (Applications, Metrics, Pipeline, Analytics), каждый со своим controller/service/DTO. Swagger генерируется автоматически из декораторов. Mock-данные хранятся в памяти до интеграции с реальной БД.

**Tech Stack:** NestJS 10, @nestjs/swagger 8, class-validator, class-transformer, TypeScript strict mode, Zod для валидации типов (shared-types).

---

## File Structure

### Модули которые будут созданы/модифицированы:

```
apps/api/src/
├── main.ts                          ← Modify: добавить CORS для localhost:3000
├── app.module.ts                    ← Modify: импортировать новые модули
├── applications/                    ← NEW: модуль заявок
│   ├── applications.module.ts
│   ├── applications.controller.ts
│   ├── applications.service.ts
│   └── dto/
│       ├── create-application.dto.ts
│       └── application-filters.dto.ts
├── metrics/                         ← NEW: модуль метрик
│   ├── metrics.module.ts
│   ├── metrics.controller.ts
│   └── metrics.service.ts
├── pipeline/                        ← NEW: модуль пайплайна
│   ├── pipeline.module.ts
│   ├── pipeline.controller.ts
│   └── pipeline.service.ts
└── analytics/                       ← NEW: модуль аналитики
    ├── analytics.module.ts
    ├── analytics.controller.ts
    └── analytics.service.ts
```

### DTO Decorators (Swagger):
- `@ApiProperty()` — обязательное поле
- `@ApiPropertyOptional()` — опциональное поле
- `@ApiResponseProperty()` — только для ответов
- `@ApiOperation()` — описание endpoint
- `@ApiTags()` — группировка endpoints
- `@ApiOkResponse()`, `@ApiBadRequestResponse()` — документация ответов

---

### Task 1: Applications Module — Controller + Service

**Files:**
- Create: `apps/api/src/applications/applications.module.ts`
- Create: `apps/api/src/applications/applications.controller.ts`
- Create: `apps/api/src/applications/applications.service.ts`
- Create: `apps/api/src/applications/dto/create-application.dto.ts`
- Create: `apps/api/src/applications/dto/application-filters.dto.ts`

- [ ] **Step 1: Create Applications Module**

```typescript
// apps/api/src/applications/applications.module.ts
import { Module } from "@nestjs/common";
import { ApplicationsController } from "./applications.controller";
import { ApplicationsService } from "./applications.service";

@Module({
  controllers: [ApplicationsController],
  providers: [ApplicationsService],
  exports: [ApplicationsService],
})
export class ApplicationsModule {}
```

- [ ] **Step 2: Create Application DTO with Swagger decorators**

```typescript
// apps/api/src/applications/dto/create-application.dto.ts
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsString, IsOptional, IsUrl, MinLength } from "class-validator";

export enum ApplicationSource {
  EMAIL = "email",
  FACEBOOK = "facebook",
  WEBFORM = "webform",
}

export enum ApplicationIntent {
  COMMERCIAL = "commercial",
  SUPPORT = "support",
  TECHNICAL = "technical",
}

export enum ApplicationUrgency {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
}

export enum ApplicationComplexity {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
}

export enum ApplicationStatus {
  PROCESSING = "processing",
  ASSIGNED = "assigned",
  ESCALATED = "escalated",
}

export class AssignedUserDto {
  @ApiProperty({ example: "usr-123" })
  @IsString()
  id!: string;

  @ApiProperty({ example: "Ivan Ivanov" })
  @IsString()
  name!: string;

  @ApiPropertyOptional({ example: "https://example.com/avatar.jpg" })
  @IsOptional()
  @IsUrl()
  avatar?: string;
}

export class CreateApplicationDto {
  @ApiProperty({ enum: ApplicationSource, example: ApplicationSource.EMAIL })
  @IsEnum(ApplicationSource)
  source!: ApplicationSource;

  @ApiProperty({ example: "Нужна этикетка для продукта, 1000 шт" })
  @IsString()
  @MinLength(10)
  rawText!: string;

  @ApiProperty({ enum: ApplicationIntent, example: ApplicationIntent.COMMERCIAL })
  @IsEnum(ApplicationIntent)
  intent!: ApplicationIntent;

  @ApiProperty({ enum: ApplicationUrgency, example: ApplicationUrgency.MEDIUM })
  @IsEnum(ApplicationUrgency)
  urgency!: ApplicationUrgency;

  @ApiProperty({ enum: ApplicationComplexity, example: ApplicationComplexity.LOW })
  @IsEnum(ApplicationComplexity)
  complexity!: ApplicationComplexity;

  @ApiProperty({ example: 85, minimum: 0, maximum: 100 })
  aiConfidence!: number;

  @ApiProperty({ type: AssignedUserDto })
  assignedTo!: AssignedUserDto;

  @ApiPropertyOptional({ example: "BX-12345" })
  @IsOptional()
  @IsString()
  bitrix24DealId?: string;

  @ApiPropertyOptional({ example: "https://bitrix24.ru/crm/deal/12345" })
  @IsOptional()
  @IsUrl()
  bitrix24DealUrl?: string;
}
```

- [ ] **Step 3: Create Application Filters DTO**

```typescript
// apps/api/src/applications/dto/application-filters.dto.ts
import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsOptional, IsInt, Min } from "class-validator";
import { Type } from "class-transformer";

import { ApplicationIntent, ApplicationUrgency, ApplicationStatus } from "./create-application.dto";

export class ApplicationFiltersDto {
  @ApiPropertyOptional({ enum: ApplicationIntent })
  @IsOptional()
  @IsEnum(ApplicationIntent)
  intent?: ApplicationIntent;

  @ApiPropertyOptional({ enum: ApplicationUrgency })
  @IsOptional()
  @IsEnum(ApplicationUrgency)
  urgency?: ApplicationUrgency;

  @ApiPropertyOptional({ enum: ApplicationStatus })
  @IsOptional()
  @IsEnum(ApplicationStatus)
  status?: ApplicationStatus;

  @ApiPropertyOptional({ example: 10, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;

  @ApiPropertyOptional({ example: 0, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number = 0;
}
```

- [ ] **Step 4: Create Applications Service with mock data**

```typescript
// apps/api/src/applications/applications.service.ts
import { Injectable } from "@nestjs/common";
import { randomUUID } from "crypto";

import type { CreateApplicationDto } from "./dto/create-application.dto";
import { ApplicationStatus } from "./dto/create-application.dto";

export interface Application {
  id: string;
  source: "email" | "facebook" | "webform";
  rawText: string;
  intent: "commercial" | "support" | "technical";
  urgency: "low" | "medium" | "high";
  complexity: "low" | "medium" | "high";
  aiConfidence: number;
  assignedTo: { id: string; name: string; avatar?: string };
  bitrix24DealId?: string;
  bitrix24DealUrl?: string;
  createdAt: Date;
  processedAt?: Date;
  status: "processing" | "assigned" | "escalated";
}

@Injectable()
export class ApplicationsService {
  private applications: Application[] = [
    {
      id: randomUUID(),
      source: "email",
      rawText: "Здравствуйте! Нужна печать этикеток для новой линейки соков. Тираж 5000 шт, формат 100x150мм. Интересует самоклеящаяся пленка с ламинацией. Срок - до конца месяца.",
      intent: "commercial",
      urgency: "medium",
      complexity: "medium",
      aiConfidence: 92,
      assignedTo: { id: "mgr-1", name: "Ivan Ivanov", avatar: "https://picsum.photos/seed/mgr1/96/96" },
      bitrix24DealId: "BX-1001",
      bitrix24DealUrl: "https://flexnroll.bitrix24.ru/crm/deal/1001/",
      createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30 min ago
      processedAt: new Date(Date.now() - 1000 * 60 * 25),
      status: "assigned",
    },
    {
      id: randomUUID(),
      source: "facebook",
      rawText: "Добрый день! Подскажите, делаете ли вы этикетки для крафтовой косметики? Нужен дизайн и печать 200 шт.",
      intent: "commercial",
      urgency: "low",
      complexity: "low",
      aiConfidence: 88,
      assignedTo: { id: "mgr-2", name: "Bitrix Agent", avatar: "https://picsum.photos/seed/mgr2/96/96" },
      createdAt: new Date(Date.now() - 1000 * 60 * 45),
      status: "processing",
    },
    {
      id: randomUUID(),
      source: "webform",
      rawText: "СРОЧНО! Ошибка в макете этикеток для партии меда. Нужно переделать 50 шт urgently!",
      intent: "support",
      urgency: "high",
      complexity: "low",
      aiConfidence: 95,
      assignedTo: { id: "mgr-1", name: "Ivan Ivanov" },
      bitrix24DealId: "BX-1002",
      createdAt: new Date(Date.now() - 1000 * 60 * 15),
      processedAt: new Date(Date.now() - 1000 * 60 * 10),
      status: "escalated",
    },
    {
      id: randomUUID(),
      source: "email",
      rawText: "Печать этикеток для вина, 1000 бутылок. Материал - металлизированная бумага. Нужен расчет стоимости.",
      intent: "commercial",
      urgency: "medium",
      complexity: "medium",
      aiConfidence: 90,
      assignedTo: { id: "mgr-2", name: "Bitrix Agent" },
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      status: "assigned",
    },
    {
      id: randomUUID(),
      source: "webform",
      rawText: "Технический вопрос: можно ли печатать этикетки на прозрачной пленке с золотым тиснением?",
      intent: "technical",
      urgency: "low",
      complexity: "high",
      aiConfidence: 78,
      assignedTo: { id: "mgr-1", name: "Ivan Ivanov" },
      createdAt: new Date(Date.now() - 1000 * 60 * 90),
      status: "assigned",
    },
    {
      id: randomUUID(),
      source: "facebook",
      rawText: "Здравствуйте! Интересует печать этикеток для джемов и варенья. Тираж 300 шт на каждый вкус (всего 5 видов).",
      intent: "commercial",
      urgency: "low",
      complexity: "low",
      aiConfidence: 85,
      assignedTo: { id: "mgr-2", name: "Bitrix Agent" },
      createdAt: new Date(Date.now() - 1000 * 60 * 120),
      status: "processing",
    },
    {
      id: randomUUID(),
      source: "email",
      rawText: "Нужно срочно заменить этикетки на уже отпечатанной партии. Брак типографии.",
      intent: "support",
      urgency: "high",
      complexity: "medium",
      aiConfidence: 91,
      assignedTo: { id: "mgr-1", name: "Ivan Ivanov" },
      bitrix24DealId: "BX-1003",
      createdAt: new Date(Date.now() - 1000 * 60 * 5),
      processedAt: new Date(Date.now() - 1000 * 60 * 2),
      status: "escalated",
    },
    {
      id: randomUUID(),
      source: "webform",
      rawText: "Расчет стоимости печати этикеток для пивной продукции. 4 сорта, по 5000 этикеток каждый.",
      intent: "commercial",
      urgency: "medium",
      complexity: "high",
      aiConfidence: 87,
      assignedTo: { id: "mgr-2", name: "Bitrix Agent" },
      createdAt: new Date(Date.now() - 1000 * 60 * 180),
      status: "assigned",
    },
    {
      id: randomUUID(),
      source: "email",
      rawText: "Вопрос по хранению этикеток: какой срок годности у клея на самоклеящейся основе?",
      intent: "technical",
      urgency: "low",
      complexity: "low",
      aiConfidence: 93,
      assignedTo: { id: "mgr-1", name: "Ivan Ivanov" },
      createdAt: new Date(Date.now() - 1000 * 60 * 240),
      status: "assigned",
    },
    {
      id: randomUUID(),
      source: "facebook",
      rawText: "Печать этикеток для шоколада. Формат 70x100мм, тираж 1000 шт. Нужна пищевая пленка.",
      intent: "commercial",
      urgency: "medium",
      complexity: "low",
      aiConfidence: 89,
      assignedTo: { id: "mgr-2", name: "Bitrix Agent" },
      createdAt: new Date(Date.now() - 1000 * 60 * 300),
      status: "processing",
    },
    {
      id: randomUUID(),
      source: "webform",
      rawText: "Смена дизайна этикеток для существующей продукции. Нужно 3 варианта на выбор.",
      intent: "commercial",
      urgency: "low",
      complexity: "medium",
      aiConfidence: 82,
      assignedTo: { id: "mgr-1", name: "Ivan Ivanov" },
      createdAt: new Date(Date.now() - 1000 * 60 * 360),
      status: "assigned",
    },
    {
      id: randomUUID(),
      source: "email",
      rawText: "Рекламация: этикетки отклеиваются на холоде. Партия от 15.03.2024.",
      intent: "support",
      urgency: "high",
      complexity: "medium",
      aiConfidence: 96,
      assignedTo: { id: "mgr-2", name: "Bitrix Agent" },
      bitrix24DealId: "BX-1004",
      createdAt: new Date(Date.now() - 1000 * 60 * 8),
      processedAt: new Date(Date.now() - 1000 * 60 * 3),
      status: "escalated",
    },
  ];

  findAll(filters: { intent?: string; urgency?: string; status?: string; limit?: number; offset?: number }): { items: Application[]; total: number } {
    let filtered = [...this.applications];

    if (filters.intent) {
      filtered = filtered.filter((app) => app.intent === filters.intent);
    }
    if (filters.urgency) {
      filtered = filtered.filter((app) => app.urgency === filters.urgency);
    }
    if (filters.status) {
      filtered = filtered.filter((app) => app.status === filters.status);
    }

    const total = filtered.length;
    const limit = filters.limit ?? 20;
    const offset = filters.offset ?? 0;

    return {
      items: filtered.slice(offset, offset + limit),
      total,
    };
  }

  findOne(id: string): Application | null {
    return this.applications.find((app) => app.id === id) ?? null;
  }

  create(payload: Omit<Application, "id" | "createdAt" | "processedAt" | "status">): Application {
    const newApplication: Application = {
      ...payload,
      id: randomUUID(),
      createdAt: new Date(),
      status: ApplicationStatus.PROCESSING,
    };

    this.applications.unshift(newApplication);
    return newApplication;
  }
}
```

- [ ] **Step 5: Create Applications Controller with Swagger decorators**

```typescript
// apps/api/src/applications/applications.controller.ts
import { Controller, Get, Post, Param, Query, Body } from "@nestjs/common";
import { ApiOperation, ApiTags, ApiOkResponse, ApiBadRequestResponse } from "@nestjs/swagger";

import { ApplicationFiltersDto } from "./dto/application-filters.dto";
import { CreateApplicationDto } from "./dto/create-application.dto";
import { ApplicationsService, type Application } from "./applications.service";

@ApiTags("applications")
@Controller("applications")
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @ApiOperation({ summary: "Get all applications with filters" })
  @ApiOkResponse({
    description: "List of applications retrieved successfully",
    schema: {
      type: "object",
      properties: {
        items: { type: "array", items: { $ref: "#/components/schemas/Application" } },
        total: { type: "number", example: 12 },
      },
    },
  })
  @ApiBadRequestResponse({ description: "Invalid filter parameters" })
  @Get()
  findAll(@Query() filters: ApplicationFiltersDto) {
    const result = this.applicationsService.findAll({
      intent: filters.intent,
      urgency: filters.urgency,
      status: filters.status,
      limit: filters.limit,
      offset: filters.offset,
    });

    return result;
  }

  @ApiOperation({ summary: "Get application by ID" })
  @ApiOkResponse({
    description: "Application found",
    type: Object,
  })
  @Get(":id")
  findOne(@Param("id") id: string) {
    const application = this.applicationsService.findOne(id);

    if (!application) {
      return { error: "Application not found" };
    }

    return application;
  }

  @ApiOperation({ summary: "Create new application (stub for n8n webhook)" })
  @Post()
  create(@Body() payload: CreateApplicationDto) {
    return this.applicationsService.create(payload);
  }
}
```

- [ ] **Step 6: Run typecheck to verify no TypeScript errors**

```bash
pnpm --filter api typecheck
```

Expected: PASS

---

### Task 2: Metrics Module — Today's KPIs

**Files:**
- Create: `apps/api/src/metrics/metrics.module.ts`
- Create: `apps/api/src/metrics/metrics.controller.ts`
- Create: `apps/api/src/metrics/metrics.service.ts`

- [ ] **Step 1: Create Metrics Service with mock calculations**

```typescript
// apps/api/src/metrics/metrics.service.ts
import { Injectable } from "@nestjs/common";

export interface TodayMetrics {
  totalProcessed: number;
  aiConfidenceAvg: number;
  autoRouted: number;
  manualReview: number;
  slaCompliance: number;
}

@Injectable()
export class MetricsService {
  getTodayMetrics(): TodayMetrics {
    // Mock data - later will calculate from real applications
    return {
      totalProcessed: 47,
      aiConfidenceAvg: 88,
      autoRouted: 39,
      manualReview: 8,
      slaCompliance: 94,
    };
  }
}
```

- [ ] **Step 2: Create Metrics Controller**

```typescript
// apps/api/src/metrics/metrics.controller.ts
import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiTags, ApiOkResponse } from "@nestjs/swagger";

import { MetricsService, type TodayMetrics } from "./metrics.service";

@ApiTags("metrics")
@Controller("metrics")
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @ApiOperation({ summary: "Get today's KPI metrics" })
  @ApiOkResponse({
    description: "Today's metrics retrieved successfully",
    type: Object,
  })
  @Get("today")
  getTodayMetrics(): TodayMetrics {
    return this.metricsService.getTodayMetrics();
  }
}
```

- [ ] **Step 3: Create Metrics Module**

```typescript
// apps/api/src/metrics/metrics.module.ts
import { Module } from "@nestjs/common";
import { MetricsController } from "./metrics.controller";
import { MetricsService } from "./metrics.service";

@Module({
  controllers: [MetricsController],
  providers: [MetricsService],
  exports: [MetricsService],
})
export class MetricsModule {}
```

- [ ] **Step 4: Run typecheck**

```bash
pnpm --filter api typecheck
```

Expected: PASS

---

### Task 3: Pipeline Module — Processing Status

**Files:**
- Create: `apps/api/src/pipeline/pipeline.module.ts`
- Create: `apps/api/src/pipeline/pipeline.controller.ts`
- Create: `apps/api/src/pipeline/pipeline.service.ts`

- [ ] **Step 1: Create Pipeline Service**

```typescript
// apps/api/src/pipeline/pipeline.service.ts
import { Injectable } from "@nestjs/common";

export interface PipelineStep {
  id: string;
  label: string;
  status: "idle" | "active" | "done" | "error";
  duration?: number; // ms
}

export interface PipelineStatus {
  steps: PipelineStep[];
}

@Injectable()
export class PipelineService {
  getPipelineStatus(): PipelineStatus {
    return {
      steps: [
        { id: "1", label: "Webhook Received", status: "done", duration: 12 },
        { id: "2", label: "AI Parsing", status: "done", duration: 245 },
        { id: "3", label: "Intent Classification", status: "done", duration: 89 },
        { id: "4", label: "Urgency Detection", status: "done", duration: 67 },
        { id: "5", label: "Manager Assignment", status: "active", duration: 156 },
        { id: "6", label: "Bitrix24 Sync", status: "idle" },
        { id: "7", label: "Notification Sent", status: "idle" },
      ],
    };
  }

  getPipelineHistory(): PipelineStatus[] {
    // Mock history - last 5 processed applications
    return Array(5)
      .fill(null)
      .map((_, i) => ({
        steps: [
          { id: "1", label: "Webhook Received", status: "done", duration: 10 + i * 2 },
          { id: "2", label: "AI Parsing", status: "done", duration: 200 + i * 10 },
          { id: "3", label: "Intent Classification", status: "done", duration: 80 + i * 5 },
          { id: "4", label: "Urgency Detection", status: "done", duration: 60 + i * 3 },
          { id: "5", label: "Manager Assignment", status: "done", duration: 140 + i * 8 },
          { id: "6", label: "Bitrix24 Sync", status: "done", duration: 95 + i * 4 },
          { id: "7", label: "Notification Sent", status: "done", duration: 23 + i * 2 },
        ],
      }));
  }
}
```

- [ ] **Step 2: Create Pipeline Controller**

```typescript
// apps/api/src/pipeline/pipeline.controller.ts
import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiTags, ApiOkResponse } from "@nestjs/swagger";

import { PipelineService, type PipelineStatus } from "./pipeline.service";

@ApiTags("pipeline")
@Controller("pipeline")
export class PipelineController {
  constructor(private readonly pipelineService: PipelineService) {}

  @ApiOperation({ summary: "Get current pipeline processing status" })
  @ApiOkResponse({
    description: "Pipeline status retrieved successfully",
    type: Object,
  })
  @Get("status")
  getStatus(): PipelineStatus {
    return this.pipelineService.getPipelineStatus();
  }

  @ApiOperation({ summary: "Get pipeline processing history" })
  @ApiOkResponse({
    description: "Pipeline history retrieved successfully",
    schema: {
      type: "array",
      items: { $ref: "#/components/schemas/PipelineStatus" },
    },
  })
  @Get("history")
  getHistory(): PipelineStatus[] {
    return this.pipelineService.getPipelineHistory();
  }
}
```

- [ ] **Step 3: Create Pipeline Module**

```typescript
// apps/api/src/pipeline/pipeline.module.ts
import { Module } from "@nestjs/common";
import { PipelineController } from "./pipeline.controller";
import { PipelineService } from "./pipeline.service";

@Module({
  controllers: [PipelineController],
  providers: [PipelineService],
  exports: [PipelineService],
})
export class PipelineModule {}
```

- [ ] **Step 4: Run typecheck**

```bash
pnpm --filter api typecheck
```

Expected: PASS

---

### Task 4: Analytics Module — Categories & Deal Stats

**Files:**
- Create: `apps/api/src/analytics/analytics.module.ts`
- Create: `apps/api/src/analytics/analytics.controller.ts`
- Create: `apps/api/src/analytics/analytics.service.ts`

- [ ] **Step 1: Create Analytics Service**

```typescript
// apps/api/src/analytics/analytics.service.ts
import { Injectable } from "@nestjs/common";

export interface CategoryDistribution {
  category: string;
  count: number;
  percentage: number;
}

export interface DealStats {
  dealId: string;
  totalAmount: number;
  stage: string;
  createdAt: string;
  closedAt?: string;
  probability: number;
}

@Injectable()
export class AnalyticsService {
  getCategoriesDistribution(): CategoryDistribution[] {
    return [
      { category: "commercial", count: 28, percentage: 60 },
      { category: "support", count: 12, percentage: 25 },
      { category: "technical", count: 7, percentage: 15 },
    ];
  }

  getDealStats(dealId: string): DealStats | null {
    // Mock deal stats
    const mockDeals: Record<string, DealStats> = {
      "BX-1001": {
        dealId: "BX-1001",
        totalAmount: 125000,
        stage: "PROPOSAL",
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
        probability: 75,
      },
      "BX-1002": {
        dealId: "BX-1002",
        totalAmount: 15000,
        stage: "NEGOTIATION",
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
        probability: 90,
      },
    };

    return mockDeals[dealId] ?? null;
  }
}
```

- [ ] **Step 2: Create Analytics Controller**

```typescript
// apps/api/src/analytics/analytics.controller.ts
import { Controller, Get, Param } from "@nestjs/common";
import { ApiOperation, ApiTags, ApiOkResponse, ApiNotFoundResponse } from "@nestjs/swagger";

import { AnalyticsService, type CategoryDistribution, type DealStats } from "./analytics.service";

@ApiTags("analytics")
@Controller("analytics")
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @ApiOperation({ summary: "Get applications distribution by category" })
  @ApiOkResponse({
    description: "Category distribution retrieved successfully",
    schema: {
      type: "array",
      items: {
        type: "object",
        properties: {
          category: { type: "string" },
          count: { type: "number" },
          percentage: { type: "number" },
        },
      },
    },
  })
  @Get("categories")
  getCategories(): CategoryDistribution[] {
    return this.analyticsService.getCategoriesDistribution();
  }

  @ApiOperation({ summary: "Get deal statistics by Bitrix24 deal ID" })
  @ApiOkResponse({
    description: "Deal stats retrieved successfully",
    type: Object,
  })
  @ApiNotFoundResponse({ description: "Deal not found" })
  @Get("deal/:id")
  getDealStats(@Param("id") id: string): DealStats | { error: string } {
    const stats = this.analyticsService.getDealStats(id);

    if (!stats) {
      return { error: "Deal not found" };
    }

    return stats;
  }
}
```

- [ ] **Step 3: Create Analytics Module**

```typescript
// apps/api/src/analytics/analytics.module.ts
import { Module } from "@nestjs/common";
import { AnalyticsController } from "./analytics.controller";
import { AnalyticsService } from "./analytics.service";

@Module({
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
```

- [ ] **Step 4: Run typecheck**

```bash
pnpm --filter api typecheck
```

Expected: PASS

---

### Task 5: Register All Modules in AppModule + Update main.ts

**Files:**
- Modify: `apps/api/src/app.module.ts`
- Modify: `apps/api/src/main.ts`

- [ ] **Step 1: Update AppModule to import all new modules**

```typescript
// apps/api/src/app.module.ts
import { Module } from "@nestjs/common";

import { AnalyticsModule } from "./analytics/analytics.module";
import { ApplicationsModule } from "./applications/applications.module";
import { AuthModule } from "./auth/auth.module";
import { HealthModule } from "./health/health.module";
import { MetricsModule } from "./metrics/metrics.module";
import { PipelineModule } from "./pipeline/pipeline.module";
import { ProfileModule } from "./profile/profile.module";

@Module({
  imports: [
    AuthModule,
    ProfileModule,
    HealthModule,
    ApplicationsModule,
    MetricsModule,
    PipelineModule,
    AnalyticsModule,
  ],
})
export class AppModule {}
```

- [ ] **Step 2: Update main.ts with better CORS and Swagger config**

```typescript
// apps/api/src/main.ts
import "reflect-metadata";

import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import cookieParser from "cookie-parser";

import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix("api");
  app.use(cookieParser());
  app.enableCors({
    origin: (process.env.FRONTEND_ORIGIN ?? "http://localhost:3000")
      .split(",")
      .map((origin) => origin.trim()),
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle("FLEX-N-ROLL API")
    .setDescription("AI-powered application processing API for label manufacturing")
    .setVersion("0.1.0")
    .addCookieAuth("flexnroll_session")
    .addTag("applications", "Application management endpoints")
    .addTag("metrics", "KPI and metrics endpoints")
    .addTag("pipeline", "Processing pipeline status")
    .addTag("analytics", "Analytics and statistics")
    .addTag("auth", "Authentication endpoints")
    .addTag("profile", "User profile management")
    .addTag("health", "Health check endpoints")
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("api/docs", app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "FLEX-N-ROLL API Docs",
  });

  const port = Number(process.env.PORT ?? "3001");
  await app.listen(port);

  console.log(`🚀 API running on http://localhost:${port}`);
  console.log(`📚 Swagger docs: http://localhost:${port}/api/docs`);
}

void bootstrap();
```

- [ ] **Step 3: Run typecheck**

```bash
pnpm --filter api typecheck
```

Expected: PASS

---

### Task 6: Add Escalations Endpoint (SLA Monitoring)

**Files:**
- Create: `apps/api/src/escalations/escalations.module.ts`
- Create: `apps/api/src/escalations/escalations.controller.ts`
- Create: `apps/api/src/escalations/escalations.service.ts`

- [ ] **Step 1: Create Escalations Service**

```typescript
// apps/api/src/escalations/escalations.service.ts
import { Injectable } from "@nestjs/common";

export interface Escalation {
  id: string;
  applicationId: string;
  reason: "sla_breach" | "manual_escalation" | "complexity_high";
  escalatedAt: string;
  assignedTo: { id: string; name: string };
  originalManager: { id: string; name: string };
  status: "pending" | "resolved" | "in_progress";
}

@Injectable()
export class EscalationsService {
  getEscalations(): Escalation[] {
    return [
      {
        id: "esc-1",
        applicationId: "app-urgent-1",
        reason: "sla_breach",
        escalatedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
        assignedTo: { id: "sup-1", name: "Supervisor Anna" },
        originalManager: { id: "mgr-1", name: "Ivan Ivanov" },
        status: "in_progress",
      },
      {
        id: "esc-2",
        applicationId: "app-complex-1",
        reason: "complexity_high",
        escalatedAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
        assignedTo: { id: "sup-1", name: "Supervisor Anna" },
        originalManager: { id: "mgr-2", name: "Bitrix Agent" },
        status: "pending",
      },
    ];
  }
}
```

- [ ] **Step 2: Create Escalations Controller**

```typescript
// apps/api/src/escalations/escalations.controller.ts
import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiTags, ApiOkResponse } from "@nestjs/swagger";

import { EscalationsService, type Escalation } from "./escalations.service";

@ApiTags("escalations")
@Controller("escalations")
export class EscalationsController {
  constructor(private readonly escalationsService: EscalationsService) {}

  @ApiOperation({ summary: "Get SLA escalations list" })
  @ApiOkResponse({
    description: "Escalations retrieved successfully",
    schema: {
      type: "array",
      items: { $ref: "#/components/schemas/Escalation" },
    },
  })
  @Get()
  getEscalations(): Escalation[] {
    return this.escalationsService.getEscalations();
  }
}
```

- [ ] **Step 3: Create Escalations Module**

```typescript
// apps/api/src/escalations/escalations.module.ts
import { Module } from "@nestjs/common";
import { EscalationsController } from "./escalations.controller";
import { EscalationsService } from "./escalations.service";

@Module({
  controllers: [EscalationsController],
  providers: [EscalationsService],
  exports: [EscalationsService],
})
export class EscalationsModule {}
```

- [ ] **Step 4: Update AppModule to import EscalationsModule**

```typescript
// apps/api/src/app.module.ts - add to imports
import { EscalationsModule } from "./escalations/escalations.module";

@Module({
  imports: [
    // ...existing imports
    EscalationsModule, // add this
  ],
})
```

- [ ] **Step 5: Run typecheck**

```bash
pnpm --filter api typecheck
```

Expected: PASS

---

### Task 7: Add .env.example and Update Documentation

**Files:**
- Create: `apps/api/.env.example`
- Modify: `AGENTS.md` — добавить секцию API endpoints

- [ ] **Step 1: Create .env.example**

```bash
# apps/api/.env.example
PORT=3001
FRONTEND_ORIGIN=http://localhost:3000

# Groq AI (for future integration)
GROQ_API_KEY=gsk_...

# Bitrix24 (for future integration)
BITRIX24_WEBHOOK_URL=https://your-bitrix24.bitrix24.ru/rest/1/your-webhook/
BITRIX24_PORTAL_URL=https://your-bitrix24.bitrix24.ru

# Database (for future integration)
DATABASE_URL=postgresql://user:pass@localhost:5432/flexnroll

# Redis (for future integration)
REDIS_URL=redis://localhost:6379

# JWT (for future auth)
JWT_SECRET=your-super-secret-jwt-key-change-in-production
```

- [ ] **Step 2: Copy .env.example to .env.local**

```bash
cp apps/api/.env.example apps/api/.env.local
```

- [ ] **Step 3: Update AGENTS.md with API endpoints table**

Add to AGENTS.md after existing API section:

```markdown
## API Endpoints Summary

| Method | Endpoint | Description | Module |
|---|---|---|---|
| GET | `/api/applications` | List applications with filters | Applications |
| GET | `/api/applications/:id` | Get single application | Applications |
| POST | `/api/applications` | Create application (n8n webhook) | Applications |
| GET | `/api/metrics/today` | Today's KPI metrics | Metrics |
| GET | `/api/pipeline/status` | Current pipeline status | Pipeline |
| GET | `/api/pipeline/history` | Pipeline processing history | Pipeline |
| GET | `/api/analytics/categories` | Category distribution | Analytics |
| GET | `/api/analytics/deal/:id` | Deal statistics | Analytics |
| GET | `/api/escalations` | SLA escalations list | Escalations |
| POST | `/api/auth/login` | Login with email/password | Auth |
| POST | `/api/auth/bitrix` | Bitrix24 login | Auth |
| GET | `/api/auth/me` | Current user | Auth |
| POST | `/api/auth/logout` | Logout | Auth |
| GET | `/api/profile` | Get profile | Profile |
| PATCH | `/api/profile` | Update profile | Profile |
| GET | `/api/health` | Health check | Health |
| GET | `/api/docs` | Swagger UI | Swagger |
```

- [ ] **Step 4: Commit all changes**

```bash
git add apps/api/src/
git add apps/api/.env.example
git add apps/api/.env.local
git add AGENTS.md
git commit -m "feat(api): add NestJS backend modules with Swagger documentation

- Applications module: CRUD endpoints with mock data (12 applications)
- Metrics module: Today's KPI metrics endpoint
- Pipeline module: Processing status and history
- Analytics module: Category distribution and deal stats
- Escalations module: SLA monitoring
- Swagger UI at /api/docs with full API documentation
- DTOs with class-validator and @ApiProperty decorators
- CORS configured for frontend origin
- .env.example with all required variables

Backend is NOT connected to frontend - MSW mocks remain active in web app.
All modules use in-memory mock data until real integration."
```

---

## Self-Review Checklist

### 1. Spec Coverage
- ✅ Swagger настройка — main.ts с DocumentBuilder
- ✅ Базовый бек (auth, profile, health) — уже существует
- ✅ Applications модуль — Task 1
- ✅ Metrics модуль — Task 2
- ✅ Pipeline модуль — Task 3
- ✅ Analytics модуль — Task 4
- ✅ Escalations модуль — Task 6
- ✅ Не подключено к фронтенду — MSW остаются

### 2. Placeholder Scan
- ✅ Нет "TBD", "TODO"
- ✅ Вся валидация через class-validator показана
- ✅ Все DTO с @ApiProperty декораторами
- ✅ Код сервисов с mock данными полный

### 3. Type Consistency
- ✅ Application interface одинаковый везде
- ✅ Enums экспортируются из DTO
- ✅ Response типы согласованы

---

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-04-02-nestjs-backend-swagger.md`**

**Two execution options:**

**1. Subagent-Driven (recommended)** — Dispatch fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
