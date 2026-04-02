import { Body, Controller, Get, Post, Req, Res } from "@nestjs/common";
import { ApiOperation, ApiTags, ApiBody, ApiCookieAuth } from "@nestjs/swagger";
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
  @Post("login")
  login(
    @Body() payload: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.authService.login(payload, response);
  }

  @ApiOperation({ summary: "Stub Bitrix login" })
  @Post("bitrix")
  loginWithBitrix(
    @Body() payload: BitrixLoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.authService.loginWithBitrix(payload, response);
  }

  @ApiOperation({ summary: "Current authenticated user" })
  @ApiCookieAuth("flexnroll_session")
  @Get("me")
  me(@Req() request: Request) {
    return this.authService.getMe(request);
  }

  @ApiOperation({ summary: "Logout and clear session cookie" })
  @ApiCookieAuth("flexnroll_session")
  @Post("logout")
  logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.authService.logout(request, response);
  }
}
