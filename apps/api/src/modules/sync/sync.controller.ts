import { Controller, Get, Post, Logger } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { SyncService } from './sync.service';

@ApiTags('sync')
@Controller('sync')
export class SyncController {
  private readonly logger = new Logger(SyncController.name);

  constructor(private readonly syncService: SyncService) {}

  @Post('leads')
  @ApiOperation({
    summary: 'Синхронизировать лиды из Bitrix24',
    description: 'Вызывается n8n cron каждый час.',
  })
  @ApiResponse({
    status: 200,
    description: 'Результат синхронизации',
  })
  async syncLeads(): Promise<{
    success: boolean;
    data: {
      synced: number;
      error?: string;
    };
  }> {
    this.logger.log('Manual leads sync triggered');
    const result = await this.syncService.syncLeads();

    return {
      success: result.error === undefined,
      data: result,
    };
  }

  @Get('cache-stats')
  @ApiOperation({
    summary: 'Статистика кэша лидов',
  })
  @ApiResponse({
    status: 200,
    description: 'Статистика кэша',
  })
  async getCacheStats(): Promise<{
    success: boolean;
    data: {
      totalLeads: number;
    };
  }> {
    const stats = await this.syncService.getCacheStats();

    return {
      success: true,
      data: stats,
    };
  }
}
