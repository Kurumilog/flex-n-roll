import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  TERMINAL_FAILURE_STATUSES,
  REJECTION_REASON_MAP,
  LEAD_STATUS_NAMES,
} from '../../common/constants/bitrix-statuses';

export interface FunnelStatus {
  statusId: string;
  name: string;
  count: number;
  percentage: number;
}

export interface RejectionReason {
  reason: string;
  count: number;
}

export interface ManagerStat {
  id: number;
  name: string;
  lastName: string;
  department: string | null;
  kpiScore: number;
  dealsWon: number;
  dealsLost: number;
  isAvailable: boolean;
}

export interface MailingAnalytics {
  total: number;
  sent: number;
  failed: number;
  responseReceived: number;
  responseRate: number;
}

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Воронка конверсии по статусам лидов
   */
  async getFunnel(): Promise<{
    total: number;
    byStatus: FunnelStatus[];
  }> {
    const total = await this.prisma.leadCache.count();

    const grouped = await this.prisma.leadCache.groupBy({
      by: ['statusId'],
      _count: { statusId: true },
      orderBy: { _count: { statusId: 'desc' } },
    });

    const byStatus: FunnelStatus[] = grouped.map((g) => ({
      statusId: g.statusId,
      name: LEAD_STATUS_NAMES[g.statusId] ?? g.statusId,
      count: g._count.statusId,
      percentage: total > 0 ? Math.round((g._count.statusId / total) * 1000) / 10 : 0,
    }));

    return { total, byStatus };
  }

  /**
   * Топ причин отказа
   */
  async getRejections(): Promise<RejectionReason[]> {
    const grouped = await this.prisma.leadCache.groupBy({
      by: ['statusId'],
      _count: { statusId: true },
      where: {
        statusId: {
          in: TERMINAL_FAILURE_STATUSES,
        },
      },
      orderBy: { _count: { statusId: 'desc' } },
    });

    return grouped.map((g) => ({
      reason: REJECTION_REASON_MAP[g.statusId] ?? g.statusId,
      count: g._count.statusId,
    }));
  }

  /**
   * Сводка по менеджерам: KPI, сделки, доступность
   */
  async getManagerStats(): Promise<ManagerStat[]> {
    const employees = await this.prisma.employee.findMany({
      select: {
        id: true,
        name: true,
        lastName: true,
        department: true,
        kpiScore: true,
        dealsWon: true,
        dealsLost: true,
        isAvailable: true,
      },
      orderBy: { kpiScore: 'desc' },
    });

    return employees;
  }

  /**
   * Статистика рассылок
   */
  async getMailingStats(): Promise<MailingAnalytics> {
    const mailings = await this.prisma.mailing.findMany({
      select: {
        status: true,
        responseReceived: true,
        channel: true,
      },
    });

    const total = mailings.length;
    const sent = mailings.filter((m) => m.status === 'sent').length;
    const failed = mailings.filter((m) => m.status === 'failed').length;
    const responseReceived = mailings.filter((m) => m.responseReceived).length;
    const responseRate = sent > 0 ? (responseReceived / sent) * 100 : 0;

    return {
      total,
      sent,
      failed,
      responseReceived,
      responseRate: Math.round(responseRate * 10) / 10,
    };
  }
}
