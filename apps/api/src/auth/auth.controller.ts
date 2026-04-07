import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseInterceptors,
} from "@nestjs/common";
import {
  ApiOperation,
  ApiTags,
  ApiBody,
  ApiCookieAuth,
  ApiResponse,
} from "@nestjs/swagger";
import type { Request, Response } from "express";

import { AuthService } from "./auth.service";
import { BitrixLoginDto } from "./dto/bitrix-login.dto";
import { LoginDto } from "./dto/login.dto";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: "Login with email/password" })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 201,
    description: "Login successful",
    schema: {
      type: "object",
      properties: {
        sessionId: { type: "string" },
        expiresAt: { type: "string" },
      },
    },
  })
  @Post("login")
  login(@Body() payload: LoginDto, @Res({ passthrough: true }) res: Response) {
    return this.authService.login(payload, res);
  }

  @ApiOperation({ summary: "Stub Bitrix login" })
  @ApiResponse({
    status: 201,
    description: "Login successful",
    schema: {
      type: "object",
      properties: {
        sessionId: { type: "string" },
        expiresAt: { type: "string" },
      },
    },
  })
  @Post("bitrix")
  loginWithBitrix(@Res({ passthrough: true }) res: Response) {
    return this.authService.loginWithBitrix(res);
  }

  @ApiOperation({ summary: "Current authenticated user" })
  @ApiCookieAuth("flexnroll_session")
  @ApiResponse({
    status: 200,
    description: "User info",
    schema: {
      type: "object",
      properties: {
        user: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            email: { type: "string" },
            role: { type: "string" },
          },
        },
      },
    },
  })
  @Get("me")
  me(@Req() req: Request) {
    return this.authService.getMe(req);
  }

  @ApiOperation({ summary: "Logout and clear session cookie" })
  @ApiCookieAuth("flexnroll_session")
  @ApiResponse({ status: 200, description: "Logout successful" })
  @Post("logout")
  logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return this.authService.logout(req, res);
  }
}
