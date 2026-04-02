import { SESSION_COOKIE_NAME } from "@/lib/auth/session";

export function getSessionIdFromRequest(request: Request) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const chunks = cookieHeader.split(";").map((item) => item.trim());

  for (const chunk of chunks) {
    if (!chunk.startsWith(`${SESSION_COOKIE_NAME}=`)) {
      continue;
    }

    return chunk.slice(`${SESSION_COOKIE_NAME}=`.length);
  }

  return undefined;
}
