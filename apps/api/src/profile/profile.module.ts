import { Module } from "@nestjs/common";

import { CoreModule } from "../core/core.module";
import { ProfileController } from "./profile.controller";
import { ProfileService } from "./profile.service";

@Module({
  imports: [CoreModule],
  controllers: [ProfileController],
  providers: [ProfileService],
})
export class ProfileModule {}
