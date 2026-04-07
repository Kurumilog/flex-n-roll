import { Test, TestingModule } from "@nestjs/testing";
import { MetricsService } from "./metrics.service";

describe("MetricsService", () => {
  let service: MetricsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MetricsService],
    }).compile();

    service = module.get<MetricsService>(MetricsService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("getTodayMetrics", () => {
    it("should return metrics object with all required fields", () => {
      const result = service.getTodayMetrics();

      expect(result).toHaveProperty("totalProcessed");
      expect(result).toHaveProperty("aiConfidenceAvg");
      expect(result).toHaveProperty("autoRouted");
      expect(result).toHaveProperty("manualReview");
      expect(result).toHaveProperty("slaCompliance");
    });

    it("should return correct metric values", () => {
      const result = service.getTodayMetrics();

      expect(result.totalProcessed).toBe(47);
      expect(result.aiConfidenceAvg).toBe(88);
      expect(result.autoRouted).toBe(39);
      expect(result.manualReview).toBe(8);
      expect(result.slaCompliance).toBe(94);
    });

    it("should return all values as numbers", () => {
      const result = service.getTodayMetrics();

      expect(typeof result.totalProcessed).toBe("number");
      expect(typeof result.aiConfidenceAvg).toBe("number");
      expect(typeof result.autoRouted).toBe("number");
      expect(typeof result.manualReview).toBe("number");
      expect(typeof result.slaCompliance).toBe("number");
    });

    it("should return consistent metrics on multiple calls", () => {
      const firstCall = service.getTodayMetrics();
      const secondCall = service.getTodayMetrics();

      expect(firstCall).toEqual(secondCall);
    });

    it("should have autoRouted + manualReview <= totalProcessed", () => {
      const result = service.getTodayMetrics();

      expect(result.autoRouted + result.manualReview).toBeLessThanOrEqual(
        result.totalProcessed,
      );
    });
  });
});
