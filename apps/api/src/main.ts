import "reflect-metadata";

import {
  ValidationPipe,
  Logger,
  HttpStatus,
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import cookieParser from "cookie-parser";
import { Request, Response } from "express";

import { AppModule } from "./app.module";

/**
 * Global exception filter that delegates to NestJS default behavior
 * for HttpExceptions and only logs unexpected server errors (500).
 * Produces standard NestJS error response format:
 *   { statusCode, message, error }
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();

      // Only log unexpected 500 errors, skip expected client errors
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

    // Unknown exception — treat as 500
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

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.useGlobalFilters(new GlobalExceptionFilter());
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
