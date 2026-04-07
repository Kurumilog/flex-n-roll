import { Test, TestingModule } from "@nestjs/testing";
import { PipelineController } from "./pipeline.controller";
import { PipelineService } from "./pipeline.service";

describe("PipelineController", () => {
  let controller: PipelineController;
  let pipelineService: PipelineService;

  const mockPipelineService = {
    getPipelineStatus: jest.fn(),
    getPipelineHistory: jest.fn(),
  };

  const mockStatus = {
    steps: [
      { id: "1", label: "Webhook Received", status: "done", duration: 12 },
      { id: "2", label: "AI Parsing", status: "done", duration: 245 },
      { id: "3", label: "Intent Classification", status: "done", duration: 89 },
      { id: "4", label: "Urgency Detection", status: "done", duration: 67 },
      { id: "5", label: "Manager Assignment", status: "active", duration: 156 },
      { id: "6", label: "Bitrix24 Sync", status: "idle" },
      { id: "7", label: "Notification Sent", status: "idle" },
    ],
  };

  const mockHistory = Array(5).fill(mockStatus);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PipelineController],
      providers: [
        {
          provide: PipelineService,
          useValue: mockPipelineService,
        },
      ],
    }).compile();

    controller = module.get<PipelineController>(PipelineController);
    pipelineService = module.get<PipelineService>(PipelineService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("getStatus", () => {
    it("should return pipeline status", () => {
      mockPipelineService.getPipelineStatus.mockReturnValue(mockStatus);

      const result = controller.getStatus();

      expect(result).toEqual(mockStatus);
      expect(pipelineService.getPipelineStatus).toHaveBeenCalled();
    });

    it("should call service exactly once", () => {
      controller.getStatus();

      expect(pipelineService.getPipelineStatus).toHaveBeenCalledTimes(1);
    });
  });

  describe("getHistory", () => {
    it("should return pipeline history", () => {
      mockPipelineService.getPipelineHistory.mockReturnValue(mockHistory);

      const result = controller.getHistory();

      expect(result).toEqual(mockHistory);
      expect(pipelineService.getPipelineHistory).toHaveBeenCalled();
    });

    it("should call service exactly once", () => {
      controller.getHistory();

      expect(pipelineService.getPipelineHistory).toHaveBeenCalledTimes(1);
    });
  });
});
