import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BitrixService } from '../bitrix/bitrix.service';

export interface EmployeeKpi {
  id: number;
  name: string;
  lastName: string;
  department: string | null;
  kpiScore: number;
  dealsWon: number;
  dealsLost: number;
  avgResponseMinutes: number;
}

@Injectable()
export class KpiService {
  private readonly logger = new Logger(KpiService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly bitrixService: BitrixService,
  ) {}

  /**
   * Формула расчёта KPI
   *
   * KPI = conversionScore (60%) + responseScore (20%) + volumeScore (20%)
   * - conversionScore = (won / total) * 60
   * - responseScore = max(0, 20 * (1 - log(avgResponseMin / 5) / log(300)))
   * - volumeScore = min(20, (total / 100) * 20)
   */
  calculateKpiScore(
    dealsWon: number,
    dealsLost: number,
    avgResponseMinutes: number,
  ): number {
    const totalDeals = dealsWon + dealsLost;

    // Нет сделок → нейтральный KPI
    if (totalDeals === 0) return 50.0;

    // Конверсия (60% веса)
    const conversionRate = dealsWon / totalDeals;
    const conversionScore = conversionRate * 60;

    // Скорость ответа (20% веса): идеал = 5 минут, хорошо = 30 минут
    const responseScore =
      avgResponseMinutes <= 0
        ? 20
        : Math.max(
            0,
            20 * (1 - Math.log(avgResponseMinutes / 5) / Math.log(300)),
          );

    // Объём (20% веса): масштаб 1–100 сделок
    const volumeScore = Math.min(20, (totalDeals / 100) * 20);

    return Math.min(100, Math.max(0, conversionScore + responseScore + volumeScore));
  }

  /**
   * Получить текущий KPI всех сотрудников
   */
  async getCurrentKpi(): Promise<EmployeeKpi[]> {
    const employees = await this.prisma.employee.findMany({
      select: {
        id: true,
        name: true,
        lastName: true,
        department: true,
        kpiScore: true,
        dealsWon: true,
        dealsLost: true,
        avgResponseMinutes: true,
      },
      orderBy: { kpiScore: 'desc' },
    });

    return employees;
  }

  /**
   * Пересчитать KPI конкретного сотрудника из Bitrix24
   */
  async recalculateKpi(employeeId: number): Promise<void> {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      select: {
        id: true,
        name: true,
        avgResponseMinutes: true,
      },
    });

    if (!employee) {
      throw new NotFoundException(`Employee with ID ${employeeId} not found`);
    }

    // Получить сделки сотрудника из Bitrix24
    const deals = await this.bitrixService.getDeals({
      filter: { ASSIGNED_BY_ID: employeeId.toString() },
      select: ['ID', 'STAGE_SEMANTIC_ID', 'DATE_CREATE', 'CLOSEDATE'],
    });

    // Агрегировать результаты
    const dealsWon = deals.filter((d: any) => d.STAGE_SEMANTIC_ID === 'S').length;
    const dealsLost = deals.filter((d: any) => d.STAGE_SEMANTIC_ID === 'F').length;

    // Рассчитать KPI
    const kpiScore = this.calculateKpiScore(
      dealsWon,
      dealsLost,
      employee.avgResponseMinutes,
    );

    // Обновить сотрудника и создать запись в истории
    await this.prisma.$transaction([
      this.prisma.employee.update({
        where: { id: employeeId },
        data: {
          dealsWon,
          dealsLost,
          kpiScore,
        },
      }),
      this.prisma.kpiHistory.create({
        data: {
          employeeId,
          period: new Date(),
          dealsWon,
          dealsLost,
          avgResponseMinutes: employee.avgResponseMinutes,
          kpiScore,
        },
      }),
    ]);

    this.logger.log(
      `KPI recalculated for employee ${employeeId}: ${kpiScore.toFixed(1)} (${dealsWon}W/${dealsLost}L)`,
    );
  }

  /**
   * Пересчитать KPI всех сотрудников (ежедневный cron)
   */
  async recalculateAllKpi(): Promise<EmployeeKpi[]> {
    this.logger.log('Starting daily KPI recalculation...');

    // Получить все сделки
    const deals = await this.bitrixService.getDeals({
      filter: {},
      select: ['ID', 'ASSIGNED_BY_ID', 'STAGE_SEMANTIC_ID'],
    });

    // Группировать по ASSIGNED_BY_ID
    const dealsByEmployee: Record<number, any[]> = {};
    for (const deal of deals) {
      const assignedById = deal.ASSIGNED_BY_ID;
      if (!assignedById) continue;

      if (!dealsByEmployee[assignedById]) {
        dealsByEmployee[assignedById] = [];
      }
      dealsByEmployee[assignedById].push(deal);
    }

    // Пересчитать KPI для каждого сотрудника
    const results: EmployeeKpi[] = [];
    for (const [employeeIdStr, employeeDeals] of Object.entries(dealsByEmployee)) {
      const employeeId = parseInt(employeeIdStr, 10);

      const employee = await this.prisma.employee.findUnique({
        where: { id: employeeId },
        select: {
          id: true,
          name: true,
          lastName: true,
          department: true,
          avgResponseMinutes: true,
        },
      });

      if (!employee) continue;

      const dealsWon = employeeDeals.filter(
        (d: any) => d.STAGE_SEMANTIC_ID === 'S',
      ).length;
      const dealsLost = employeeDeals.filter(
        (d: any) => d.STAGE_SEMANTIC_ID === 'F',
      ).length;

      const kpiScore = this.calculateKpiScore(
        dealsWon,
        dealsLost,
        employee.avgResponseMinutes,
      );

      // Обновить сотрудника и историю
      await this.prisma.$transaction([
        this.prisma.employee.update({
          where: { id: employeeId },
          data: {
            dealsWon,
            dealsLost,
            kpiScore,
          },
        }),
        this.prisma.kpiHistory.create({
          data: {
            employeeId,
            period: new Date(),
            dealsWon,
            dealsLost,
            avgResponseMinutes: employee.avgResponseMinutes,
            kpiScore,
          },
        }),
      ]);

      results.push({
        ...employee,
        kpiScore,
        dealsWon,
        dealsLost,
      });
    }

    this.logger.log(`KPI recalculation complete: ${results.length} employees updated`);
    return results;
  }

  /**
   * Получить историю KPI сотрудника за последние 30 дней
   */
  async getKpiHistory(employeeId: number): Promise<
    Array<{
      period: Date;
      kpiScore: number;
      dealsWon: number;
      dealsLost: number;
    }>
  > {
    return this.prisma.kpiHistory.findMany({
      where: {
        employeeId,
        period: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
      orderBy: { period: 'asc' },
      select: {
        period: true,
        kpiScore: true,
        dealsWon: true,
        dealsLost: true,
      },
    });
  }
}
