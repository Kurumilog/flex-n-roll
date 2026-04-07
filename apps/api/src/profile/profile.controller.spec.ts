import { Test, TestingModule } from "@nestjs/testing";
import { ProfileController } from "./profile.controller";
import { ProfileService } from "./profile.service";

describe("ProfileController", () => {
  let controller: ProfileController;
  let profileService: ProfileService;

  const mockProfileService = {
    getProfile: jest.fn(),
    updateProfile: jest.fn(),
  };

  const mockRequest = {
    cookies: { flexnroll_session: "test-session" },
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProfileController],
      providers: [
        {
          provide: ProfileService,
          useValue: mockProfileService,
        },
      ],
    }).compile();

    controller = module.get<ProfileController>(ProfileController);
    profileService = module.get<ProfileService>(ProfileService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("getProfile", () => {
    const mockProfile = {
      id: "mgr-1",
      name: "Test User",
      email: "test@example.com",
      role: "manager",
      department: "Sales",
      timezone: "Europe/Minsk",
    };

    it("should return profile from service", async () => {
      mockProfileService.getProfile.mockReturnValue(mockProfile);

      const result = controller.getProfile(mockRequest);

      expect(result).toEqual(mockProfile);
      expect(profileService.getProfile).toHaveBeenCalledWith(mockRequest);
    });

    it("should pass request object to service", async () => {
      controller.getProfile(mockRequest);

      expect(profileService.getProfile).toHaveBeenCalledWith(mockRequest);
    });
  });

  describe("updateProfile", () => {
    const mockUpdatePayload = {
      name: "Updated Name",
      department: "Marketing",
    };

    const mockUpdatedProfile = {
      id: "mgr-1",
      name: "Updated Name",
      email: "test@example.com",
      role: "manager",
      department: "Marketing",
      timezone: "Europe/Minsk",
    };

    it("should update profile and return updated data", async () => {
      mockProfileService.updateProfile.mockReturnValue(mockUpdatedProfile);

      const result = controller.updateProfile(mockRequest, mockUpdatePayload);

      expect(result).toEqual(mockUpdatedProfile);
      expect(profileService.updateProfile).toHaveBeenCalledWith(
        mockRequest,
        mockUpdatePayload,
      );
    });

    it("should pass both request and payload to service", async () => {
      controller.updateProfile(mockRequest, mockUpdatePayload);

      expect(profileService.updateProfile).toHaveBeenCalledWith(
        mockRequest,
        mockUpdatePayload,
      );
    });
  });
});
