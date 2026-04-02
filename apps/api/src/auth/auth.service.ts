import { Injectable, UnauthorizedException } from "@nestjs/common";
import type { Request, Response } from "express";

import { SESSION_COOKIE_NAME, SESSION_TTL_MS } from "../common/session.constants";
import { MockAuthStoreService } from "../core/mock-auth-store.service";
import { BitrixLoginDto } from "./dto/bitrix-login.dto";
import { LoginDto } from "./dto/login.dto";

@Injectable()
export class AuthService {
  private readonly store = new MockAuthStoreService();

  login(payload: LoginDto, response: Response) {
    const session = this.store.loginWithPassword(payload.email, payload.password);
    this.setSessionCookie(response, session.sessionId);
    return session;
  }

  loginWithBitrix(_payload: BitrixLoginDto, response: Response) {
    const session = this.store.loginWithBitrix();
    this.setSessionCookie(response, session.sessionId);
    return session;
  }

  getMe(request: Request) {
    const sessionId = this.getSessionId(request);
    const user = this.store.getUserBySessionId(sessionId);

    if (!user) {
      throw new UnauthorizedException("Сессия не найдена.");
    }

    return { user };
  }

  logout(request: Request, response: Response) {
    const sessionId = this.getSessionId(request);
    this.store.revokeSession(sessionId);
    response.clearCookie(SESSION_COOKIE_NAME, {
      path: "/",
      sameSite: "lax",
    });

    return { ok: true };
  }

  private getSessionId(request: Request) {
    return request.cookies?.[SESSION_COOKIE_NAME] as string | undefined;
  }

  private setSessionCookie(response: Response, sessionId: string) {
    response.cookie(SESSION_COOKIE_NAME, sessionId, {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      path: "/",
      maxAge: SESSION_TTL_MS,
    });
  }
}
