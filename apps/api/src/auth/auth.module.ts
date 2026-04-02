import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { CoreModule } from "../core/core.module";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";

@Module({
  imports: [CoreModule, ConfigModule],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
