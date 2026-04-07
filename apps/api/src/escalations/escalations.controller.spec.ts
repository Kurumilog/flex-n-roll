import { Test, TestingModule } from "@nestjs/testing";
import { EscalationsController } from "./escalations.controller";
import { EscalationsService } from "./escalations.service";

describe("EscalationsController", () => {
  let controller: EscalationsController;
  let escalationsService: EscalationsService;

  const mockEscalationsService = {
    getEscalations: jest.fn(),
  };

  const mockEscalations = [
    {
      id: "esc-1",
      applicationId: "app-urgent-1",
      reason: "sla_breach",
      escalatedAt: new Date().toISOString(),
      assignedTo: { id: "sup-1", name: "Supervisor Anna" },
      originalManager: { id: "mgr-1", name: "Ivan Ivanov" },
      status: "in_progress",
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EscalationsController],
      providers: [
        {
          provide: EscalationsService,
          useValue: mockEscalationsService,
        },
      ],
    }).compile();

    controller = module.get<EscalationsController>(EscalationsController);
    escalationsService = module.get<EscalationsService>(EscalationsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("getEscalations", () => {
    it("should return escalations list", () => {
      mockEscalationsService.getEscalations.mockReturnValue(mockEscalations);

      const result = controller.getEscalations();

      expect(result).toEqual(mockEscalations);
      expect(escalationsService.getEscalations).toHaveBeenCalled();
    });

    it("should call service exactly once", () => {
      controller.getEscalations();

      expect(escalationsService.getEscalations).toHaveBeenCalledTimes(1);
    });
  });
});
