import { Module } from '@nestjs/common';
import { MailingService } from './mailing.service';
import { MailingController } from './mailing.controller';
import { OllamaModule } from '../ollama/ollama.module';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  imports: [OllamaModule],
  controllers: [MailingController],
  providers: [PrismaService, MailingService],
  exports: [MailingService],
})
export class MailingModule {}
