import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

/**
 * API ключи которые НЕ требуют проверки (публичные endpoints)
 */
const PUBLIC_PATHS = [
  '/api/health',
  '/api/docs',
  '/api/docs-json',
  '/favicon.ico',
  '/',
];

/**
 * ApiKeyGuard — защита эндпоинтов через x-api-key заголовок
 *
 * Не использует @nestjs/passport — всё в одном файле.
 */
@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    // Публичные endpoints не требуют API key
    if (PUBLIC_PATHS.some(path => request.path.startsWith(path))) {
      return true;
    }

    const apiKeyHeader = request.headers['x-api-key'] as string | undefined;
    const authHeader = request.headers['authorization'] as string | undefined;
    
    let apiKey = apiKeyHeader;
    if (!apiKey && authHeader && authHeader.startsWith('Bearer ')) {
      apiKey = authHeader.substring(7);
    }
    
    const expectedKey = this.configService.get<string>('API_SECRET_KEY');

    if (!expectedKey) {
      // Если ключ не настроен — разрешаем все (для разработки)
      return true;
    }

    if (!apiKey || apiKey !== expectedKey) {
      throw new UnauthorizedException('Invalid or missing API key');
    }

    return true;
  }
}
