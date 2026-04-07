import { Body, Controller, Get, Patch, Req } from "@nestjs/common";
import { ApiOperation, ApiTags, ApiResponse } from "@nestjs/swagger";
import type { Request } from "express";

import { UpdateProfileDto } from "./dto/update-profile.dto";
import { ProfileService } from "./profile.service";

@ApiTags("profile")
@Controller("profile")
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @ApiOperation({ summary: "Current user profile" })
  @ApiResponse({
    status: 200,
    description: "Profile retrieved successfully",
    schema: {
      type: "object",
      properties: {
        profile: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            email: { type: "string" },
            role: { type: "string" },
            department: { type: "string" },
            timezone: { type: "string" },
            bio: { type: "string" },
            avatar: { type: "string" },
          },
        },
      },
    },
  })
  @Get()
  getProfile(@Req() request: Request) {
    return this.profileService.getProfile(request);
  }

  @ApiOperation({ summary: "Update profile fields (stub)" })
  @ApiResponse({
    status: 200,
    description: "Profile updated successfully",
    schema: {
      type: "object",
      properties: {
        profile: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            email: { type: "string" },
            role: { type: "string" },
            department: { type: "string" },
            timezone: { type: "string" },
            bio: { type: "string" },
            avatar: { type: "string" },
          },
        },
      },
    },
  })
  @Patch()
  updateProfile(
    @Req() request: Request,
    @Body() payload: UpdateProfileDto,
  ) {
    return this.profileService.updateProfile(request, payload);
  }
}
