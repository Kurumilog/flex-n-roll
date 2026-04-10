import { Injectable, Logger } from '@nestjs/common';
import { BitrixService } from '../bitrix/bitrix.service';
import { PrismaService } from '../../prisma/prisma.service';

export interface DashboardManager {
  id: number;
  name: string;
  lastName: string;
  department: string | null;
  kpiScore: number;
  isAvailable: boolean;
  dealsWon: number;
  dealsLost: number;
  avgResponseMinutes: number;
  activeDialogsCount: number;
  openTasksCount: number;
}

export interface DashboardSummary {
  managers: DashboardManager[];
  mailingStats: {
    total: number;
    sent: number;
    failed: number;
    responseReceived: number;
    responseRate: number;
  };
  totalEmployees: number;
  availableEmployees: number;
}

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly bitrixService: BitrixService,
  ) {}

  /**
   * Агрегированный ответ для дашборда: все менеджеры + KPI + активные диалоги + задачи
   */
  async getSummary(): Promise<DashboardSummary> {
    // 1. Все менеджеры с KPI
    let employees: any[] = [];
    try {
      employees = await this.prisma.employee.findMany({
        select: {
          id: true,
          name: true,
          lastName: true,
          department: true,
          kpiScore: true,
          isAvailable: true,
          dealsWon: true,
          dealsLost: true,
          avgResponseMinutes: true,
        },
        orderBy: { kpiScore: 'desc' },
      });
    } catch (err: any) {
      this.logger.error(`Failed to fetch employees for dashboard: ${err.message}`, err.stack);
    }

    // 2. Статистика рассылок
    let mailings: any[] = [];
    try {
      mailings = await this.prisma.mailing.findMany({
        select: { status: true, responseReceived: true },
      });
    } catch (err: any) {
      this.logger.error(`Failed to fetch mailings stats: ${err.message}`, err.stack);
    }
    const sent = mailings.filter((m) => m.status === 'sent').length;
    const responseReceived = mailings.filter((m) => m.responseReceived).length;
    const mailingStats = {
      total: mailings.length,
      sent,
      failed: mailings.filter((m) => m.status === 'failed').length,
      responseReceived,
      responseRate: sent > 0 ? Math.round((responseReceived / sent) * 1000) / 10 : 0,
    };

    // 3. Активные диалоги (Bitrix24) — группируем по USER_ID
    let openSessionsByUser: Record<number, number> = {};
    try {
      const sessions = await this.bitrixService.getOpenSessions().catch((err) => {
        this.logger.warn(`Failed to fetch open sessions: ${err.message}. Returning mock data.`);
        return [];
      });
      if (Array.isArray(sessions)) {
        openSessionsByUser = sessions.reduce((acc: Record<number, number>, s: any) => {
          const userId = s.USER_ID;
          if (userId) {
            acc[userId] = (acc[userId] || 0) + 1;
          }
          return acc;
        }, {});
      }
    } catch (err) {
      this.logger.warn(`Failed to fetch open sessions: ${err instanceof Error ? err.message : err}`);
    }

    // 4. Задачи менеджеров (Bitrix24) — группируем по RESPONSIBLE_ID
    let tasksByUser: Record<number, number> = {};
    try {
      // Статусы открытых задач: 1=новая, 2=ждёт контроля, 3=в работе, 4=отложена, 5=решена
      const tasks = await this.bitrixService.listTasks({
        filter: { '!STATUS': '5' }, // исключаем закрытые
        select: ['ID', 'RESPONSIBLE_ID', 'STATUS'],
      }).catch((err) => {
        this.logger.warn(`Failed to fetch tasks: ${err.message}. Returning mock data.`);
        return []; // Возвращаем пустой массив задач вместо throw
      });

      if (Array.isArray(tasks)) {
        tasksByUser = tasks.reduce((acc: Record<number, number>, t: any) => {
          const responsibleId = t.RESPONSIBLE_ID;
          if (responsibleId) {
            acc[responsibleId] = (acc[responsibleId] || 0) + 1;
          }
          return acc;
        }, {});
      }
    } catch (err) {
      this.logger.warn(`Failed to fetch tasks: ${err instanceof Error ? err.message : err}`);
    }

    // 5. Объединяем
    const managers: DashboardManager[] = employees.map((emp) => ({
      ...emp,
      activeDialogsCount: openSessionsByUser[emp.id] || 0,
      openTasksCount: tasksByUser[emp.id] || 0,
    }));

    return {
      managers,
      mailingStats,
      totalEmployees: employees.length,
      availableEmployees: employees.filter((e) => e.isAvailable).length,
    };
  }
}
