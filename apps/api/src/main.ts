import "reflect-metadata";

import {
  ExceptionFilter,
  ValidationPipe,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { ArgumentsHost, Catch } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import cookieParser from "cookie-parser";
import { Request, Response } from "express";

import { AppModule } from "./app.module";

/**
 * Global exception filter that only logs server errors (500)
 * and skips expected errors like 404 Not Found and 401 Unauthorized
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Extract status code from exception
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = "Internal server error";

    if (
      exception &&
      typeof exception === "object" &&
      "status" in exception
    ) {
      status = (exception as any).status;
      message =
        (exception as any).response?.message ||
        (exception as any).message ||
        message;
    }

    // Skip logging for 404 and 401 - these are expected
    if (status === HttpStatus.NOT_FOUND || status === HttpStatus.UNAUTHORIZED) {
      response.status(status).json({
        statusCode: status,
        message,
      });
      return;
    }

    // Log only server errors (500)
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

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.useGlobalFilters(new HttpExceptionFilter());
  app.setGlobalPrefix("api");
  app.use(cookieParser());
  app.enableCors({
    origin: configService.get<string>('FRONTEND_ORIGIN')?.split(',') || ['http://localhost:3000'],
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Get Express adapter for raw routes
  const expressApp = app.getHttpAdapter().getInstance();

  // Redirect root to Swagger docs
  expressApp.get("/", (req: Request, res: Response) => {
    res.redirect(307, "/api/docs");
  });

  // Favicon endpoint (returns empty 204 to avoid 404 errors)
  expressApp.get("/favicon.ico", (req: Request, res: Response) => {
    res.status(204).send();
  });

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
    .addTag("escalations", "SLA escalation endpoints")
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

  const port = configService.get<number>('PORT') || 3001;
  await app.listen(port);

  console.log(`🚀 API running on http://localhost:${port}`);
  console.log(`📚 Swagger docs: http://localhost:${port}/api/docs`);
  console.log(`📍 Root redirect: http://localhost:${port}/ → /api/docs`);
}

void bootstrap();
