import { Injectable, UnauthorizedException } from "@nestjs/common";
import { randomUUID } from "crypto";

import { SESSION_TTL_MS } from "../common/session.constants";
import type { SessionRecord, UserRecord } from "../common/user.types";

type SessionResponse = {
  sessionId: string;
  user: Omit<UserRecord, "bio">;
  expiresAt: string;
};

type ProfileResponse = {
  profile: UserRecord;
};

@Injectable()
export class MockAuthStoreService {
  private users = new Map<string, UserRecord>([
    [
      "mgr-1",
      {
        id: "mgr-1",
        name: "Ivan Ivanov",
        email: "demo@flexnroll.ai",
        role: "manager",
        department: "Sales",
        timezone: "Europe/Minsk",
        bio: "Контролирую маршрутизацию и качество ответов по входящим заявкам.",
        avatar: "https://picsum.photos/seed/flexnroll-api-1/96/96",
      },
    ],
    [
      "mgr-2",
      {
        id: "mgr-2",
        name: "Bitrix Agent",
        email: "bitrix@flexnroll.ai",
        role: "supervisor",
        department: "Operations",
        timezone: "Europe/Minsk",
        bio: "Отвечаю за Bitrix24 sync и SLA-эскалации.",
        avatar: "https://picsum.photos/seed/flexnroll-api-2/96/96",
      },
    ],
  ]);

  private sessions = new Map<string, SessionRecord>();

  loginWithEmail(email: string): SessionResponse {
    const user = this.ensureUser(email);
    return this.createSession(user);
  }

  loginWithBitrix(): SessionResponse {
    const user = this.users.get("mgr-2");
    if (!user) {
      throw new UnauthorizedException("Пользователь Bitrix недоступен.");
    }

    return this.createSession(user);
  }

  getUserBySessionId(sessionId?: string): Omit<UserRecord, "bio"> | null {
    const user = this.resolveUser(sessionId);
    if (!user) {
      return null;
    }

    return this.toAuthUser(user);
  }

  getProfileBySessionId(sessionId?: string): ProfileResponse | null {
    const user = this.resolveUser(sessionId);
    if (!user) {
      return null;
    }

    return { profile: user };
  }

  updateProfileBySessionId(
    sessionId: string | undefined,
    payload: {
      name?: string;
      department?: string;
      timezone?: string;
      bio?: string;
    },
  ): ProfileResponse | null {
    const user = this.resolveUser(sessionId);
    if (!user) {
      return null;
    }

    const nextUser: UserRecord = {
      ...user,
      name: payload.name ?? user.name,
      department: payload.department ?? user.department,
      timezone: payload.timezone ?? user.timezone,
      bio: payload.bio ?? user.bio,
    };
    this.users.set(user.id, nextUser);

    return { profile: nextUser };
  }

  revokeSession(sessionId?: string) {
    if (!sessionId) {
      return;
    }

    this.sessions.delete(sessionId);
  }

  private createSession(user: UserRecord): SessionResponse {
    const sessionId = randomUUID();
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();
    this.sessions.set(sessionId, {
      id: sessionId,
      userId: user.id,
      expiresAt,
    });

    return {
      sessionId,
      user: this.toAuthUser(user),
      expiresAt,
    };
  }

  private resolveUser(sessionId?: string): UserRecord | null {
    if (!sessionId) {
      return null;
    }

    const session = this.sessions.get(sessionId);
    if (!session) {
      return null;
    }

    if (new Date(session.expiresAt).getTime() <= Date.now()) {
      this.sessions.delete(sessionId);
      return null;
    }

    return this.users.get(session.userId) ?? null;
  }

  private ensureUser(email: string): UserRecord {
    for (const user of this.users.values()) {
      if (user.email.toLowerCase() === email.toLowerCase()) {
        return user;
      }
    }

    const id = `mgr-${this.users.size + 1}`;
    const name = email
      .split("@")[0]
      .replace(/[._-]/g, " ")
      .replace(/\b\w/g, (chunk) => chunk.toUpperCase());
    const user: UserRecord = {
      id,
      name,
      email,
      role: "manager",
      department: "Sales",
      timezone: "Europe/Minsk",
      bio: "Новый участник демонстрационного workspace.",
      avatar: `https://picsum.photos/seed/flexnroll-api-${id}/96/96`,
    };

    this.users.set(id, user);
    return user;
  }

  private toAuthUser(user: UserRecord) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      timezone: user.timezone,
      avatar: user.avatar,
    };
  }
}
