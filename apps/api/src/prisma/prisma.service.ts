import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

// Глобальный синглтон PrismaClient для избежания конфликтов pooling
let globalPrismaClient: PrismaClient | null = null;

/**
 * PrismaService — обёртка над PrismaClient для NestJS DI
 *
 * Использует глобальный синглтон PrismaClient для избежания
 * конфликтов prepared statements при нескольких экземплярах сервиса.
 */
@Injectable()
export class PrismaService implements OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private prisma: PrismaClient;

  constructor() {
    if (!globalPrismaClient) {
      this.logger.log('Creating global PrismaClient singleton...');
      globalPrismaClient = new PrismaClient();
    }
    this.prisma = globalPrismaClient;
  }

  async onModuleDestroy() {
    if (globalPrismaClient) {
      await globalPrismaClient.$disconnect();
      this.logger.log('Disconnected from database');
      globalPrismaClient = null;
    }
  }

  // Проксируем модели PrismaClient
  get employee() {
    return this.prisma.employee;
  }

  get assignment() {
    return this.prisma.assignment;
  }

  get kpiHistory() {
    return this.prisma.kpiHistory;
  }

  get leadCache() {
    return this.prisma.leadCache;
  }

  get mailing() {
    return this.prisma.mailing;
  }

  get incomingEvent() {
    return this.prisma.incomingEvent;
  }

  // Проксируем методы PrismaClient
  async $connect() {
    await this.prisma.$connect();
    this.logger.log('Successfully connected to database');
  }

  async $disconnect() {
    if (this.prisma) {
      await this.prisma.$disconnect();
    }
  }

  $transaction(input: any, options?: any) {
    return this.prisma.$transaction(input, options);
  }

  $use(cb: any) {
    return this.prisma.$use(cb);
  }

  $extends(args: any) {
    return this.prisma.$extends(args);
  }
}
