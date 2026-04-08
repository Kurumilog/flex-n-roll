import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface AvailableEmployee {
  id: number;
  name: string;
  lastName: string;
  position: string | null;
  department: string | null;
  kpiScore: number;
  isAvailable: boolean;
  isPersonalManager: boolean;
}

export interface PersonalManagerResult {
  id: number;
  name: string;
  lastName: string;
  kpiScore: number;
  isAvailable: boolean;
  isPersonalManager: true;
}

export interface EmployeeKpiResult {
  id: number;
  name: string;
  lastName: string;
  kpiScore: number;
  dealsWon: number;
  dealsLost: number;
  avgResponseMinutes: number;
  kpiHistory: Array<{
    period: Date;
    kpiScore: number;
  }>;
}

@Injectable()
export class EmployeesService {
  private readonly logger = new Logger(EmployeesService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Получить список доступных менеджеров, отсортированных по KPI (по убыванию)
   */
  async getAvailableEmployees(): Promise<AvailableEmployee[]> {
    const employees = await this.prisma.employee.findMany({
      where: { isAvailable: true },
      orderBy: { kpiScore: 'desc' },
      select: {
        id: true,
        name: true,
        lastName: true,
        position: true,
        department: true,
        kpiScore: true,
        isAvailable: true,
      },
    });

    return employees.map((emp: {
      id: number;
      name: string;
      lastName: string;
      position: string | null;
      department: string | null;
      kpiScore: number;
      isAvailable: boolean;
    }) => ({
      ...emp,
      isPersonalManager: false,
    }));
  }

  /**
   * Найти "личного менеджера" клиента по телефону или email
   * Возвращает менеджера если interactionCount >= 2
   */
  async getPersonalManager(
    clientPhone?: string,
    clientEmail?: string,
  ): Promise<PersonalManagerResult | null> {
    // Поиск по телефону
    if (clientPhone) {
      const assignment = await this.prisma.assignment.findFirst({
        where: { clientPhone },
        orderBy: { interactionCount: 'desc' },
        include: {
          employee: {
            select: {
              id: true,
              name: true,
              lastName: true,
              kpiScore: true,
              isAvailable: true,
            },
          },
        },
      });

      if (assignment && assignment.interactionCount >= 2) {
        return {
          ...assignment.employee,
          isPersonalManager: true,
        };
      }
    }

    // Поиск по email
    if (clientEmail) {
      const assignment = await this.prisma.assignment.findFirst({
        where: { clientEmail },
        orderBy: { interactionCount: 'desc' },
        include: {
          employee: {
            select: {
              id: true,
              name: true,
              lastName: true,
              kpiScore: true,
              isAvailable: true,
            },
          },
        },
      });

      if (assignment && assignment.interactionCount >= 2) {
        return {
          ...assignment.employee,
          isPersonalManager: true,
        };
      }
    }

    return null;
  }

  /**
   * Обновить доступность менеджера
   */
  async updateAvailability(
    id: number,
    isAvailable: boolean,
  ): Promise<{ id: number; name: string; isAvailable: boolean }> {
    try {
      const employee = await this.prisma.employee.update({
        where: { id },
        data: { isAvailable },
        select: {
          id: true,
          name: true,
          isAvailable: true,
        },
      });

      this.logger.log(
        `Employee ${employee.name} availability updated to ${isAvailable}`,
      );
      return employee;
    } catch (error) {
      this.logger.error(`Failed to update availability for employee ${id}`, error);
      throw new NotFoundException(`Employee with ID ${id} not found`);
    }
  }

  /**
   * Получить KPI сотрудника с историей за последние 30 дней
   */
  async getEmployeeKpi(employeeId: number): Promise<EmployeeKpiResult> {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      select: {
        id: true,
        name: true,
        lastName: true,
        kpiScore: true,
        dealsWon: true,
        dealsLost: true,
        avgResponseMinutes: true,
        kpiHistory: {
          where: {
            period: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 дней назад
            },
          },
          orderBy: { period: 'asc' },
          select: {
            period: true,
            kpiScore: true,
          },
        },
      },
    });

    if (!employee) {
      throw new NotFoundException(`Employee with ID ${employeeId} not found`);
    }

    return employee;
  }

  /**
   * Создать или обновить запись о назначении менеджера клиенту
   */
  async upsertAssignment(data: {
    clientPhone?: string;
    clientEmail?: string;
    clientBitrixId?: string;
    employeeId: number;
  }): Promise<void> {
    // Поиск существующего назначения
    const existing = await this.prisma.assignment.findFirst({
      where: {
        OR: [
          data.clientPhone ? { clientPhone: data.clientPhone } : {},
          data.clientEmail ? { clientEmail: data.clientEmail } : {},
          data.clientBitrixId ? { clientBitrixId: data.clientBitrixId } : {},
        ].filter((cond) => Object.keys(cond).length > 0),
      },
    });

    if (existing) {
      // Обновить существующее назначение
      await this.prisma.assignment.update({
        where: { id: existing.id },
        data: {
          interactionCount: { increment: 1 },
          lastInteraction: new Date(),
        },
      });
    } else {
      // Создать новое назначение
      await this.prisma.assignment.create({
        data: {
          clientPhone: data.clientPhone,
          clientEmail: data.clientEmail,
          clientBitrixId: data.clientBitrixId,
          employeeId: data.employeeId,
        },
      });
    }

    this.logger.log(
      `Assignment upserted for employee ${data.employeeId}`,
    );
  }
}
