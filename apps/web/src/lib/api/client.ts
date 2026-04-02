import { ApiErrorSchema } from "@flex-n-roll/shared-types";

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
};

const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS === "true";

export class ApiClientError extends Error {
  status: number;
  payload?: unknown;

  constructor(message: string, status: number, payload?: unknown) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.payload = payload;
  }
}

function buildHeaders(headers?: HeadersInit) {
  return {
    "Content-Type": "application/json",
    ...headers,
  };
}

function parseJsonSafely(text: string) {
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export async function apiRequest<T>(url: string, options: RequestOptions = {}): Promise<T> {
  const response = await fetch(url, {
    method: options.method ?? "GET",
    headers: buildHeaders(options.headers),
    credentials: "include",
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    cache: "no-store",
  });

  const rawText = await response.text();
  const parsedPayload = parseJsonSafely(rawText);

  if (!response.ok) {
    const parsedError = ApiErrorSchema.safeParse(parsedPayload);
    const message =
      parsedError.success && parsedError.data.message
        ? parsedError.data.message
        : "Запрос завершился ошибкой.";

    throw new ApiClientError(message, response.status, parsedPayload);
  }

  return parsedPayload as T;
}

export function getErrorMessage(error: unknown, fallback = "Произошла ошибка.") {
  if (error instanceof ApiClientError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}

export function isMockMode() {
  return USE_MOCKS;
}
