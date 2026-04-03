import { Test, TestingModule } from "@nestjs/testing";
import {
  INestApplication,
  ValidationPipe,
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import request from "supertest";
import cookieParser from "cookie-parser";
import { Request, Response } from "express";
import { AppModule } from "../src/app.module";

/**
 * Global exception filter matching main.ts configuration.
 * Only logs server errors (500) and skips expected 404/401 errors.
 */
@Catch()
class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = "Internal server error";

    if (exception && typeof exception === "object" && "status" in exception) {
      status = (exception as any).status;
      message =
        (exception as any).response?.message ||
        (exception as any).message ||
        message;
    }

    if (status === HttpStatus.NOT_FOUND || status === HttpStatus.UNAUTHORIZED) {
      response.status(status).json({
        statusCode: status,
        message,
      });
      return;
    }

    this.logger.error(
      `Server Error: ${message}`,
      `${request.method} ${request.url}`,
    );

    response.status(status).json({
      statusCode: status,
      message: "Internal server error",
      error: exception instanceof Error ? exception.message : "Unknown error",
      stack:
        process.env.NODE_ENV === "development" && exception instanceof Error
          ? exception.stack
          : undefined,
    });
  }
}

describe("ApplicationsController (e2e)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new HttpExceptionFilter());
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

  describe("GET /api/applications", () => {
    it("should return applications list", () => {
      return request(app.getHttpServer())
        .get("/api/applications")
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty("items");
          expect(res.body).toHaveProperty("total");
          expect(Array.isArray(res.body.items)).toBe(true);
          expect(res.body.total).toBeGreaterThan(0);
        });
    });

    it("should filter by intent", () => {
      return request(app.getHttpServer())
        .get("/api/applications?intent=commercial")
        .expect(200)
        .expect((res) => {
          expect(res.body.items.every((app: any) => app.intent === "commercial")).toBe(true);
        });
    });

    it("should respect limit parameter", () => {
      return request(app.getHttpServer())
        .get("/api/applications?limit=2")
        .expect(200)
        .expect((res) => {
          expect(res.body.items.length).toBeLessThanOrEqual(2);
        });
    });
  });

  describe("GET /api/applications/:id", () => {
    it("should return application by id", async () => {
      const all = await request(app.getHttpServer()).get("/api/applications");
      const firstId = all.body.items[0].id;

      return request(app.getHttpServer())
        .get(`/api/applications/${firstId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(firstId);
        });
    });

    it("should return error for non-existent id", () => {
      return request(app.getHttpServer())
        .get("/api/applications/non-existent-id")
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty("error");
        });
    });
  });

  describe("POST /api/applications", () => {
    it("should create new application", () => {
      const createDto = {
        source: "email",
        rawText: "Test application for E2E testing purposes",
        intent: "commercial",
        urgency: "low",
        complexity: "low",
        aiConfidence: 85,
        assignedTo: { id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890", name: "Test User" },
      };

      return request(app.getHttpServer())
        .post("/api/applications")
        .send(createDto)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty("id");
          expect(res.body.source).toBe("email");
          expect(res.body.rawText).toBe("Test application for E2E testing purposes");
          expect(res.body.status).toBe("processing");
        });
    });
  });
});
