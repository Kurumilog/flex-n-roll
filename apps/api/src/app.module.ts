import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { validate } from './config/app.validation';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { BitrixModule } from './modules/bitrix/bitrix.module';
import { OllamaModule } from './modules/ollama/ollama.module';
import { EmployeesModule } from './modules/employees/employees.module';
import { RoutingModule } from './modules/routing/routing.module';
import { KpiModule } from './modules/kpi/kpi.module';
import { MailingModule } from './modules/mailing/mailing.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { SyncModule } from './modules/sync/sync.module';
import { N8nModule } from './modules/n8n/n8n.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      validate,
    }),
    PrismaModule,
    HealthModule,
    BitrixModule,
    OllamaModule,
    EmployeesModule,
    RoutingModule,
    KpiModule,
    MailingModule,
    AnalyticsModule,
    SyncModule,
    N8nModule,
  ],
})
export class AppModule {}
