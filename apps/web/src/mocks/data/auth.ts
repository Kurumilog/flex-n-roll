import type { AuthSessionResponse, AuthUser, Profile } from "@flex-n-roll/shared-types";

type SessionRecord = {
  userId: string;
  expiresAt: string;
};

const DAY_MS = 24 * 60 * 60 * 1000;

const users = new Map<string, AuthUser>([
  [
    "mgr-1",
    {
      id: "mgr-1",
      name: "Ivan Ivanov",
      email: "demo@flexnroll.ai",
      role: "manager",
      department: "Sales",
      timezone: "Europe/Minsk",
      avatar: "https://picsum.photos/seed/flexnroll-ivan/96/96",
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
      avatar: "https://picsum.photos/seed/flexnroll-bitrix/96/96",
    },
  ],
]);

const sessions = new Map<string, SessionRecord>();

export function createEmailSession(email: string): AuthSessionResponse {
  const user = ensureUserByEmail(email);
  const sessionId = `mock-${Math.random().toString(36).slice(2, 12)}`;
  const expiresAt = new Date(Date.now() + DAY_MS).toISOString();
  sessions.set(sessionId, { userId: user.id, expiresAt });

  return {
    sessionId,
    user,
    expiresAt,
  };
}

export function createBitrixSession() {
  const user = users.get("mgr-2");
  const sessionId = `mock-${Math.random().toString(36).slice(2, 12)}`;
  const expiresAt = new Date(Date.now() + DAY_MS).toISOString();
  sessions.set(sessionId, { userId: user!.id, expiresAt });

  return {
    sessionId,
    user: user!,
    expiresAt,
  };
}

export function getUserBySession(sessionId: string | undefined) {
  if (!sessionId) {
    return null;
  }

  const session = sessions.get(sessionId);
  if (!session) {
    return null;
  }

  if (new Date(session.expiresAt).getTime() <= Date.now()) {
    sessions.delete(sessionId);
    return null;
  }

  return users.get(session.userId) ?? null;
}

export function revokeSession(sessionId: string | undefined) {
  if (!sessionId) {
    return;
  }

  sessions.delete(sessionId);
}

export function getProfileBySession(sessionId: string | undefined) {
  const user = getUserBySession(sessionId);
  if (!user) {
    return null;
  }

  const profile: Profile = {
    ...user,
    bio: "Контролирую маршрутизацию входящих заявок и SLA-эскалации.",
  };

  return profile;
}

export function updateProfileBySession(
  sessionId: string | undefined,
  payload: Partial<Pick<Profile, "name" | "department" | "timezone" | "bio">>,
) {
  const user = getUserBySession(sessionId);
  if (!user) {
    return null;
  }

  const nextUser: AuthUser = {
    ...user,
    name: payload.name ?? user.name,
    department: payload.department ?? user.department,
    timezone: payload.timezone ?? user.timezone,
  };
  users.set(user.id, nextUser);

  const profile: Profile = {
    ...nextUser,
    bio: payload.bio ?? "Контролирую маршрутизацию входящих заявок и SLA-эскалации.",
  };

  return profile;
}

function ensureUserByEmail(email: string) {
  for (const user of users.values()) {
    if (user.email.toLowerCase() === email.toLowerCase()) {
      return user;
    }
  }

  const generatedUser: AuthUser = {
    id: `mgr-${users.size + 1}`,
    name: email.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    email,
    role: "manager",
    department: "Sales",
    timezone: "Europe/Minsk",
    avatar: `https://picsum.photos/seed/flexnroll-${users.size + 1}/96/96`,
  };
  users.set(generatedUser.id, generatedUser);

  return generatedUser;
}
