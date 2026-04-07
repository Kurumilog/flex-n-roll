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

describe("AnalyticsController (e2e)", () => {
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

  describe("GET /api/analytics/categories", () => {
    it("should return category distribution", () => {
      return request(app.getHttpServer())
        .get("/api/analytics/categories")
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body).toHaveLength(3);
          expect(res.body[0]).toHaveProperty("category");
          expect(res.body[0]).toHaveProperty("count");
          expect(res.body[0]).toHaveProperty("percentage");
        });
    });

    it("should include commercial category with 60%", async () => {
      const response = await request(app.getHttpServer())
        .get("/api/analytics/categories")
        .expect(200);

      const commercial = response.body.find(
        (item: any) => item.category === "commercial",
      );

      expect(commercial).toBeDefined();
      expect(commercial.percentage).toBe(60);
      expect(commercial.count).toBe(28);
    });
  });

  describe("GET /api/analytics/deal/:id", () => {
    it("should return deal stats for existing deal BX-1001", () => {
      return request(app.getHttpServer())
        .get("/api/analytics/deal/BX-1001")
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty("dealId", "BX-1001");
          expect(res.body).toHaveProperty("totalAmount");
          expect(res.body).toHaveProperty("stage");
          expect(res.body).toHaveProperty("probability");
        });
    });

    it("should return deal stats for existing deal BX-1002", () => {
      return request(app.getHttpServer())
        .get("/api/analytics/deal/BX-1002")
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty("dealId", "BX-1002");
          expect(res.body.totalAmount).toBe(15000);
        });
    });

    it("should return 404 for non-existing deal", () => {
      return request(app.getHttpServer())
        .get("/api/analytics/deal/BX-9999")
        .expect(404);
    });

    it("should return 404 for empty dealId", () => {
      return request(app.getHttpServer())
        .get("/api/analytics/deal/")
        .expect(404);
    });
  });
});
