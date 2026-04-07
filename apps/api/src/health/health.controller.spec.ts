import { Test, TestingModule } from "@nestjs/testing";
import { HealthController } from "./health.controller";

describe("HealthController", () => {
  let controller: HealthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("getHealth", () => {
    it("should return health status object", () => {
      const result = controller.getHealth();

      expect(result).toHaveProperty("status");
      expect(result).toHaveProperty("timestamp");
      expect(result).toHaveProperty("service");
    });

    it("should return status 'ok'", () => {
      const result = controller.getHealth();

      expect(result.status).toBe("ok");
    });

    it("should return timestamp as ISO string", () => {
      const result = controller.getHealth();

      expect(() => new Date(result.timestamp)).not.toThrow();
    });

    it("should return service name 'flex-n-roll-api'", () => {
      const result = controller.getHealth();

      expect(result.service).toBe("flex-n-roll-api");
    });

    it("should return valid ISO timestamp", () => {
      const result = controller.getHealth();

      expect(() => new Date(result.timestamp)).not.toThrow();
      expect(Date.parse(result.timestamp)).not.toBeNaN();
    });
  });
});
