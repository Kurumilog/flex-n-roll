import { Controller, Get, Post, Param, ParseIntPipe } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { KpiService, EmployeeKpi } from './kpi.service';

@ApiTags('kpi')
@Controller('kpi')
export class KpiController {
  constructor(private readonly kpiService: KpiService) {}

  @Get()
  @ApiOperation({
    summary: 'Текущий KPI всех сотрудников',
  })
  @ApiResponse({
    status: 200,
    description: 'Список сотрудников с KPI',
  })
  async getCurrentKpi(): Promise<{
    success: boolean;
    data: EmployeeKpi[];
  }> {
    const result = await this.kpiService.getCurrentKpi();

    return {
      success: true,
      data: result,
    };
  }

  @Post('recalculate')
  @ApiOperation({
    summary: 'Принудительный пересчёт KPI из Bitrix24',
    description: 'Вызывается n8n cron ежедневно в 00:00.',
  })
  @ApiResponse({
    status: 200,
    description: 'KPI пересчитан',
    schema: {
      example: {
        success: true,
        message: 'KPI recalculated for 15 employees',
      },
    },
  })
  async recalculateAllKpi(): Promise<{
    success: boolean;
    message: string;
  }> {
    const results = await this.kpiService.recalculateAllKpi();

    return {
      success: true,
      message: `KPI recalculated for ${results.length} employees`,
    };
  }

  @Get(':id')
  @ApiOperation({
    summary: 'KPI конкретного сотрудника + история',
  })
  @ApiParam({
    name: 'id',
    description: 'Bitrix24 ID сотрудника',
    example: 13,
  })
  @ApiResponse({
    status: 200,
    description: 'KPI + история',
  })
  async getEmployeeKpi(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{
    success: boolean;
    data: {
      current: EmployeeKpi | null;
      history: Array<{
        period: Date;
        kpiScore: number;
        dealsWon: number;
        dealsLost: number;
      }>;
    };
  }> {
    const [current, history] = await Promise.all([
      this.kpiService.getCurrentKpi().then((kpis) => kpis.find((k) => k.id === id) ?? null),
      this.kpiService.getKpiHistory(id),
    ]);

    return {
      success: true,
      data: { current, history },
    };
  }
}
