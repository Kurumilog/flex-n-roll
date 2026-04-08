import { Test, TestingModule } from '@nestjs/testing';
import { KpiService } from '../kpi.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { BitrixService } from '../../bitrix/bitrix.service';

// Mock PrismaService
const mockPrismaService = {
  employee: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  kpiHistory: {
    create: jest.fn(),
    findMany: jest.fn(),
  },
  $transaction: jest.fn(),
};

// Mock BitrixService
const mockBitrixService = {
  getDeals: jest.fn(),
};

describe('KpiService', () => {
  let service: KpiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KpiService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: BitrixService, useValue: mockBitrixService },
      ],
    }).compile();

    service = module.get<KpiService>(KpiService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculateKpiScore', () => {
    it('should return 50 (default) when no deals', () => {
      const score = service.calculateKpiScore(0, 0, 0);
      expect(score).toBe(50.0);
    });

    it('should return high KPI for 100% conversion with fast response', () => {
      // 10 won, 0 lost, 5 min avg response
      const score = service.calculateKpiScore(10, 0, 5);
      // conversionScore = (10/10) * 60 = 60
      // responseScore = 20 * (1 - log(5/5) / log(300)) = 20 * (1 - 0) = 20
      // volumeScore = min(20, (10/100) * 20) = 2
      // Total = 60 + 20 + 2 = 82
      expect(score).toBeCloseTo(82, 0);
    });

    it('should return moderate KPI for 50% conversion', () => {
      // 5 won, 5 lost, 30 min avg response
      const score = service.calculateKpiScore(5, 5, 30);
      // conversionScore = (5/10) * 60 = 30
      // responseScore = 20 * (1 - log(30/5) / log(300)) ≈ 20 * (1 - 0.778/2.477) ≈ 13.7
      // volumeScore = min(20, (10/100) * 20) = 2
      // Total ≈ 30 + 13.7 + 2 ≈ 45.7
      expect(score).toBeGreaterThan(40);
      expect(score).toBeLessThan(55);
    });

    it('should cap KPI at 100 maximum', () => {
      // Extremely high numbers
      const score = service.calculateKpiScore(1000, 0, 1);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should not go below 0', () => {
      // Negative scenario (shouldn't happen but test edge case)
      const score = service.calculateKpiScore(0, 100, 1000);
      expect(score).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getCurrentKpi', () => {
    it('should return KPI for all employees', async () => {
      // arrange
      mockPrismaService.employee.findMany.mockResolvedValue([
        {
          id: 13,
          name: 'Марина',
          lastName: 'Бургацкая',
          department: 'Сложная этикетка',
          kpiScore: 91.0,
          dealsWon: 45,
          dealsLost: 4,
          avgResponseMinutes: 8.5,
        },
      ]);

      // act
      const result = await service.getCurrentKpi();

      // assert
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(13);
      expect(result[0].kpiScore).toBe(91.0);
    });

    it('should return empty array when no employees', async () => {
      // arrange
      mockPrismaService.employee.findMany.mockResolvedValue([]);

      // act
      const result = await service.getCurrentKpi();

      // assert
      expect(result).toEqual([]);
    });
  });

  describe('recalculateKpi', () => {
    it('should update employee KPI and create history entry', async () => {
      // arrange
      const deals = [
        { ASSIGNED_BY_ID: 13, STAGE_SEMANTIC_ID: 'S' }, // won
        { ASSIGNED_BY_ID: 13, STAGE_SEMANTIC_ID: 'S' }, // won
        { ASSIGNED_BY_ID: 13, STAGE_SEMANTIC_ID: 'F' }, // lost
      ];
      mockBitrixService.getDeals.mockResolvedValue(deals);
      mockPrismaService.employee.findUnique.mockResolvedValue({
        id: 13,
        name: 'Марина',
        avgResponseMinutes: 10,
      });
      mockPrismaService.employee.update.mockResolvedValue({
        id: 13,
        kpiScore: 75.0,
      });
      mockPrismaService.kpiHistory.create.mockResolvedValue({});

      // act
      await service.recalculateKpi(13);

      // assert
      expect(mockPrismaService.employee.update).toHaveBeenCalledWith({
        where: { id: 13 },
        data: expect.objectContaining({
          dealsWon: 2,
          dealsLost: 1,
          kpiScore: expect.any(Number),
        }),
      });
      expect(mockPrismaService.kpiHistory.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          employeeId: 13,
          dealsWon: 2,
          dealsLost: 1,
          kpiScore: expect.any(Number),
        }),
      });
    });

    it('should throw if employee not found', async () => {
      // arrange
      mockPrismaService.employee.findUnique.mockResolvedValue(null);

      // act & assert
      await expect(service.recalculateKpi(999)).rejects.toThrow();
    });
  });

  describe('recalculateAllKpi', () => {
    it('should recalculate KPI for all employees with deals', async () => {
      // arrange
      const deals = [
        { ASSIGNED_BY_ID: 13, STAGE_SEMANTIC_ID: 'S' },
        { ASSIGNED_BY_ID: 13, STAGE_SEMANTIC_ID: 'F' },
        { ASSIGNED_BY_ID: 33, STAGE_SEMANTIC_ID: 'S' },
      ];
      mockBitrixService.getDeals.mockResolvedValue(deals);
      mockPrismaService.employee.findUnique
        .mockResolvedValueOnce({ id: 13, name: 'Марина', avgResponseMinutes: 10 })
        .mockResolvedValueOnce({ id: 33, name: 'Александр', avgResponseMinutes: 15 });
      mockPrismaService.employee.update.mockResolvedValue({});
      mockPrismaService.kpiHistory.create.mockResolvedValue({});

      // act
      const result = await service.recalculateAllKpi();

      // assert
      expect(result).toHaveLength(2);
      expect(mockBitrixService.getDeals).toHaveBeenCalledTimes(1);
    });
  });
});
