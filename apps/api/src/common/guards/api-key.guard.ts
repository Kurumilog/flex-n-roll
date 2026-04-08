import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

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
    const apiKey = request.headers['x-api-key'] as string | undefined;
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
