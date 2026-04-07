import { Test, TestingModule } from "@nestjs/testing";
import { PipelineService } from "./pipeline.service";
import type { PipelineStep, PipelineStatus } from "./pipeline.service";

describe("PipelineService", () => {
  let service: PipelineService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PipelineService],
    }).compile();

    service = module.get<PipelineService>(PipelineService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("getPipelineStatus", () => {
    it("should return pipeline status with steps", () => {
      const result = service.getPipelineStatus();

      expect(result).toHaveProperty("steps");
      expect(Array.isArray(result.steps)).toBe(true);
    });

    it("should return 7 pipeline steps", () => {
      const result = service.getPipelineStatus();

      expect(result.steps).toHaveLength(7);
    });

    it("should have correct step structure", () => {
      const result = service.getPipelineStatus();

      result.steps.forEach((step: PipelineStep) => {
        expect(step).toHaveProperty("id");
        expect(step).toHaveProperty("label");
        expect(step).toHaveProperty("status");
        expect(["idle", "active", "done", "error"]).toContain(step.status);
      });
    });

    it("should have specific step labels", () => {
      const result = service.getPipelineStatus();
      const labels = result.steps.map((s) => s.label);

      expect(labels).toContain("Webhook Received");
      expect(labels).toContain("AI Parsing");
      expect(labels).toContain("Intent Classification");
      expect(labels).toContain("Urgency Detection");
      expect(labels).toContain("Manager Assignment");
      expect(labels).toContain("Bitrix24 Sync");
      expect(labels).toContain("Notification Sent");
    });

    it("should have at least one active step", () => {
      const result = service.getPipelineStatus();
      const activeSteps = result.steps.filter((s) => s.status === "active");

      expect(activeSteps.length).toBeGreaterThanOrEqual(1);
    });

    it("should have done steps with duration", () => {
      const result = service.getPipelineStatus();
      const doneSteps = result.steps.filter(
        (s) => s.status === "done" && s.duration !== undefined,
      );

      expect(doneSteps.length).toBeGreaterThan(0);
      doneSteps.forEach((step) => {
        expect(typeof step.duration).toBe("number");
        expect(step.duration!).toBeGreaterThan(0);
      });
    });

    it("should have idle steps without duration", () => {
      const result = service.getPipelineStatus();
      const idleSteps = result.steps.filter((s) => s.status === "idle");

      expect(idleSteps.length).toBeGreaterThan(0);
      idleSteps.forEach((step) => {
        expect(step.duration).toBeUndefined();
      });
    });

    it("should return consistent status on multiple calls", () => {
      const firstCall = service.getPipelineStatus();
      const secondCall = service.getPipelineStatus();

      expect(firstCall).toEqual(secondCall);
    });
  });

  describe("getPipelineHistory", () => {
    it("should return array of pipeline statuses", () => {
      const result = service.getPipelineHistory();

      expect(Array.isArray(result)).toBe(true);
    });

    it("should return exactly 5 history entries", () => {
      const result = service.getPipelineHistory();

      expect(result).toHaveLength(5);
    });

    it("should have all steps with done status in history", () => {
      const result = service.getPipelineHistory();

      result.forEach((status: PipelineStatus) => {
        status.steps.forEach((step: PipelineStep) => {
          expect(step.status).toBe("done");
        });
      });
    });

    it("should have all steps with duration in history", () => {
      const result = service.getPipelineHistory();

      result.forEach((status: PipelineStatus) => {
        status.steps.forEach((step: PipelineStep) => {
          expect(step.duration).toBeDefined();
          expect(typeof step.duration).toBe("number");
        });
      });
    });

    it("should have 7 steps in each history entry", () => {
      const result = service.getPipelineHistory();

      result.forEach((status: PipelineStatus) => {
        expect(status.steps).toHaveLength(7);
      });
    });

    it("should have increasing durations across history entries", () => {
      const result = service.getPipelineHistory();

      // First entry should have smaller durations than last entry
      const firstEntry = result[0];
      const lastEntry = result[4];

      firstEntry.steps.forEach((step: PipelineStep, index: number) => {
        expect(step.duration).toBeLessThanOrEqual(
          lastEntry.steps[index].duration!,
        );
      });
    });
  });
});
