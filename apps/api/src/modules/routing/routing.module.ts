import { Module } from '@nestjs/common';
import { RoutingService } from './routing.service';
import { RoutingController } from './routing.controller';
import { EmployeesModule } from '../employees/employees.module';
import { OllamaModule } from '../ollama/ollama.module';

@Module({
  imports: [EmployeesModule, OllamaModule],
  controllers: [RoutingController],
  providers: [RoutingService],
  exports: [RoutingService],
})
export class RoutingModule {}