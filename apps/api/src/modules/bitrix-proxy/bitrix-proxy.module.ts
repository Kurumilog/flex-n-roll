import { Module } from '@nestjs/common';
import { BitrixProxyController } from './bitrix-proxy.controller';
import { BitrixModule } from '../bitrix/bitrix.module';

@Module({
  imports: [BitrixModule],
  controllers: [BitrixProxyController],
})
export class BitrixProxyModule {}
