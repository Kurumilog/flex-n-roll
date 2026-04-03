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

describe("HealthController (e2e)", () => {
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

    // Add root redirect route (normally set up in main.ts bootstrap)
    const expressApp = app.getHttpAdapter().getInstance();
    expressApp.get("/", (req: Request, res: Response) => {
      res.redirect(307, "/api/docs");
    });

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe("GET /api/health", () => {
    it("should return 200 OK with health status", () => {
      return request(app.getHttpServer())
        .get("/api/health")
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty("status", "ok");
          expect(res.body).toHaveProperty("timestamp");
          expect(res.body).toHaveProperty("service", "flex-n-roll-api");
        });
    });
  });

  describe("GET /", () => {
    it("should redirect to API docs", () => {
      return request(app.getHttpServer())
        .get("/")
        .expect(307)
        .expect("Location", "/api/docs");
    });
  });
});
