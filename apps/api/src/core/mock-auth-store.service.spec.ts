import { Test, TestingModule } from "@nestjs/testing";
import { UnauthorizedException } from "@nestjs/common";
import { MockAuthStoreService } from "./mock-auth-store.service";

describe("MockAuthStoreService", () => {
  let service: MockAuthStoreService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MockAuthStoreService],
    }).compile();

    service = module.get<MockAuthStoreService>(MockAuthStoreService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("loginWithEmail", () => {
    it("should create session for existing user", () => {
      const result = service.loginWithEmail("demo@flexnroll.ai");

      expect(result).toBeDefined();
      expect(result.sessionId).toBeDefined();
      expect(result.user.email).toBe("demo@flexnroll.ai");
      expect(result.user.name).toBe("Ivan Ivanov");
      expect(result.user.role).toBe("manager");
    });

    it("should create new user for unknown email", () => {
      const result = service.loginWithEmail("newuser@example.com");

      expect(result).toBeDefined();
      expect(result.user.email).toBe("newuser@example.com");
      expect(result.user.name).toBe("Newuser");
      expect(result.user.role).toBe("manager");
    });

    it("should handle case-insensitive email lookup", () => {
      const result = service.loginWithEmail("DEMO@FLEXNROLL.AI");

      expect(result).toBeDefined();
      expect(result.user.email).toBe("demo@flexnroll.ai");
    });
  });

  describe("loginWithBitrix", () => {
    it("should return Bitrix user session", () => {
      const result = service.loginWithBitrix();

      expect(result).toBeDefined();
      expect(result.user.email).toBe("bitrix@flexnroll.ai");
      expect(result.user.name).toBe("Bitrix Agent");
      expect(result.user.role).toBe("supervisor");
    });
  });

  describe("getUserBySessionId", () => {
    it("should return null for undefined sessionId", () => {
      const result = service.getUserBySessionId(undefined);

      expect(result).toBeNull();
    });

    it("should return null for non-existent session", () => {
      const result = service.getUserBySessionId("non-existent");

      expect(result).toBeNull();
    });

    it("should return user for valid session", () => {
      const session = service.loginWithEmail("demo@flexnroll.ai");
      const result = service.getUserBySessionId(session.sessionId);

      expect(result).toBeDefined();
      expect(result?.email).toBe("demo@flexnroll.ai");
    });

    it("should exclude bio from returned user", () => {
      const session = service.loginWithEmail("demo@flexnroll.ai");
      const result = service.getUserBySessionId(session.sessionId);

      expect(result).not.toHaveProperty("bio");
    });
  });

  describe("getProfileBySessionId", () => {
    it("should return null for undefined sessionId", () => {
      const result = service.getProfileBySessionId(undefined);

      expect(result).toBeNull();
    });

    it("should return profile with bio for valid session", () => {
      const session = service.loginWithEmail("demo@flexnroll.ai");
      const result = service.getProfileBySessionId(session.sessionId);

      expect(result).toBeDefined();
      expect(result?.profile.email).toBe("demo@flexnroll.ai");
      expect(result?.profile.bio).toBeDefined();
    });
  });

  describe("updateProfileBySessionId", () => {
    it("should return null for undefined sessionId", () => {
      const result = service.updateProfileBySessionId(undefined, {
        name: "New Name",
      });

      expect(result).toBeNull();
    });

    it("should update user profile fields", () => {
      const session = service.loginWithEmail("demo@flexnroll.ai");
      const result = service.updateProfileBySessionId(session.sessionId, {
        name: "Updated Name",
        department: "Updated Dept",
      });

      expect(result).toBeDefined();
      expect(result?.profile.name).toBe("Updated Name");
      expect(result?.profile.department).toBe("Updated Dept");
    });

    it("should preserve unchanged fields", () => {
      const session = service.loginWithEmail("demo@flexnroll.ai");
      service.updateProfileBySessionId(session.sessionId, {
        name: "Updated Name",
      });
      const profile = service.getProfileBySessionId(session.sessionId);

      expect(profile?.profile.email).toBe("demo@flexnroll.ai");
      expect(profile?.profile.role).toBe("manager");
    });
  });

  describe("revokeSession", () => {
    it("should do nothing for undefined sessionId", () => {
      expect(() => service.revokeSession(undefined)).not.toThrow();
    });

    it("should invalidate session", () => {
      const session = service.loginWithEmail("demo@flexnroll.ai");
      service.revokeSession(session.sessionId);
      const result = service.getUserBySessionId(session.sessionId);

      expect(result).toBeNull();
    });
  });
});
