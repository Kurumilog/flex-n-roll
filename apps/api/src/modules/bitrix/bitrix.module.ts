import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BitrixService } from './bitrix.service';

@Module({
  imports: [ConfigModule],
  providers: [BitrixService],
  exports: [BitrixService],
})
export class BitrixModule {}
