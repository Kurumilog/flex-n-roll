import { Controller, Get } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { DashboardService, DashboardSummary } from './dashboard.service';

@ApiTags('dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  @ApiOperation({
    summary: 'Агрегированный дашборд: менеджеры + KPI + диалоги + задачи',
    description:
      'Один запрос для фронтенда iframe. Возвращает всех менеджеров с KPI, ' +
      'количество активных диалогов и открытых задач, а также статистику рассылок.',
  })
  @ApiResponse({
    status: 200,
    description: 'Сводка для дашборда',
  })
  async getSummary(): Promise<{
    success: boolean;
    data: DashboardSummary;
  }> {
    const result = await this.dashboardService.getSummary();

    return {
      success: true,
      data: result,
    };
  }
}
