import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsService } from '../analytics.service';
import { PrismaService } from '../../../prisma/prisma.service';

// Mock PrismaService
const mockPrismaService = {
  leadCache: {
    count: jest.fn(),
    groupBy: jest.fn(),
  },
  employee: {
    findMany: jest.fn(),
  },
  mailing: {
    findMany: jest.fn(),
  },
};

describe('AnalyticsService', () => {
  let service: AnalyticsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getFunnel', () => {
    it('should return conversion funnel by status', async () => {
      // arrange
      mockPrismaService.leadCache.count.mockResolvedValue(100); // total
      mockPrismaService.leadCache.groupBy.mockResolvedValue([
        { statusId: 'NEW', _count: { statusId: 38 } },
        { statusId: '3', _count: { statusId: 23 } },
        { statusId: 'CONVERTED', _count: { statusId: 6 } },
      ]);

      // act
      const result = await service.getFunnel();

      // assert
      expect(result.total).toBe(100);
      expect(result.byStatus).toHaveLength(3);
      expect(result.byStatus[0].count).toBe(38);
      expect(result.byStatus[0].percentage).toBe(38.0);
    });

    it('should handle empty lead cache', async () => {
      // arrange
      mockPrismaService.leadCache.count.mockResolvedValue(0);
      mockPrismaService.leadCache.groupBy.mockResolvedValue([]);

      // act
      const result = await service.getFunnel();

      // assert
      expect(result.total).toBe(0);
      expect(result.byStatus).toEqual([]);
    });
  });

  describe('getRejections', () => {
    it('should return top rejection reasons', async () => {
      // arrange
      mockPrismaService.leadCache.groupBy.mockResolvedValue([
        { statusId: 'JUNK', _count: { statusId: 15 } },
        { statusId: '16', _count: { statusId: 10 } },
        { statusId: '17', _count: { statusId: 8 } },
      ]);

      // act
      const result = await service.getRejections();

      // assert
      expect(result).toHaveLength(3);
      expect(result[0].reason).toBe('Не используют этикетку');
      expect(result[0].count).toBe(15);
    });

    it('should map status IDs to rejection reason names', async () => {
      // arrange
      mockPrismaService.leadCache.groupBy.mockResolvedValue([
        { statusId: '15', _count: { statusId: 5 } },
        { statusId: '20', _count: { statusId: 3 } },
      ]);

      // act
      const result = await service.getRejections();

      // assert
      expect(result[0].reason).toBe('Работают с посредником');
      expect(result[1].reason).toBe('Банкроты / ненадёжные');
    });

    it('should return empty array when no rejections', async () => {
      // arrange
      mockPrismaService.leadCache.groupBy.mockResolvedValue([]);

      // act
      const result = await service.getRejections();

      // assert
      expect(result).toEqual([]);
    });
  });

  describe('getManagerStats', () => {
    it('should return manager statistics with KPI', async () => {
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
          isAvailable: true,
        },
      ]);

      // act
      const result = await service.getManagerStats();

      // assert
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(13);
      expect(result[0].kpiScore).toBe(91.0);
      expect(result[0].isAvailable).toBe(true);
    });

    it('should return empty array when no employees', async () => {
      // arrange
      mockPrismaService.employee.findMany.mockResolvedValue([]);

      // act
      const result = await service.getManagerStats();

      // assert
      expect(result).toEqual([]);
    });
  });

  describe('getMailingStats', () => {
    it('should return mailing statistics', async () => {
      // arrange
      mockPrismaService.mailing.findMany.mockResolvedValue([
        { status: 'sent', responseReceived: true, channel: 'email' },
        { status: 'sent', responseReceived: false, channel: 'email' },
        { status: 'failed', responseReceived: false, channel: 'telegram' },
      ]);

      // act
      const result = await service.getMailingStats();

      // assert
      expect(result.total).toBe(3);
      expect(result.sent).toBe(2);
      expect(result.failed).toBe(1);
      expect(result.responseRate).toBeCloseTo(50);
    });

    it('should handle empty mailing list', async () => {
      // arrange
      mockPrismaService.mailing.findMany.mockResolvedValue([]);

      // act
      const result = await service.getMailingStats();

      // assert
      expect(result.total).toBe(0);
      expect(result.responseRate).toBe(0);
    });
  });
});
