# API Dependency Injection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace direct service instantiation (`new Service()`) with proper NestJS dependency injection across all controllers and services.

**Architecture:** All controllers will receive services via constructor injection. Services will be decorated with `@Injectable()` and injected dependencies (like `ConfigService`, `MockAuthStoreService`) will also use constructor DI.

**Tech Stack:** NestJS, TypeScript, @nestjs/config

---

### Task 1: Update ApplicationsController with DI

**Files:**
- Modify: `apps/api/src/applications/applications.controller.ts`

- [ ] **Step 1: Replace direct instantiation with constructor DI**

```typescript
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
    return this.applicationsService.findAll({
      intent: filters.intent,
      urgency: filters.urgency,
      status: filters.status,
      limit: filters.limit,
      offset: filters.offset,
    });
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

- [ ] **Step 2: Commit**

```bash
git add apps/api/src/applications/applications.controller.ts
git commit -m "refactor(api): add DI to ApplicationsController"
```

### Task 2: Update MetricsController with DI

**Files:**
- Modify: `apps/api/src/metrics/metrics.controller.ts`

- [ ] **Step 1: Replace direct instantiation with constructor DI**

```typescript
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
    schema: {
      type: "object",
      properties: {
        totalProcessed: { type: "number", example: 47 },
        aiConfidenceAvg: { type: "number", example: 88 },
        autoRouted: { type: "number", example: 39 },
        manualReview: { type: "number", example: 8 },
        slaCompliance: { type: "number", example: 94 },
      },
    },
  })
  @Get("today")
  getTodayMetrics(): TodayMetrics {
    return this.metricsService.getTodayMetrics();
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/api/src/metrics/metrics.controller.ts
git commit -m "refactor(api): add DI to MetricsController"
```

### Task 3: Update PipelineController with DI

**Files:**
- Modify: `apps/api/src/pipeline/pipeline.controller.ts`

- [ ] **Step 1: Replace direct instantiation with constructor DI**

```typescript
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

- [ ] **Step 2: Commit**

```bash
git add apps/api/src/pipeline/pipeline.controller.ts
git commit -m "refactor(api): add DI to PipelineController"
```

### Task 4: Update AnalyticsController with DI

**Files:**
- Modify: `apps/api/src/analytics/analytics.controller.ts`

- [ ] **Step 1: Replace direct instantiation with constructor DI**

```typescript
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

- [ ] **Step 2: Commit**

```bash
git add apps/api/src/analytics/analytics.controller.ts
git commit -m "refactor(api): add DI to AnalyticsController"
```

### Task 5: Update EscalationsController with DI

**Files:**
- Modify: `apps/api/src/escalations/escalations.controller.ts`

- [ ] **Step 1: Replace direct instantiation with constructor DI**

```typescript
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

- [ ] **Step 2: Commit**

```bash
git add apps/api/src/escalations/escalations.controller.ts
git commit -m "refactor(api): add DI to EscalationsController"
```

### Task 6: Update AuthController with DI

**Files:**
- Modify: `apps/api/src/auth/auth.controller.ts`

- [ ] **Step 1: Replace direct instantiation with constructor DI and add Swagger decorators**

```typescript
import { Body, Controller, Get, Post, Req, Res } from "@nestjs/common";
import { ApiOperation, ApiTags, ApiBody, ApiCookieAuth } from "@nestjs/swagger";
import type { Request, Response } from "express";

import { AuthService } from "./auth.service";
import { BitrixLoginDto } from "./dto/bitrix-login.dto";
import { LoginDto } from "./dto/login.dto";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: "Login with email/password" })
  @ApiBody({ type: LoginDto })
  @Post("login")
  login(
    @Body() payload: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.authService.login(payload, response);
  }

  @ApiOperation({ summary: "Stub Bitrix login" })
  @Post("bitrix")
  loginWithBitrix(
    @Body() payload: BitrixLoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.authService.loginWithBitrix(payload, response);
  }

  @ApiOperation({ summary: "Current authenticated user" })
  @ApiCookieAuth("flexnroll_session")
  @Get("me")
  me(@Req() request: Request) {
    return this.authService.getMe(request);
  }

  @ApiOperation({ summary: "Logout and clear session cookie" })
  @ApiCookieAuth("flexnroll_session")
  @Post("logout")
  logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.authService.logout(request, response);
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/api/src/auth/auth.controller.ts
git commit -m "refactor(api): add DI to AuthController with Swagger decorators"
```

### Task 7: Update AuthService with ConfigService DI

**Files:**
- Modify: `apps/api/src/auth/auth.service.ts`

- [ ] **Step 1: Inject ConfigService and MockAuthStoreService via constructor**

```typescript
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Request, Response } from "express";

import { SESSION_COOKIE_NAME, SESSION_TTL_MS } from "../common/session.constants";
import { MockAuthStoreService } from "../core/mock-auth-store.service";
import { BitrixLoginDto } from "./dto/bitrix-login.dto";
import { LoginDto } from "./dto/login.dto";

@Injectable()
export class AuthService {
  private readonly demoPassword: string;

  constructor(
    private readonly store: MockAuthStoreService,
    private readonly configService: ConfigService,
  ) {
    this.demoPassword = this.configService.get<string>('DEMO_PASSWORD') || 'demo12345';
  }

  login(payload: LoginDto, response: Response) {
    if (payload.password !== this.demoPassword) {
      throw new UnauthorizedException("Неверный пароль. Для демо используйте demo12345.");
    }

    const session = this.store.loginWithEmail(payload.email);
    this.setSessionCookie(response, session.sessionId);
    return session;
  }

  loginWithBitrix(_payload: BitrixLoginDto, response: Response) {
    const session = this.store.loginWithBitrix();
    this.setSessionCookie(response, session.sessionId);
    return session;
  }

  getMe(request: Request) {
    const sessionId = this.getSessionId(request);
    const user = this.store.getUserBySessionId(sessionId);

    if (!user) {
      throw new UnauthorizedException("Сессия не найдена.");
    }

    return { user };
  }

  logout(request: Request, response: Response) {
    const sessionId = this.getSessionId(request);
    this.store.revokeSession(sessionId);
    response.clearCookie(SESSION_COOKIE_NAME, {
      path: "/",
      sameSite: "lax",
    });

    return { ok: true };
  }

  private getSessionId(request: Request) {
    return request.cookies?.[SESSION_COOKIE_NAME] as string | undefined;
  }

  private setSessionCookie(response: Response, sessionId: string) {
    response.cookie(SESSION_COOKIE_NAME, sessionId, {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      path: "/",
      maxAge: SESSION_TTL_MS,
    });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/api/src/auth/auth.service.ts
git commit -m "refactor(api): inject ConfigService into AuthService"
```

### Task 8: Update MockAuthStoreService

**Files:**
- Modify: `apps/api/src/core/mock-auth-store.service.ts`

- [ ] **Step 1: Update method signature (loginWithPassword -> loginWithEmail)**

Service already uses `@Injectable()`. No constructor DI needed (no dependencies). Just update the method name to match AuthService usage.

```typescript
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { randomUUID } from "crypto";

import { SESSION_TTL_MS } from "../common/session.constants";
import type { SessionRecord, UserRecord } from "../common/user.types";

type SessionResponse = {
  sessionId: string;
  user: Omit<UserRecord, "bio">;
  expiresAt: string;
};

type ProfileResponse = {
  profile: UserRecord;
};

@Injectable()
export class MockAuthStoreService {
  private users = new Map<string, UserRecord>([
    [
      "mgr-1",
      {
        id: "mgr-1",
        name: "Ivan Ivanov",
        email: "demo@flexnroll.ai",
        role: "manager",
        department: "Sales",
        timezone: "Europe/Minsk",
        bio: "Контролирую маршрутизацию и качество ответов по входящим заявкам.",
        avatar: "https://picsum.photos/seed/flexnroll-api-1/96/96",
      },
    ],
    [
      "mgr-2",
      {
        id: "mgr-2",
        name: "Bitrix Agent",
        email: "bitrix@flexnroll.ai",
        role: "supervisor",
        department: "Operations",
        timezone: "Europe/Minsk",
        bio: "Отвечаю за Bitrix24 sync и SLA-эскалации.",
        avatar: "https://picsum.photos/seed/flexnroll-api-2/96/96",
      },
    ],
  ]);

  private sessions = new Map<string, SessionRecord>();

  loginWithEmail(email: string): SessionResponse {
    const user = this.ensureUser(email);
    return this.createSession(user);
  }

  loginWithBitrix(): SessionResponse {
    const user = this.users.get("mgr-2");
    if (!user) {
      throw new UnauthorizedException("Пользователь Bitrix недоступен.");
    }

    return this.createSession(user);
  }

  getUserBySessionId(sessionId?: string): Omit<UserRecord, "bio"> | null {
    const user = this.resolveUser(sessionId);
    if (!user) {
      return null;
    }

    return this.toAuthUser(user);
  }

  getProfileBySessionId(sessionId?: string): ProfileResponse | null {
    const user = this.resolveUser(sessionId);
    if (!user) {
      return null;
    }

    return { profile: user };
  }

  updateProfileBySessionId(
    sessionId: string | undefined,
    payload: {
      name?: string;
      department?: string;
      timezone?: string;
      bio?: string;
    },
  ): ProfileResponse | null {
    const user = this.resolveUser(sessionId);
    if (!user) {
      return null;
    }

    const nextUser: UserRecord = {
      ...user,
      name: payload.name ?? user.name,
      department: payload.department ?? user.department,
      timezone: payload.timezone ?? user.timezone,
      bio: payload.bio ?? user.bio,
    };
    this.users.set(user.id, nextUser);

    return { profile: nextUser };
  }

  revokeSession(sessionId?: string) {
    if (!sessionId) {
      return;
    }

    this.sessions.delete(sessionId);
  }

  private createSession(user: UserRecord): SessionResponse {
    const sessionId = randomUUID();
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();
    this.sessions.set(sessionId, {
      id: sessionId,
      userId: user.id,
      expiresAt,
    });

    return {
      sessionId,
      user: this.toAuthUser(user),
      expiresAt,
    };
  }

  private resolveUser(sessionId?: string): UserRecord | null {
    if (!sessionId) {
      return null;
    }

    const session = this.sessions.get(sessionId);
    if (!session) {
      return null;
    }

    if (new Date(session.expiresAt).getTime() <= Date.now()) {
      this.sessions.delete(sessionId);
      return null;
    }

    return this.users.get(session.userId) ?? null;
  }

  private ensureUser(email: string): UserRecord {
    for (const user of this.users.values()) {
      if (user.email.toLowerCase() === email.toLowerCase()) {
        return user;
      }
    }

    const id = `mgr-${this.users.size + 1}`;
    const name = email
      .split("@")[0]
      .replace(/[._-]/g, " ")
      .replace(/\b\w/g, (chunk) => chunk.toUpperCase());
    const user: UserRecord = {
      id,
      name,
      email,
      role: "manager",
      department: "Sales",
      timezone: "Europe/Minsk",
      bio: "Новый участник демонстрационного workspace.",
      avatar: `https://picsum.photos/seed/flexnroll-api-${id}/96/96`,
    };

    this.users.set(id, user);
    return user;
  }

  private toAuthUser(user: UserRecord) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      timezone: user.timezone,
      avatar: user.avatar,
    };
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/api/src/core/mock-auth-store.service.ts
git commit -m "refactor(api): rename loginWithPassword to loginWithEmail in MockAuthStoreService"
```

### Task 9: Update ProfileController with DI

**Files:**
- Modify: `apps/api/src/profile/profile.controller.ts`

- [ ] **Step 1: Replace direct instantiation with constructor DI**

```typescript
import { Body, Controller, Get, Patch, Req } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import type { Request } from "express";

import { UpdateProfileDto } from "./dto/update-profile.dto";
import { ProfileService } from "./profile.service";

@ApiTags("profile")
@Controller("profile")
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @ApiOperation({ summary: "Current user profile" })
  @Get()
  getProfile(@Req() request: Request) {
    return this.profileService.getProfile(request);
  }

  @ApiOperation({ summary: "Update profile fields (stub)" })
  @Patch()
  updateProfile(
    @Req() request: Request,
    @Body() payload: UpdateProfileDto,
  ) {
    return this.profileService.updateProfile(request, payload);
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/api/src/profile/profile.controller.ts
git commit -m "refactor(api): add DI to ProfileController"
```

### Task 10: Update ProfileService with DI

**Files:**
- Modify: `apps/api/src/profile/profile.service.ts`

- [ ] **Step 1: Inject MockAuthStoreService via constructor**

```typescript
import { Injectable, UnauthorizedException } from "@nestjs/common";
import type { Request } from "express";

import { SESSION_COOKIE_NAME } from "../common/session.constants";
import { MockAuthStoreService } from "../core/mock-auth-store.service";
import { UpdateProfileDto } from "./dto/update-profile.dto";

@Injectable()
export class ProfileService {
  constructor(private readonly store: MockAuthStoreService) {}

  getProfile(request: Request) {
    const sessionId = this.getSessionId(request);
    const profile = this.store.getProfileBySessionId(sessionId);
    if (!profile) {
      throw new UnauthorizedException("Сессия не найдена.");
    }

    return profile;
  }

  updateProfile(request: Request, payload: UpdateProfileDto) {
    const sessionId = this.getSessionId(request);
    const profile = this.store.updateProfileBySessionId(sessionId, payload);
    if (!profile) {
      throw new UnauthorizedException("Сессия не найдена.");
    }

    return profile;
  }

  private getSessionId(request: Request) {
    return request.cookies?.[SESSION_COOKIE_NAME] as string | undefined;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/api/src/profile/profile.service.ts
git commit -m "refactor(api): inject MockAuthStoreService into ProfileService"
```

### Task 11: Run Typecheck and Verify Server

**Files:**
- N/A (verification task)

- [ ] **Step 1: Run TypeScript typecheck**

```bash
pnpm --filter api typecheck
```

Expected: PASS (no type errors)

- [ ] **Step 2: Start server and verify health endpoint**

```bash
cd apps/api
pnpm dev
```

Then in another terminal:
```bash
curl http://localhost:3001/api/health
```

Expected: Server starts without DI errors, health endpoint returns OK

- [ ] **Step 3: Create final commit with all changes**

```bash
git add apps/api/src/
git commit -m "refactor(api): return proper dependency injection

- Replace direct instantiation with constructor DI
- Inject ConfigService into AuthService
- Move password validation to AuthService
- Add @ApiCookieAuth and @ApiBody decorators
- Add @ApiParam for path parameters
- All controllers now properly inject services"
```
