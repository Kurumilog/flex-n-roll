import { Test, TestingModule } from "@nestjs/testing";
import { UnauthorizedException } from "@nestjs/common";
import { ProfileService } from "./profile.service";
import { MockAuthStoreService } from "../core/mock-auth-store.service";

describe("ProfileService", () => {
  let service: ProfileService;
  let mockStore: MockAuthStoreService;

  const mockProfile = {
    id: "mgr-1",
    name: "Test User",
    email: "test@example.com",
    role: "manager",
    department: "Sales",
    timezone: "Europe/Minsk",
    bio: "Experienced sales manager",
    avatar: "https://picsum.photos/seed/test/96/96",
  };

  const mockRequest = {
    cookies: { flexnroll_session: "valid-session-id" },
  } as any;

  const mockRequestNoSession = {
    cookies: undefined,
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfileService,
        {
          provide: MockAuthStoreService,
          useValue: {
            getProfileBySessionId: jest.fn().mockImplementation((sessionId) => {
              return sessionId ? mockProfile : null;
            }),
            updateProfileBySessionId: jest.fn().mockImplementation((sessionId, payload) => {
              return sessionId ? { ...mockProfile, ...payload } : null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<ProfileService>(ProfileService);
    mockStore = module.get<MockAuthStoreService>(MockAuthStoreService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("getProfile", () => {
    it("should return profile for valid session", () => {
      const result = service.getProfile(mockRequest);

      expect(result).toEqual(mockProfile);
      expect(mockStore.getProfileBySessionId).toHaveBeenCalledWith("valid-session-id");
    });

    it("should throw UnauthorizedException when session is missing", () => {
      expect(() => service.getProfile(mockRequestNoSession)).toThrow(
        UnauthorizedException,
      );
      expect(() => service.getProfile(mockRequestNoSession)).toThrow(
        "Сессия не найдена.",
      );
    });

    it("should throw UnauthorizedException when session is invalid", () => {
      jest
        .spyOn(mockStore, "getProfileBySessionId")
        .mockReturnValueOnce(null);

      expect(() => service.getProfile(mockRequest)).toThrow(
        UnauthorizedException,
      );
    });

    it("should extract session id from cookies correctly", () => {
      service.getProfile(mockRequest);

      expect(mockStore.getProfileBySessionId).toHaveBeenCalledWith(
        "valid-session-id",
      );
    });
  });

  describe("updateProfile", () => {
    const updatePayload = {
      name: "Updated Name",
      department: "Marketing",
      bio: "New bio text",
    };

    it("should update profile and return updated data", () => {
      const result = service.updateProfile(mockRequest, updatePayload);

      expect(result).toEqual({ ...mockProfile, ...updatePayload });
      expect(mockStore.updateProfileBySessionId).toHaveBeenCalledWith(
        "valid-session-id",
        updatePayload,
      );
    });

    it("should throw UnauthorizedException when session is missing", () => {
      expect(() =>
        service.updateProfile(mockRequestNoSession, updatePayload),
      ).toThrow(UnauthorizedException);
      expect(() =>
        service.updateProfile(mockRequestNoSession, updatePayload),
      ).toThrow("Сессия не найдена.");
    });

    it("should throw UnauthorizedException when session is invalid", () => {
      jest
        .spyOn(mockStore, "updateProfileBySessionId")
        .mockReturnValueOnce(null);

      expect(() =>
        service.updateProfile(mockRequest, updatePayload),
      ).toThrow(UnauthorizedException);
    });

    it("should update only provided fields", () => {
      const partialUpdate = { timezone: "Asia/Tokyo" };
      service.updateProfile(mockRequest, partialUpdate);

      expect(mockStore.updateProfileBySessionId).toHaveBeenCalledWith(
        "valid-session-id",
        partialUpdate,
      );
    });

    it("should handle empty update payload", () => {
      service.updateProfile(mockRequest, {});

      expect(mockStore.updateProfileBySessionId).toHaveBeenCalledWith(
        "valid-session-id",
        {},
      );
    });
  });
});
