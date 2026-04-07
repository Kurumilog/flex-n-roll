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

describe("ProfileController (e2e)", () => {
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

  const loginAndGetAgent = async () => {
    const agent = request.agent(app.getHttpServer());

    await agent
      .post("/api/auth/login")
      .send({
        email: "demo@flexnroll.ai",
        password: process.env.DEMO_PASSWORD || "demo12345",
      })
      .expect(201);

    return agent;
  };

  describe("GET /api/profile", () => {
    it("should return 401 without session", () => {
      return request(app.getHttpServer()).get("/api/profile").expect(401);
    });

    it("should return profile after login", async () => {
      const agent = await loginAndGetAgent();

      await agent
        .get("/api/profile")
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty("profile");
          expect(res.body.profile).toHaveProperty("id");
          expect(res.body.profile).toHaveProperty("name");
          expect(res.body.profile).toHaveProperty("email");
          expect(res.body.profile.email).toBe("demo@flexnroll.ai");
        });
    });
  });

  describe("PATCH /api/profile", () => {
    it("should return 401 without session", () => {
      return request(app.getHttpServer())
        .patch("/api/profile")
        .send({ name: "New Name" })
        .expect(401);
    });

    it("should update profile name", async () => {
      const agent = await loginAndGetAgent();

      await agent
        .patch("/api/profile")
        .send({ name: "Updated Demo User" })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty("profile");
          expect(res.body.profile.name).toBe("Updated Demo User");
        });
    });

    it("should update profile department", async () => {
      const agent = await loginAndGetAgent();

      await agent
        .patch("/api/profile")
        .send({ department: "Marketing Department" })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty("profile");
          expect(res.body.profile.department).toBe("Marketing Department");
        });
    });

    it("should update profile timezone", async () => {
      const agent = await loginAndGetAgent();

      await agent
        .patch("/api/profile")
        .send({ timezone: "Asia/Tokyo" })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty("profile");
          expect(res.body.profile.timezone).toBe("Asia/Tokyo");
        });
    });

    it("should update profile bio within 280 chars", async () => {
      const agent = await loginAndGetAgent();

      await agent
        .patch("/api/profile")
        .send({ bio: "This is a short bio." })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty("profile");
          expect(res.body.profile.bio).toBe("This is a short bio.");
        });
    });

    it("should reject bio exceeding 280 characters", async () => {
      const agent = await loginAndGetAgent();

      await agent
        .patch("/api/profile")
        .send({ bio: "a".repeat(281) })
        .expect(400);
    });

    it("should reject empty string fields", async () => {
      const agent = await loginAndGetAgent();

      await agent
        .patch("/api/profile")
        .send({ name: "" })
        .expect(400);
    });

    it("should allow partial updates", async () => {
      const agent = await loginAndGetAgent();

      await agent
        .patch("/api/profile")
        .send({ timezone: "Europe/London" })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty("profile");
          expect(res.body.profile.timezone).toBe("Europe/London");
        });
    });

    it("should reject non-whitelisted fields", async () => {
      const agent = await loginAndGetAgent();

      await agent
        .patch("/api/profile")
        .send({ name: "Test User", role: "admin" })
        .expect(400);
    });
  });
});
