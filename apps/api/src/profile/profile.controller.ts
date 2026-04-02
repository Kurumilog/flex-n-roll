import { Body, Controller, Get, Patch, Req } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import type { Request } from "express";

import { UpdateProfileDto } from "./dto/update-profile.dto";
import { ProfileService } from "./profile.service";

@ApiTags("profile")
@Controller("profile")
export class ProfileController {
  private readonly profileService = new ProfileService();

  @ApiOperation({ summary: "Current user profile" })
  @Get()
  getProfile(@Req() request: Request) {
    return this.profileService.getProfile(request);
  }

  @ApiOperation({ summary: "Update profile fields (stub)" })
  @Patch()
  updateProfile(
    @Req() request: Request,
    @Body() payload: UpdateProfileDto,
  ) {
    return this.profileService.updateProfile(request, payload);
  }
}
