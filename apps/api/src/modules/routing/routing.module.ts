import { Module } from '@nestjs/common';
import { RoutingService } from './routing.service';
import { RoutingController } from './routing.controller';
import { EmployeesModule } from '../employees/employees.module';
import { OllamaModule } from '../ollama/ollama.module';
import { BitrixModule } from '../bitrix/bitrix.module';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  imports: [EmployeesModule, OllamaModule, BitrixModule],
  controllers: [RoutingController],
  providers: [PrismaService, RoutingService],
  exports: [RoutingService],
})
export class RoutingModule {}