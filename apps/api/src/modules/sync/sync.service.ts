import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BitrixService } from '../bitrix/bitrix.service';

export interface SyncResult {
  synced: number;
  error?: string;
}

export interface CacheStats {
  totalLeads: number;
}

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly bitrixService: BitrixService,
  ) {}

  /**
   * Синхронизировать лиды из Bitrix24 в LeadCache
   * Вызывается n8n cron каждый час
   */
  async syncLeads(): Promise<SyncResult> {
    this.logger.log('Starting leads sync from Bitrix24...');

    try {
      // Получить все лиды из Bitrix24
      const bitrixLeads = await this.bitrixService.getLeads({
        filter: {},
        select: [
          'ID',
          'TITLE',
          'STATUS_ID',
          'SOURCE_ID',
          'ASSIGNED_BY_ID',
          'OPPORTUNITY',
          'CURRENCY_ID',
          'NAME',
          'LAST_NAME',
          'EMAIL',
          'PHONE',
          'COMMENTS',
          'DATE_CREATE',
          'DATE_MODIFY',
          'DATE_CLOSED',
        ],
      });

      this.logger.log(`Fetched ${bitrixLeads.length} leads from Bitrix24`);

      // Синхронизировать каждый лид
      let syncedCount = 0;
      for (const lead of bitrixLeads) {
        try {
          await this.prisma.leadCache.upsert({
            where: { bitrixId: lead.ID.toString() },
            create: {
              bitrixId: lead.ID.toString(),
              title: lead.TITLE,
              statusId: lead.STATUS_ID,
              sourceId: lead.SOURCE_ID,
              assignedById: lead.ASSIGNED_BY_ID,
              opportunity: parseFloat(lead.OPPORTUNITY ?? '0'),
              currencyId: lead.CURRENCY_ID ?? 'BYN',
              clientName: lead.NAME && lead.LAST_NAME
                ? `${lead.NAME} ${lead.LAST_NAME}`
                : lead.NAME ?? lead.LAST_NAME,
              clientEmail: lead.EMAIL?.[0]?.VALUE ?? null,
              clientPhone: lead.PHONE?.[0]?.VALUE ?? null,
              comments: lead.COMMENTS,
              dateCreate: lead.DATE_CREATE ? new Date(lead.DATE_CREATE) : null,
              dateModify: lead.DATE_MODIFY ? new Date(lead.DATE_MODIFY) : null,
              dateClosed: lead.DATE_CLOSED ? new Date(lead.DATE_CLOSED) : null,
            },
            update: {
              title: lead.TITLE,
              statusId: lead.STATUS_ID,
              sourceId: lead.SOURCE_ID,
              assignedById: lead.ASSIGNED_BY_ID,
              opportunity: parseFloat(lead.OPPORTUNITY ?? '0'),
              currencyId: lead.CURRENCY_ID ?? 'BYN',
              clientName: lead.NAME && lead.LAST_NAME
                ? `${lead.NAME} ${lead.LAST_NAME}`
                : lead.NAME ?? lead.LAST_NAME,
              clientEmail: lead.EMAIL?.[0]?.VALUE ?? null,
              clientPhone: lead.PHONE?.[0]?.VALUE ?? null,
              comments: lead.COMMENTS,
              dateModify: lead.DATE_MODIFY ? new Date(lead.DATE_MODIFY) : null,
              dateClosed: lead.DATE_CLOSED ? new Date(lead.DATE_CLOSED) : null,
            },
          });

          syncedCount++;
        } catch (error) {
          this.logger.error(
            `Failed to sync lead ${lead.ID}`,
            error instanceof Error ? error.message : error,
          );
        }
      }

      this.logger.log(`Leads sync complete: ${syncedCount}/${bitrixLeads.length} synced`);
      return { synced: syncedCount };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Leads sync failed', errorMessage);
      return { synced: 0, error: errorMessage };
    }
  }

  /**
   * Получить статистику кэша лидов
   */
  async getCacheStats(): Promise<CacheStats> {
    const totalLeads = await this.prisma.leadCache.count();

    return { totalLeads };
  }
}
