import { Controller, Get } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';

@ApiTags('analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('funnel')
  @ApiOperation({
    summary: 'Конверсия по статусам лидов',
    description: 'Воронка конверсии из leads_cache.',
  })
  @ApiResponse({
    status: 200,
    description: 'Воронка конверсии',
  })
  async getFunnel(): Promise<{
    success: boolean;
    data: {
      total: number;
      byStatus: Array<{
        statusId: string;
        name: string;
        count: number;
        percentage: number;
      }>;
    };
  }> {
    const result = await this.analyticsService.getFunnel();

    return {
      success: true,
      data: result,
    };
  }

  @Get('rejections')
  @ApiOperation({
    summary: 'Топ причин отказа',
    description: '13 причин отказа (для диаграммы на дашборде).',
  })
  @ApiResponse({
    status: 200,
    description: 'Причины отказа',
  })
  async getRejections(): Promise<{
    success: boolean;
    data: Array<{
      reason: string;
      count: number;
    }>;
  }> {
    const result = await this.analyticsService.getRejections();

    return {
      success: true,
      data: result,
    };
  }

  @Get('managers')
  @ApiOperation({
    summary: 'Сводка по менеджерам',
    description: 'KPI, сделки, активные диалоги.',
  })
  @ApiResponse({
    status: 200,
    description: 'Статистика менеджеров',
  })
  async getManagerStats(): Promise<{
    success: boolean;
    data: Array<{
      id: number;
      name: string;
      lastName: string;
      department: string | null;
      kpiScore: number;
      dealsWon: number;
      dealsLost: number;
      isAvailable: boolean;
    }>;
  }> {
    const result = await this.analyticsService.getManagerStats();

    return {
      success: true,
      data: result,
    };
  }

  @Get('mailing')
  @ApiOperation({
    summary: 'Статистика рассылок',
    description: 'Отправлено / получен ответ / конверсия.',
  })
  @ApiResponse({
    status: 200,
    description: 'Статистика рассылок',
  })
  async getMailingStats(): Promise<{
    success: boolean;
    data: {
      total: number;
      sent: number;
      failed: number;
      responseReceived: number;
      responseRate: number;
    };
  }> {
    const result = await this.analyticsService.getMailingStats();

    return {
      success: true,
      data: result,
    };
  }
}
