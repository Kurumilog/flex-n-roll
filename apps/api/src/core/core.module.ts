import { Module } from "@nestjs/common";

import { AppConfigService } from "../config/app.config";
import { MockAuthStoreService } from "./mock-auth-store.service";

@Module({
  providers: [MockAuthStoreService, AppConfigService],
  exports: [MockAuthStoreService, AppConfigService],
})
export class CoreModule {}
