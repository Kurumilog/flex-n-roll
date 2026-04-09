import "reflect-metadata";

import { ValidationPipe, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import cookieParser from "cookie-parser";
import { Request, Response } from "express";

import { AppModule } from "./app.module";
import { GlobalExceptionFilter } from "./common/filters/global-exception.filter";
import { ApiKeyGuard } from "./common/guards/api-key.guard";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalGuards(new ApiKeyGuard(app.get(ConfigService)));
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
    .setTitle("FlexRouter AI API")
    .setDescription("AI-powered B2B message routing for label manufacturing")
    .setVersion("1.0.0")
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'API_KEY', in: 'header' },
      'api-key',
    )
    .addTag("employees", "Employee management and availability")
    .addTag("routing", "AI message routing")
    .addTag("kpi", "KPI calculation and history")
    .addTag("mailing", "Reactivation email campaigns")
    .addTag("analytics", "Analytics and statistics")
    .addTag("sync", "Bitrix24 synchronization")
    .addTag("health", "Health check")
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("api/docs", app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "FlexRouter AI API Docs",
  });

  const port = configService.get<number>('PORT') || 3000;
  await app.listen(port, '0.0.0.0');

  Logger.log(`🚀 API running on http://localhost:${port}`, "Bootstrap");
  Logger.log(`📚 Swagger docs: http://localhost:${port}/api/docs`, "Bootstrap");
}

void bootstrap();
