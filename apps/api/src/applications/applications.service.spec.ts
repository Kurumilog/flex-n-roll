import { Test, TestingModule } from "@nestjs/testing";
import { ApplicationsService } from "./applications.service";
import { ApplicationStatus } from "./dto/create-application.dto";

describe("ApplicationsService", () => {
  let service: ApplicationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ApplicationsService],
    }).compile();

    service = module.get<ApplicationsService>(ApplicationsService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("findAll", () => {
    it("should return all applications without filters", () => {
      const result = service.findAll({});

      expect(result.items).toBeDefined();
      expect(Array.isArray(result.items)).toBe(true);
      expect(result.total).toBe(result.items.length);
      expect(result.total).toBeGreaterThan(0);
    });

    it("should filter by intent", () => {
      const result = service.findAll({ intent: "commercial" });

      expect(result.items.every((app) => app.intent === "commercial")).toBe(true);
    });

    it("should filter by urgency", () => {
      const result = service.findAll({ urgency: "high" });

      expect(result.items.every((app) => app.urgency === "high")).toBe(true);
    });

    it("should filter by status", () => {
      const result = service.findAll({ status: "escalated" });

      expect(result.items.every((app) => app.status === "escalated")).toBe(true);
    });

    it("should respect limit parameter", () => {
      const result = service.findAll({ limit: 2 });

      expect(result.items.length).toBeLessThanOrEqual(2);
    });

    it("should respect offset parameter", () => {
      const all = service.findAll({});
      const withOffset = service.findAll({ offset: 2 });

      expect(withOffset.items[0]?.id).not.toBe(all.items[0]?.id);
    });
  });

  describe("findOne", () => {
    it("should return application by id", () => {
      const all = service.findAll({});
      const firstId = all.items[0].id;

      const result = service.findOne(firstId);

      expect(result).toBeDefined();
      expect(result?.id).toBe(firstId);
    });

    it("should return null for non-existent id", () => {
      const result = service.findOne("non-existent-id");

      expect(result).toBeNull();
    });
  });

  describe("create", () => {
    it("should create new application", () => {
      const createDto = {
        source: "email" as const,
        rawText: "Test application",
        intent: "commercial" as const,
        urgency: "low" as const,
        complexity: "low" as const,
        aiConfidence: 85,
        assignedTo: { id: "mgr-1", name: "Test User" },
      };

      const result = service.create(createDto);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.source).toBe("email");
      expect(result.rawText).toBe("Test application");
      expect(result.status).toBe(ApplicationStatus.PROCESSING);
      expect(result.createdAt).toBeDefined();
    });

    it("should add new application to the beginning of list", () => {
      const createDto = {
        source: "webform" as const,
        rawText: "New test app",
        intent: "support" as const,
        urgency: "medium" as const,
        complexity: "medium" as const,
        aiConfidence: 90,
        assignedTo: { id: "mgr-2", name: "Test User 2" },
      };

      const before = service.findAll({});
      const result = service.create(createDto);
      const after = service.findAll({});

      expect(after.total).toBe(before.total + 1);
      expect(after.items[0].id).toBe(result.id);
    });
  });
});
