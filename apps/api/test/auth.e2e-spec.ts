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

describe("AuthController (e2e)", () => {
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
