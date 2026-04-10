import { Module } from '@nestjs/common';
import { TrackingController } from './tracking.controller';
import { TrackingService } from './tracking.service';
import { PrismaModule } from '../prisma/prisma.module';
import { OllamaModule } from '../modules/ollama/ollama.module';

@Module({
  imports: [PrismaModule, OllamaModule],
  controllers: [TrackingController],
  providers: [TrackingService]
})
export class TrackingModule {}
