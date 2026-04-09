import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MailingService } from './mailing.service';
import { MailingController } from './mailing.controller';
import { OllamaModule } from '../ollama/ollama.module';

@Module({
  imports: [OllamaModule, ConfigModule],
  controllers: [MailingController],
  providers: [MailingService],
  exports: [MailingService],
})
export class MailingModule {}
