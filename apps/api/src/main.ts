import "reflect-metadata";

import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import cookieParser from "cookie-parser";

import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix("api");
  app.use(cookieParser());
  app.enableCors({
    origin: (process.env.FRONTEND_ORIGIN ?? "http://localhost:3000")
      .split(",")
      .map((origin) => origin.trim()),
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

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

  const port = Number(process.env.PORT ?? "3001");
  await app.listen(port);

  console.log(`🚀 API running on http://localhost:${port}`);
  console.log(`📚 Swagger docs: http://localhost:${port}/api/docs`);
}

void bootstrap();
