import { Test, TestingModule } from '@nestjs/testing';
import { SyncService } from '../sync.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { BitrixService } from '../../bitrix/bitrix.service';

// Mock PrismaService
const mockPrismaService = {
  leadCache: {
    upsert: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
  },
};

// Mock BitrixService
const mockBitrixService = {
  getLeads: jest.fn(),
};

describe('SyncService', () => {
  let service: SyncService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SyncService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: BitrixService, useValue: mockBitrixService },
      ],
    }).compile();

    service = module.get<SyncService>(SyncService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('syncLeads', () => {
    it('should sync leads from Bitrix24 to LeadCache', async () => {
      // arrange
      const bitrixLeads = [
        {
          ID: '27984',
          TITLE: 'ООО Лесной Край',
          STATUS_ID: '5',
          SOURCE_ID: 'WEB',
          ASSIGNED_BY_ID: 13,
          OPPORTUNITY: 5000,
          CURRENCY_ID: 'BYN',
          NAME: 'Тимофей',
          LAST_NAME: 'Мишин',
          EMAIL: [{ VALUE: 'lesnoy@example.by', VALUE_TYPE: 'WORK' }],
          PHONE: [{ VALUE: '+375291234567', VALUE_TYPE: 'WORK' }],
          COMMENTS: 'Требуется сложная этикетка',
          DATE_CREATE: '2025-11-30T17:29:00+03:00',
          DATE_MODIFY: '2025-12-01T10:00:00+03:00',
          DATE_CLOSED: null,
        },
      ];

      mockBitrixService.getLeads.mockResolvedValue(bitrixLeads);
      mockPrismaService.leadCache.upsert.mockResolvedValue({});

      // act
      const result = await service.syncLeads();

      // assert
      expect(result.synced).toBe(1);
      expect(mockBitrixService.getLeads).toHaveBeenCalledTimes(1);
      expect(mockPrismaService.leadCache.upsert).toHaveBeenCalledTimes(1);
    });

    it('should handle leads with missing optional fields', async () => {
      // arrange
      const bitrixLeads = [
        {
          ID: '27985',
          TITLE: 'Test Lead',
          STATUS_ID: 'NEW',
          // No optional fields
        },
      ];

      mockBitrixService.getLeads.mockResolvedValue(bitrixLeads);
      mockPrismaService.leadCache.upsert.mockResolvedValue({});

      // act
      const result = await service.syncLeads();

      // assert
      expect(result.synced).toBe(1);
      expect(mockPrismaService.leadCache.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { bitrixId: '27985' },
          create: expect.objectContaining({
            bitrixId: '27985',
            title: 'Test Lead',
          }),
        }),
      );
    });

    it('should return zero when no leads from Bitrix24', async () => {
      // arrange
      mockBitrixService.getLeads.mockResolvedValue([]);

      // act
      const result = await service.syncLeads();

      // assert
      expect(result.synced).toBe(0);
    });

    it('should handle sync errors gracefully', async () => {
      // arrange
      mockBitrixService.getLeads.mockRejectedValue(new Error('Bitrix API error'));

      // act
      const result = await service.syncLeads();

      // assert
      expect(result.synced).toBe(0);
      expect(result.error).toBeDefined();
    });
  });

  describe('getCacheStats', () => {
    it('should return lead cache statistics', async () => {
      // arrange
      mockPrismaService.leadCache.count.mockResolvedValue(150);

      // act
      const result = await service.getCacheStats();

      // assert
      expect(result.totalLeads).toBe(150);
    });
  });
});
