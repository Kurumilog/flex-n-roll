import { Injectable, UnauthorizedException } from "@nestjs/common";
import type { Request } from "express";

import { SESSION_COOKIE_NAME } from "../common/session.constants";
import { MockAuthStoreService } from "../core/mock-auth-store.service";
import { UpdateProfileDto } from "./dto/update-profile.dto";

@Injectable()
export class ProfileService {
  constructor(private readonly store: MockAuthStoreService) {}

  getProfile(request: Request) {
    const sessionId = this.getSessionId(request);
    const profile = this.store.getProfileBySessionId(sessionId);
    if (!profile) {
      throw new UnauthorizedException("Сессия не найдена.");
    }

    return profile;
  }

  updateProfile(request: Request, payload: UpdateProfileDto) {
    const sessionId = this.getSessionId(request);
    const profile = this.store.updateProfileBySessionId(sessionId, payload);
    if (!profile) {
      throw new UnauthorizedException("Сессия не найдена.");
    }

    return profile;
  }

  private getSessionId(request: Request) {
    return request.cookies?.[SESSION_COOKIE_NAME] as string | undefined;
  }
}
