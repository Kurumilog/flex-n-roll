import { Controller, Post, Body, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RoutingService } from './routing.service';
import { RouteMessageDto } from './dto/route-message.dto';
import { RoutingResultDto } from './dto/routing-result.dto';

@ApiTags('routing')
@Controller('routing')
export class RoutingController {
  private readonly logger = new Logger(RoutingController.name);

  constructor(private readonly routingService: RoutingService) {}

  @Post('route')
  @ApiOperation({
    summary: 'Главный endpoint маршрутизации',
    description:
      'Вызывается n8n после получения сообщения из Bitrix24. ' +
      'Анализирует текст через LLM и выбирает оптимального менеджера.',
  })
  @ApiResponse({
    status: 200,
    description: 'Результат маршрутизации',
    type: RoutingResultDto,
  })
  @ApiResponse({ status: 400, description: 'Невалидные данные' })
  async routeMessage(
    @Body() dto: RouteMessageDto,
  ): Promise<{ success: boolean; data: RoutingResultDto | null }> {
    this.logger.log(
      `Routing request: channel=${dto.channel}, clientPhone=${dto.clientPhone ?? 'N/A'}`,
    );

    const result = await this.routingService.routeMessage(dto);

    return {
      success: true,
      data: result,
    };
  }
}