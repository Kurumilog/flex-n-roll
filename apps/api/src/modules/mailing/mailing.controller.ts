import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { MailingService, MailingCandidate, MailingStats } from './mailing.service';
import { SendMailingDto, MailingChannel } from './dto/send-mailing.dto';

@ApiTags('mailing')
@Controller('mailing')
export class MailingController {
  constructor(private readonly mailingService: MailingService) {}

  @Get('candidates')
  @ApiOperation({
    summary: 'Лиды для реактивационной рассылки',
    description:
      'Лиды без активности > N дней, исключая терминальные статусы отказа.',
  })
  @ApiQuery({
    name: 'inactiveDays',
    required: false,
    description: 'Минимальное количество дней без активности',
    example: 30,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Максимальное количество кандидатов',
    example: 50,
  })
  @ApiResponse({
    status: 200,
    description: 'Список кандидатов для рассылки',
  })
  async getCandidates(
    @Query('inactiveDays', new DefaultValuePipe(30), ParseIntPipe) inactiveDays: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ): Promise<{
    success: boolean;
    data: {
      candidates: MailingCandidate[];
      total: number;
    };
  }> {
    const candidates = await this.mailingService.getCandidates(inactiveDays, limit);

    return {
      success: true,
      data: {
        candidates,
        total: candidates.length,
      },
    };
  }

  @Post('send')
  @ApiOperation({
    summary: 'Запустить рассылку по кандидатам',
    description: 'Вызывается n8n cron ежедневно в 09:00.',
  })
  @ApiResponse({
    status: 200,
    description: 'Результат рассылки',
  })
  async sendMailing(
    @Body() dto: SendMailingDto,
  ): Promise<{
    success: boolean;
    data: {
      sent: number;
      failed: number;
      total: number;
    };
  }> {
    // Получить кандидатов по ID
    // Примечание: в реальной реализации можно загрузить из LeadCache
    // Здесь для простоты используем заглушку
    const results = await Promise.all(
      dto.leadIds.map(async (leadId) => {
        // TODO: Загрузить данные лида из LeadCache
        const candidate: MailingCandidate = {
          leadId,
          clientName: null,
          clientEmail: null,
          companyTitle: null,
          inactiveDays: 30,
          statusName: 'UNKNOWN',
          comments: null,
        };

        return this.mailingService.sendToCandidate(
          candidate,
          dto.channel ?? MailingChannel.EMAIL,
        );
      }),
    );

    const sent = results.filter((r) => r.status === 'sent').length;
    const failed = results.filter((r) => r.status === 'failed').length;

    return {
      success: true,
      data: {
        sent,
        failed,
        total: results.length,
      },
    };
  }

  @Get('stats')
  @ApiOperation({
    summary: 'Статистика отправленных рассылок за последние 30 дней',
  })
  @ApiResponse({
    status: 200,
    description: 'Статистика рассылок',
  })
  async getStats(): Promise<{
    success: boolean;
    data: MailingStats;
  }> {
    const stats = await this.mailingService.getStats();

    return {
      success: true,
      data: stats,
    };
  }
}
