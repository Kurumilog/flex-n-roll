import { Test, TestingModule } from "@nestjs/testing";
import { NotFoundException } from "@nestjs/common";
import { AnalyticsController } from "./analytics.controller";
import { AnalyticsService } from "./analytics.service";

describe("AnalyticsController", () => {
  let controller: AnalyticsController;
  let analyticsService: AnalyticsService;

  const mockAnalyticsService = {
    getCategoriesDistribution: jest.fn(),
    getDealStats: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnalyticsController],
      providers: [
        {
          provide: AnalyticsService,
          useValue: mockAnalyticsService,
        },
      ],
    }).compile();

    controller = module.get<AnalyticsController>(AnalyticsController);
    analyticsService = module.get<AnalyticsService>(AnalyticsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("getCategories", () => {
    const mockCategories = [
      { category: "commercial", count: 28, percentage: 60 },
      { category: "support", count: 12, percentage: 25 },
      { category: "technical", count: 7, percentage: 15 },
    ];

    it("should return categories distribution", () => {
      mockAnalyticsService.getCategoriesDistribution.mockReturnValue(
        mockCategories,
      );

      const result = controller.getCategories();

      expect(result).toEqual(mockCategories);
      expect(
        analyticsService.getCategoriesDistribution,
      ).toHaveBeenCalled();
    });

    it("should call service exactly once", () => {
      controller.getCategories();

      expect(
        analyticsService.getCategoriesDistribution,
      ).toHaveBeenCalledTimes(1);
    });
  });

  describe("getDealStats", () => {
    const mockDealStats = {
      dealId: "BX-1001",
      totalAmount: 125000,
      stage: "PROPOSAL",
      createdAt: new Date().toISOString(),
      probability: 75,
    };

    it("should return deal stats for existing deal", () => {
      mockAnalyticsService.getDealStats.mockReturnValue(mockDealStats);

      const result = controller.getDealStats("BX-1001");

      expect(result).toEqual(mockDealStats);
      expect(analyticsService.getDealStats).toHaveBeenCalledWith("BX-1001");
    });

    it("should throw NotFoundException when deal is not found", () => {
      mockAnalyticsService.getDealStats.mockReturnValue(null);

      expect(() => controller.getDealStats("BX-9999")).toThrow(
        NotFoundException,
      );
      expect(() => controller.getDealStats("BX-9999")).toThrow(
        "Deal not found",
      );
    });

    it("should pass dealId parameter to service", () => {
      mockAnalyticsService.getDealStats.mockReturnValue(mockDealStats);

      controller.getDealStats("BX-1002");

      expect(analyticsService.getDealStats).toHaveBeenCalledWith("BX-1002");
    });
  });
});
