import { Test, TestingModule } from "@nestjs/testing";
import {
  INestApplication,
  ValidationPipe,
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
  HttpException,
} from "@nestjs/common";
import request from "supertest";
import cookieParser from "cookie-parser";
import { Request, Response } from "express";
import { AppModule } from "../src/app.module";

@Catch()
class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();

      if (status >= 500) {
        this.logger.error(
          `${exception.message}`,
          `${request.method} ${request.url}`,
        );
      }

      const responseBody = exception.getResponse();
      const errorResponse =
        typeof responseBody === "string"
          ? { statusCode: status, message: responseBody, error: exception.name }
          : {
              statusCode: status,
              ...(responseBody as Record<string, unknown>),
            };

      response.status(status).json(errorResponse);
      return;
    }

    const message =
      exception instanceof Error ? exception.message : "Unknown error";

    this.logger.error(
      `Unhandled exception: ${message}`,
      `${request.method} ${request.url}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    const isDev = process.env.NODE_ENV === "development";
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: isDev ? message : "Internal server error",
      ...(isDev && exception instanceof Error ? { error: exception.stack } : {}),
    });
  }
}

describe("Metrics and Pipeline and Escalations (e2e)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new GlobalExceptionFilter());
    app.setGlobalPrefix("api");
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    app.use(cookieParser());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe("GET /api/metrics/today", () => {
    it("should return today's KPI metrics", () => {
      return request(app.getHttpServer())
        .get("/api/metrics/today")
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty("totalProcessed");
          expect(res.body).toHaveProperty("aiConfidenceAvg");
          expect(res.body).toHaveProperty("autoRouted");
          expect(res.body).toHaveProperty("manualReview");
          expect(res.body).toHaveProperty("slaCompliance");
          expect(res.body.totalProcessed).toBe(47);
          expect(res.body.aiConfidenceAvg).toBe(88);
        });
    });
  });

  describe("GET /api/pipeline/status", () => {
    it("should return pipeline status with steps", () => {
      return request(app.getHttpServer())
        .get("/api/pipeline/status")
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty("steps");
          expect(Array.isArray(res.body.steps)).toBe(true);
          expect(res.body.steps).toHaveLength(7);
          expect(res.body.steps[0]).toHaveProperty("id");
          expect(res.body.steps[0]).toHaveProperty("label");
          expect(res.body.steps[0]).toHaveProperty("status");
        });
    });

    it("should have correct step labels", async () => {
      const response = await request(app.getHttpServer())
        .get("/api/pipeline/status")
        .expect(200);

      const labels = response.body.steps.map((s: any) => s.label);

      expect(labels).toContain("Webhook Received");
      expect(labels).toContain("AI Parsing");
      expect(labels).toContain("Manager Assignment");
    });
  });

  describe("GET /api/pipeline/history", () => {
    it("should return last 5 pipeline histories", () => {
      return request(app.getHttpServer())
        .get("/api/pipeline/history")
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body).toHaveLength(5);
          expect(res.body[0]).toHaveProperty("steps");
        });
    });

    it("should have all steps with done status in history", async () => {
      const response = await request(app.getHttpServer())
        .get("/api/pipeline/history")
        .expect(200);

      response.body.forEach((entry: any) => {
        entry.steps.forEach((step: any) => {
          expect(step.status).toBe("done");
        });
      });
    });
  });

  describe("GET /api/escalations", () => {
    it("should return escalations list", () => {
      return request(app.getHttpServer())
        .get("/api/escalations")
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
          expect(res.body[0]).toHaveProperty("id");
          expect(res.body[0]).toHaveProperty("applicationId");
          expect(res.body[0]).toHaveProperty("reason");
          expect(res.body[0]).toHaveProperty("status");
        });
    });

    it("should have valid escalation reasons", async () => {
      const response = await request(app.getHttpServer())
        .get("/api/escalations")
        .expect(200);

      const validReasons = ["sla_breach", "manual_escalation", "complexity_high"];

      response.body.forEach((escalation: any) => {
        expect(validReasons).toContain(escalation.reason);
      });
    });
  });

  describe("POST /api/auth/bitrix", () => {
    it("should login with Bitrix stub and return session", () => {
      return request(app.getHttpServer())
        .post("/api/auth/bitrix")
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty("sessionId");
          expect(res.body).toHaveProperty("expiresAt");
        });
    });

    it("should set session cookie", async () => {
      const response = await request(app.getHttpServer())
        .post("/api/auth/bitrix")
        .expect(201);

      expect(response.headers["set-cookie"]).toBeDefined();
      const cookies = response.headers["set-cookie"];
      const hasSessionCookie = cookies.some((c: string) =>
        c.includes("flexnroll_session"),
      );
      expect(hasSessionCookie).toBe(true);
    });
  });

  describe("Validation error responses", () => {
    it("should reject POST /api/applications with missing required fields", () => {
      return request(app.getHttpServer())
        .post("/api/applications")
        .send({})
        .expect(400);
    });

    it("should reject POST /api/applications with invalid enum values", () => {
      return request(app.getHttpServer())
        .post("/api/applications")
        .send({
          source: "invalid",
          rawText: "This is a valid application text",
          intent: "invalid",
          urgency: "invalid",
          complexity: "invalid",
          aiConfidence: 50,
          assignedTo: {
            id: "550e8400-e29b-41d4-a716-446655440000",
            name: "Test User",
          },
        })
        .expect(400);
    });

    it("should reject POST /api/applications with extra non-whitelisted fields", () => {
      return request(app.getHttpServer())
        .post("/api/applications")
        .send({
          source: "email",
          rawText: "This is a valid application text",
          intent: "commercial",
          urgency: "medium",
          complexity: "low",
          aiConfidence: 50,
          assignedTo: {
            id: "550e8400-e29b-41d4-a716-446655440000",
            name: "Test User",
          },
          extraField: "should be rejected",
        })
        .expect(400);
    });

    it("should reject PATCH /api/profile with invalid bio length", async () => {
      const agent = request.agent(app.getHttpServer());

      await agent
        .post("/api/auth/login")
        .send({
          email: "demo@flexnroll.ai",
          password: process.env.DEMO_PASSWORD || "demo12345",
        })
        .expect(201);

      await agent
        .patch("/api/profile")
        .send({ bio: "a".repeat(300) })
        .expect(400);
    });

    it("should reject POST /api/auth/login with short password", () => {
      return request(app.getHttpServer())
        .post("/api/auth/login")
        .send({
          email: "demo@flexnroll.ai",
          password: "123",
        })
        .expect(400);
    });
  });
});
