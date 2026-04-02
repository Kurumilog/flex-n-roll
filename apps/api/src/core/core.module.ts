import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { MockAuthStoreService } from "./mock-auth-store.service";

@Module({
  imports: [ConfigModule],
  providers: [MockAuthStoreService],
  exports: [MockAuthStoreService],
})
export class CoreModule {}
