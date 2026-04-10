import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { BitrixModule } from '../bitrix/bitrix.module';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [BitrixModule, PrismaModule],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
