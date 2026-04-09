import { Injectable, Optional } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';

export interface AppConfig {
  nodeEnv: 'development' | 'production' | 'test';
  port: number;
  frontendOrigin: string;
  demoPassword: string;
  groqApiKey?: string;
  bitrix24WebhookUrl?: string;
  jwtSecret?: string;
}

@Injectable()
export class AppConfigService {
  constructor(@Optional() private configService?: NestConfigService) {}

  get nodeEnv(): AppConfig['nodeEnv'] {
    return (this.configService?.get<string>('NODE_ENV') ?? process.env.NODE_ENV ?? 'development') as AppConfig['nodeEnv'];
  }

  get port(): number {
    const fromConfig = this.configService?.get<number>('PORT');
    if (fromConfig !== undefined) return fromConfig;
    const fromEnv = Number(process.env.PORT);
    return isNaN(fromEnv) ? 3001 : fromEnv;
  }

  get frontendOrigin(): string {
    return this.configService?.get<string>('FRONTEND_ORIGIN') ?? process.env.FRONTEND_ORIGIN ?? 'http://localhost:3000';
  }

  get demoPassword(): string {
    return this.configService?.get<string>('DEMO_PASSWORD') ?? process.env.DEMO_PASSWORD ?? 'demo12345';
  }

  get groqApiKey(): string | undefined {
    return this.configService?.get<string>('GROQ_API_KEY') ?? process.env.GROQ_API_KEY;
  }

  get bitrix24WebhookUrl(): string | undefined {
    return this.configService?.get<string>('BITRIX24_WEBHOOK_URL') ?? process.env.BITRIX24_WEBHOOK_URL;
  }

  get jwtSecret(): string | undefined {
    return this.configService?.get<string>('JWT_SECRET') ?? process.env.JWT_SECRET;
  }

  get isDevelopment(): boolean {
    return this.nodeEnv === 'development';
  }

  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  }

  get isTest(): boolean {
    return this.nodeEnv === 'test';
  }
}
