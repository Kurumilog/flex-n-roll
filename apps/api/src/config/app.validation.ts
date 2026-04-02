import { plainToClass } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString, validateSync } from 'class-validator';

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

  @IsString()
  @IsOptional()
  GROQ_API_KEY?: string;

  @IsString()
  @IsOptional()
  BITRIX24_WEBHOOK_URL?: string;

  @IsString()
  @IsOptional()
  JWT_SECRET?: string;
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
