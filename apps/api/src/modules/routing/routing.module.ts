import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RoutingService } from './routing.service';
import { RoutingController } from './routing.controller';
import { EmployeesModule } from '../employees/employees.module';
import { OllamaModule } from '../ollama/ollama.module';
import { BitrixModule } from '../bitrix/bitrix.module';

@Module({
  imports: [EmployeesModule, OllamaModule, BitrixModule, ConfigModule],
  controllers: [RoutingController],
  providers: [RoutingService],
  exports: [RoutingService],
})
export class RoutingModule {}