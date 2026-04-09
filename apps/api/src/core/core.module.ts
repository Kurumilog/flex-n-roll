import { Module } from "@nestjs/common";

import { AppConfigService } from "../config/app.config";
import { MockAuthStoreService } from "./mock-auth-store.service";

@Module({
  providers: [AppConfigService, MockAuthStoreService],
  exports: [AppConfigService, MockAuthStoreService],
})
export class CoreModule {}
