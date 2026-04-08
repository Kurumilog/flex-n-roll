import { plainToClass } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsBoolean,
  validateSync,
} from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

export class EnvironmentVariables {
  @IsEnum(Environment)
  @IsOptional()
  NODE_ENV?: Environment;

  @IsNumber()
  @IsOptional()
  PORT?: number;

  @IsString()
  @IsOptional()
  FRONTEND_ORIGIN?: string;

  @IsString()
  @IsOptional()
  DEMO_PASSWORD?: string;

  // ============================================================
  // Database
  // ============================================================

  @IsString()
  @IsOptional()
  DATABASE_URL?: string;

  // ============================================================
  // Bitrix24
  // ============================================================

  @IsString()
  @IsOptional()
  BITRIX24_WEBHOOK_URL?: string;

  @IsString()
  @IsOptional()
  BITRIX24_INCOMING_SECRET?: string;

  // ============================================================
  // Ollama
  // ============================================================

  @IsString()
  @IsOptional()
  OLLAMA_BASE_URL?: string;

  @IsString()
  @IsOptional()
  OLLAMA_ROUTING_MODEL?: string;

  @IsNumber()
  @IsOptional()
  OLLAMA_TIMEOUT_MS?: number;

  // ============================================================
  // Email (SMTP)
  // ============================================================

  @IsString()
  @IsOptional()
  SMTP_HOST?: string;

  @IsNumber()
  @IsOptional()
  SMTP_PORT?: number;

  @IsString()
  @IsOptional()
  SMTP_USER?: string;

  @IsString()
  @IsOptional()
  SMTP_PASS?: string;

  @IsString()
  @IsOptional()
  SMTP_FROM?: string;

  // ============================================================
  // App
  // ============================================================

  @IsString()
  @IsOptional()
  API_SECRET_KEY?: string;

  @IsString()
  @IsOptional()
  GROQ_API_KEY?: string;

  @IsString()
  @IsOptional()
  JWT_SECRET?: string;

  // ============================================================
  // n8n
  // ============================================================

  @IsString()
  @IsOptional()
  N8N_BASE_URL?: string;
}

export function validate(config: Record<string, unknown>) {
  // Pre-process config to convert string numbers to actual numbers
  const processedConfig: Record<string, unknown> = { ...config };
  if (typeof processedConfig.PORT === 'string') {
    const portNum = Number(processedConfig.PORT);
    if (!isNaN(portNum)) {
      processedConfig.PORT = portNum;
    }
  }
  if (typeof processedConfig.SMTP_PORT === 'string') {
    const portNum = Number(processedConfig.SMTP_PORT);
    if (!isNaN(portNum)) {
      processedConfig.SMTP_PORT = portNum;
    }
  }
  if (typeof processedConfig.OLLAMA_TIMEOUT_MS === 'string') {
    const timeoutNum = Number(processedConfig.OLLAMA_TIMEOUT_MS);
    if (!isNaN(timeoutNum)) {
      processedConfig.OLLAMA_TIMEOUT_MS = timeoutNum;
    }
  }

  const validatedConfig = plainToClass(EnvironmentVariables, processedConfig, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: true,
  });

  if (errors.length > 0) {
    const errorStr = errors.toString();
    console.error('Config validation errors:', errorStr);
    throw new Error(errorStr);
  }
  return validatedConfig;
}
