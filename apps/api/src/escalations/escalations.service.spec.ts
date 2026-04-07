import { Test, TestingModule } from "@nestjs/testing";
import { EscalationsService } from "./escalations.service";
import type { Escalation } from "./escalations.service";

describe("EscalationsService", () => {
  let service: EscalationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EscalationsService],
    }).compile();

    service = module.get<EscalationsService>(EscalationsService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("getEscalations", () => {
    it("should return array of escalations", () => {
      const result = service.getEscalations();

      expect(Array.isArray(result)).toBe(true);
    });

    it("should return exactly 2 escalations", () => {
      const result = service.getEscalations();

      expect(result).toHaveLength(2);
    });

    it("should have correct escalation structure", () => {
      const result = service.getEscalations();

      result.forEach((escalation: Escalation) => {
        expect(escalation).toHaveProperty("id");
        expect(escalation).toHaveProperty("applicationId");
        expect(escalation).toHaveProperty("reason");
        expect(escalation).toHaveProperty("escalatedAt");
        expect(escalation).toHaveProperty("assignedTo");
        expect(escalation).toHaveProperty("originalManager");
        expect(escalation).toHaveProperty("status");
      });
    });

    it("should have valid escalation reasons", () => {
      const result = service.getEscalations();
      const validReasons = ["sla_breach", "manual_escalation", "complexity_high"];

      result.forEach((escalation: Escalation) => {
        expect(validReasons).toContain(escalation.reason);
      });
    });

    it("should have valid escalation statuses", () => {
      const result = service.getEscalations();
      const validStatuses = ["pending", "resolved", "in_progress"];

      result.forEach((escalation: Escalation) => {
        expect(validStatuses).toContain(escalation.status);
      });
    });

    it("should have assignedTo with id and name", () => {
      const result = service.getEscalations();

      result.forEach((escalation: Escalation) => {
        expect(escalation.assignedTo).toHaveProperty("id");
        expect(escalation.assignedTo).toHaveProperty("name");
        expect(typeof escalation.assignedTo.id).toBe("string");
        expect(typeof escalation.assignedTo.name).toBe("string");
      });
    });

    it("should have originalManager with id and name", () => {
      const result = service.getEscalations();

      result.forEach((escalation: Escalation) => {
        expect(escalation.originalManager).toHaveProperty("id");
        expect(escalation.originalManager).toHaveProperty("name");
        expect(typeof escalation.originalManager.id).toBe("string");
        expect(typeof escalation.originalManager.name).toBe("string");
      });
    });

    it("should have escalatedAt as ISO string", () => {
      const result = service.getEscalations();

      result.forEach((escalation: Escalation) => {
        expect(() => new Date(escalation.escalatedAt)).not.toThrow();
      });
    });

    it("should return consistent escalations on multiple calls", () => {
      const firstCall = service.getEscalations();
      const secondCall = service.getEscalations();

      expect(firstCall).toEqual(secondCall);
    });

    it("should have first escalation with sla_breach reason", () => {
      const result = service.getEscalations();

      expect(result[0].reason).toBe("sla_breach");
      expect(result[0].status).toBe("in_progress");
    });

    it("should have second escalation with complexity_high reason", () => {
      const result = service.getEscalations();

      expect(result[1].reason).toBe("complexity_high");
      expect(result[1].status).toBe("pending");
    });
  });
});
