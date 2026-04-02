import { Module } from "@nestjs/common";

import { MockAuthStoreService } from "./mock-auth-store.service";

@Module({
  providers: [MockAuthStoreService],
  exports: [MockAuthStoreService],
})
export class CoreModule {}
