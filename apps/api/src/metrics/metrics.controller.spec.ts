import { Test, TestingModule } from "@nestjs/testing";
import { MetricsController } from "./metrics.controller";
import { MetricsService } from "./metrics.service";

describe("MetricsController", () => {
  let controller: MetricsController;
  let metricsService: MetricsService;

  const mockMetricsService = {
    getTodayMetrics: jest.fn(),
  };

  const mockMetrics = {
    totalProcessed: 47,
    aiConfidenceAvg: 88,
    autoRouted: 39,
    manualReview: 8,
    slaCompliance: 94,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MetricsController],
      providers: [
        {
          provide: MetricsService,
          useValue: mockMetricsService,
        },
      ],
    }).compile();

    controller = module.get<MetricsController>(MetricsController);
    metricsService = module.get<MetricsService>(MetricsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("getTodayMetrics", () => {
    it("should return today's metrics", () => {
      mockMetricsService.getTodayMetrics.mockReturnValue(mockMetrics);

      const result = controller.getTodayMetrics();

      expect(result).toEqual(mockMetrics);
      expect(metricsService.getTodayMetrics).toHaveBeenCalled();
    });

    it("should call service exactly once", () => {
      controller.getTodayMetrics();

      expect(metricsService.getTodayMetrics).toHaveBeenCalledTimes(1);
    });
  });
});
