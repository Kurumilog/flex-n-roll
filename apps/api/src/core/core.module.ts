import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { AppConfigService } from "../config/app.config";
import { MockAuthStoreService } from "./mock-auth-store.service";

@Module({
  imports: [ConfigModule],
  providers: [MockAuthStoreService, AppConfigService],
  exports: [MockAuthStoreService, AppConfigService],
})
export class CoreModule {}
