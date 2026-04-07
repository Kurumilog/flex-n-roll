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

/**
 * Global exception filter matching main.ts configuration.
 * Delegates to NestJS default behavior for HttpExceptions
 * and only logs unexpected server errors (500).
 */
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

describe("AuthController (e2e)", () => {
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

  describe("POST /api/auth/login", () => {
    it("should login with correct credentials", () => {
      return request(app.getHttpServer())
        .post("/api/auth/login")
        .send({
          email: "demo@flexnroll.ai",
          password: process.env.DEMO_PASSWORD || "demo12345",
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty("sessionId");
          expect(res.body).toHaveProperty("user");
          expect(res.body.user.email).toBe("demo@flexnroll.ai");
        });
    });

    it("should reject wrong password", () => {
      return request(app.getHttpServer())
        .post("/api/auth/login")
        .send({
          email: "demo@flexnroll.ai",
          password: "wrongpassword",
        })
        .expect(401);
    });

    it("should reject invalid email", () => {
      return request(app.getHttpServer())
        .post("/api/auth/login")
        .send({
          email: "not-an-email",
          password: "demo12345",
        })
        .expect(400);
    });
  });

  describe("GET /api/auth/me", () => {
    it("should return 401 without session", () => {
      return request(app.getHttpServer()).get("/api/auth/me").expect(401);
    });

    it("should return user after login", async () => {
      const agent = request.agent(app.getHttpServer());

      await agent
        .post("/api/auth/login")
        .send({
          email: "demo@flexnroll.ai",
          password: process.env.DEMO_PASSWORD || "demo12345",
        })
        .expect(201);

      await agent
        .get("/api/auth/me")
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty("user");
          expect(res.body.user.email).toBe("demo@flexnroll.ai");
        });
    });
  });

  describe("POST /api/auth/logout", () => {
    it("should return 201 even without session (graceful handling)", () => {
      return request(app.getHttpServer())
        .post("/api/auth/logout")
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty("ok", true);
        });
    });

    it("should logout successfully after login", async () => {
      const agent = request.agent(app.getHttpServer());

      await agent
        .post("/api/auth/login")
        .send({
          email: "demo@flexnroll.ai",
          password: process.env.DEMO_PASSWORD || "demo12345",
        })
        .expect(201);

      await agent
        .post("/api/auth/logout")
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty("ok", true);
        });
    });

    it("should return 401 for /me after logout", async () => {
      const agent = request.agent(app.getHttpServer());

      await agent
        .post("/api/auth/login")
        .send({
          email: "demo@flexnroll.ai",
          password: process.env.DEMO_PASSWORD || "demo12345",
        })
        .expect(201);

      await agent.post("/api/auth/logout").expect(201);

      await agent.get("/api/auth/me").expect(401);
    });
  });
});
