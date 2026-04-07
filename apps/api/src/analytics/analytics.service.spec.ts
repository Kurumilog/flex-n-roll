import { Test, TestingModule } from "@nestjs/testing";
import { AnalyticsService } from "./analytics.service";

describe("AnalyticsService", () => {
  let service: AnalyticsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AnalyticsService],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("getCategoriesDistribution", () => {
    it("should return array of category distributions", () => {
      const result = service.getCategoriesDistribution();

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(3);
    });

    it("should return correct category distribution structure", () => {
      const result = service.getCategoriesDistribution();

      result.forEach((item) => {
        expect(item).toHaveProperty("category");
        expect(item).toHaveProperty("count");
        expect(item).toHaveProperty("percentage");
        expect(typeof item.category).toBe("string");
        expect(typeof item.count).toBe("number");
        expect(typeof item.percentage).toBe("number");
      });
    });

    it("should return commercial category with 60% distribution", () => {
      const result = service.getCategoriesDistribution();
      const commercial = result.find((item) => item.category === "commercial");

      expect(commercial).toBeDefined();
      expect(commercial!.count).toBe(28);
      expect(commercial!.percentage).toBe(60);
    });

    it("should return support category with 25% distribution", () => {
      const result = service.getCategoriesDistribution();
      const support = result.find((item) => item.category === "support");

      expect(support).toBeDefined();
      expect(support!.count).toBe(12);
      expect(support!.percentage).toBe(25);
    });

    it("should return technical category with 15% distribution", () => {
      const result = service.getCategoriesDistribution();
      const technical = result.find((item) => item.category === "technical");

      expect(technical).toBeDefined();
      expect(technical!.count).toBe(7);
      expect(technical!.percentage).toBe(15);
    });

    it("should have percentages sum to 100", () => {
      const result = service.getCategoriesDistribution();
      const totalPercentage = result.reduce((sum, item) => sum + item.percentage, 0);

      expect(totalPercentage).toBe(100);
    });
  });

  describe("getDealStats", () => {
    it("should return deal stats for existing deal BX-1001", () => {
      const result = service.getDealStats("BX-1001");

      expect(result).not.toBeNull();
      expect(result!.dealId).toBe("BX-1001");
      expect(result!.totalAmount).toBe(125000);
      expect(result!.stage).toBe("PROPOSAL");
      expect(result!.probability).toBe(75);
    });

    it("should return deal stats for existing deal BX-1002", () => {
      const result = service.getDealStats("BX-1002");

      expect(result).not.toBeNull();
      expect(result!.dealId).toBe("BX-1002");
      expect(result!.totalAmount).toBe(15000);
      expect(result!.stage).toBe("NEGOTIATION");
      expect(result!.probability).toBe(90);
    });

    it("should return null for non-existing deal", () => {
      const result = service.getDealStats("BX-9999");

      expect(result).toBeNull();
    });

    it("should return null for empty dealId", () => {
      const result = service.getDealStats("");

      expect(result).toBeNull();
    });

    it("should return createdAt as ISO string", () => {
      const result = service.getDealStats("BX-1001");

      expect(result).not.toBeNull();
      expect(() => new Date(result!.createdAt)).not.toThrow();
    });

    it("should handle case-sensitive dealId", () => {
      const result = service.getDealStats("bx-1001");

      expect(result).toBeNull();
    });
  });
});
