import { Test, TestingModule } from "@nestjs/testing";
import { UnauthorizedException } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { MockAuthStoreService } from "../core/mock-auth-store.service";
import { AppConfigService } from "../config/app.config";

describe("AuthService", () => {
  let service: AuthService;
  let mockStore: MockAuthStoreService;

  const mockResponse = {
    cookie: jest.fn(),
    clearCookie: jest.fn(),
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: AppConfigService,
          useValue: {
            demoPassword: process.env.DEMO_PASSWORD || "demo12345",
            nodeEnv: "test",
            port: 3001,
            frontendOrigin: "http://localhost:3000",
            groqApiKey: undefined,
            bitrix24WebhookUrl: undefined,
            jwtSecret: undefined,
            isDevelopment: false,
            isProduction: false,
            isTest: true,
          },
        },
        {
          provide: MockAuthStoreService,
          useValue: {
            loginWithEmail: jest.fn().mockReturnValue({
              sessionId: "test-session-id",
              user: {
                id: "mgr-1",
                name: "Test User",
                email: "test@example.com",
                role: "manager",
                department: "Sales",
                timezone: "Europe/Minsk",
                avatar: "https://picsum.photos/seed/test/96/96",
              },
              expiresAt: new Date(Date.now() + 3600000).toISOString(),
            }),
            loginWithBitrix: jest.fn().mockReturnValue({
              sessionId: "bitrix-session-id",
              user: {
                id: "mgr-2",
                name: "Bitrix Agent",
                email: "bitrix@flexnroll.ai",
                role: "supervisor",
                department: "Operations",
                timezone: "Europe/Minsk",
                avatar: "https://picsum.photos/seed/bitrix/96/96",
              },
              expiresAt: new Date(Date.now() + 3600000).toISOString(),
            }),
            getUserBySessionId: jest.fn().mockImplementation((sessionId?: string) => {
              if (!sessionId) {
                return null;
              }
              return {
                id: "mgr-1",
                name: "Test User",
                email: "test@example.com",
                role: "manager",
                department: "Sales",
                timezone: "Europe/Minsk",
                avatar: "https://picsum.photos/seed/test/96/96",
              };
            }),
            revokeSession: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    mockStore = module.get<MockAuthStoreService>(MockAuthStoreService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("login", () => {
    it("should login with correct password", () => {
      const loginDto = { email: "test@example.com", password: process.env.DEMO_PASSWORD || "demo12345" };

      const result = service.login(loginDto, mockResponse);

      expect(result).toBeDefined();
      expect(result.sessionId).toBe("test-session-id");
      expect(mockResponse.cookie).toHaveBeenCalled();
    });

    it("should throw UnauthorizedException with wrong password", () => {
      const loginDto = { email: "test@example.com", password: "wrongpassword" };

      expect(() => service.login(loginDto, mockResponse)).toThrow(UnauthorizedException);
    });
  });

  describe("getMe", () => {
    it("should return user for valid session", () => {
      const mockRequest = {
        cookies: { flexnroll_session: "test-session-id" },
      } as any;

      const result = service.getMe(mockRequest);

      expect(result).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.user.id).toBe("mgr-1");
    });

    it("should throw UnauthorizedException for missing session", () => {
      const mockRequest = { cookies: {} } as any;

      expect(() => service.getMe(mockRequest)).toThrow(UnauthorizedException);
    });
  });

  describe("logout", () => {
    it("should revoke session and clear cookie", () => {
      const mockRequest = {
        cookies: { flexnroll_session: "test-session-id" },
      } as any;

      const result = service.logout(mockRequest, mockResponse);

      expect(mockStore.revokeSession).toHaveBeenCalledWith("test-session-id");
      expect(mockResponse.clearCookie).toHaveBeenCalled();
      expect(result).toEqual({ ok: true });
    });
  });
});
