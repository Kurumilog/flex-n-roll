import { applyDecorators, CanActivate, UseGuards } from '@nestjs/common';
import { ApiKeyGuard } from '../guards/api-key.guard';

/**
 * Декоратор для защиты эндпоинтов API-ключом
 * Использование: @RequireApiKey()
 */
export function RequireApiKey(): MethodDecorator & ClassDecorator {
  return applyDecorators(UseGuards(ApiKeyGuard));
}
