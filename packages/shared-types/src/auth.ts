import { z } from "zod";

export const AuthRoleSchema = z.enum(["manager", "supervisor", "admin"]);

export const AuthUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  role: AuthRoleSchema,
  department: z.string(),
  timezone: z.string(),
  avatar: z.string().optional(),
});

export const LoginRequestSchema = z.object({
  email: z.string().email("Укажите корректный email."),
  password: z.string().min(6, "Пароль должен содержать минимум 6 символов."),
});

export const BitrixLoginRequestSchema = z.object({
  portalUrl: z.string().url().optional(),
});

export const AuthSessionResponseSchema = z.object({
  sessionId: z.string(),
  user: AuthUserSchema,
  expiresAt: z.string(),
});

export const AuthMeResponseSchema = z.object({
  user: AuthUserSchema,
});

export const ApiErrorSchema = z.object({
  message: z.string(),
  statusCode: z.number().int().optional(),
  errors: z.array(z.string()).optional(),
});

export type AuthRole = z.infer<typeof AuthRoleSchema>;
export type AuthUser = z.infer<typeof AuthUserSchema>;
export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export type BitrixLoginRequest = z.infer<typeof BitrixLoginRequestSchema>;
export type AuthSessionResponse = z.infer<typeof AuthSessionResponseSchema>;
export type AuthMeResponse = z.infer<typeof AuthMeResponseSchema>;
export type ApiError = z.infer<typeof ApiErrorSchema>;
