export const SESSION_COOKIE_NAME = "flexnroll_session";

export function getMockSessionCookie() {
  if (typeof document === "undefined") {
    return undefined;
  }

  const cookie = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${SESSION_COOKIE_NAME}=`));

  return cookie?.slice(`${SESSION_COOKIE_NAME}=`.length);
}

export function setMockSessionCookie(sessionId: string) {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = `${SESSION_COOKIE_NAME}=${sessionId}; path=/; max-age=86400; samesite=lax`;
}

export function clearMockSessionCookie() {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = `${SESSION_COOKIE_NAME}=; path=/; max-age=0; samesite=lax`;
}
