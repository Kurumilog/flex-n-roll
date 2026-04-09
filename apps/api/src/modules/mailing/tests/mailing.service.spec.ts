import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { MailingService } from '../mailing.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { OllamaService, OllamaUnavailableException } from '../../ollama/ollama.service';

// Mock nodemailer
jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test-123' }),
  }),
}));

// Mock PrismaService
const mockPrismaService = {
  leadCache: {
    findMany: jest.fn(),
  },
  mailing: {
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  $transaction: jest.fn(),
};

// Mock OllamaService
const mockOllamaService = {
  chat: jest.fn(),
};

// Mock ConfigService
const mockConfigService = {
  get: jest.fn((key: string, defaultValue?: string) => defaultValue),
};

describe('MailingService', () => {
  let service: MailingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailingService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: OllamaService, useValue: mockOllamaService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<MailingService>(MailingService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getCandidates', () => {
    it('should return leads inactive for more than N days', async () => {
      // arrange
      const inactiveDays = 30;
      const limit = 50;
      mockPrismaService.leadCache.findMany.mockResolvedValue([
        {
          bitrixId: '27984',
          title: 'ООО Лесной Край',
          clientName: 'Тимофей Мишин',
          clientEmail: 'lesnoy@example.by',
          statusId: '5',
          dateModify: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000), // 45 days ago
          comments: 'Требуется сложная этикетка',
        },
      ]);

      // act
      const result = await service.getCandidates(inactiveDays, limit);

      // assert
      expect(result).toHaveLength(1);
      expect(result[0].leadId).toBe('27984');
      expect(result[0].inactiveDays).toBeGreaterThanOrEqual(30);
    });

    it('should exclude terminal failure statuses', async () => {
      // arrange
      mockPrismaService.leadCache.findMany.mockResolvedValue([]);

      // act
      const result = await service.getCandidates(30, 50);

      // assert
      expect(result).toEqual([]);
      expect(mockPrismaService.leadCache.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            statusId: {
              notIn: ['CONVERTED', 'JUNK', '15', '16', '17', '18', '19', '20', '22'],
            },
          }),
        }),
      );
    });

    it('should return empty array when no candidates', async () => {
      // arrange
      mockPrismaService.leadCache.findMany.mockResolvedValue([]);

      // act
      const result = await service.getCandidates(30, 50);

      // assert
      expect(result).toEqual([]);
    });
  });

  describe('buildEmailPrompt', () => {
    it('should contain client name, company, and activity context', () => {
      const lead = {
        clientName: 'Тимофей Мишин',
        companyTitle: 'ООО Лесной Край',
        lastActivity: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
        inactiveDays: 45,
        statusName: 'Коммерческое предложение',
        comments: 'Требуется сложная этикетка с тиснением',
      };

      const prompt = service.buildEmailPrompt(lead as any);

      expect(prompt).toContain('Тимофей Мишин');
      expect(prompt).toContain('ООО Лесной Край');
      expect(prompt).toContain('45');
      expect(prompt).toContain('сложная этикетка');
    });
  });

  describe('sendToCandidate', () => {
    it('should generate email via Ollama and mark as sent', async () => {
      // arrange
      const candidate = {
        leadId: '27984',
        clientName: 'Тимофей Мишин',
        clientEmail: 'lesnoy@example.by',
        companyTitle: 'ООО Лесной Край',
        inactiveDays: 45,
        statusName: 'КП',
        comments: 'Требуется этикетка',
      };

      mockOllamaService.chat.mockResolvedValue(
        JSON.stringify({
          subject: 'Обновление прайса на этикетку',
          body: 'Здравствуйте, Тимофей! Мы обновили прайс...',
        }),
      );
      mockPrismaService.mailing.create.mockResolvedValue({ id: 1 });
      mockPrismaService.mailing.update.mockResolvedValue({
        status: 'sent',
        sentAt: new Date(),
      });

      // act
      const result = await service.sendToCandidate(candidate, 'email');

      // assert
      expect(result.status).toBe('sent');
      expect(mockOllamaService.chat).toHaveBeenCalled();
      expect(mockPrismaService.mailing.create).toHaveBeenCalled();
    });

    it('should fallback to template if Ollama fails', async () => {
      // arrange
      const candidate = {
        leadId: '27984',
        clientName: 'Тимофей Мишин',
        clientEmail: 'lesnoy@example.by',
        companyTitle: 'ООО Лесной Край',
        inactiveDays: 45,
        statusName: 'КП',
        comments: 'Требуется этикетка',
      };

      mockOllamaService.chat.mockRejectedValue(
        new OllamaUnavailableException('Ollama unavailable'),
      );
      mockPrismaService.mailing.create.mockResolvedValue({
        id: 1,
        status: 'sent',
        generatedBy: 'template',
      });

      // act
      const result = await service.sendToCandidate(candidate, 'email');

      // assert
      expect(result.status).toBe('sent');
      // Fallback template was used
      expect(mockPrismaService.mailing.create).toHaveBeenCalledTimes(1);
      const callArgs = mockPrismaService.mailing.create.mock.calls[0][0];
      expect(callArgs.data.generatedBy).toBe('template');
    });

    it('should mark as failed on email send error', async () => {
      // arrange
      const candidate = {
        leadId: '27984',
        clientName: 'Тимофей Мишин',
        clientEmail: 'lesnoy@example.by',
        companyTitle: 'ООО Лесной Край',
        inactiveDays: 45,
        statusName: 'КП',
        comments: 'Требуется этикетка',
      };

      mockOllamaService.chat.mockResolvedValue(
        JSON.stringify({
          subject: 'Тест',
          body: 'Тест',
        }),
      );
      // Prisma create fails during email send
      mockPrismaService.mailing.create.mockRejectedValueOnce(new Error('SMTP error'));

      // act
      const result = await service.sendToCandidate(candidate, 'email');

      // assert
      expect(result.status).toBe('failed');
    });
  });

  describe('getStats', () => {
    it('should return mailing statistics for last 30 days', async () => {
      // arrange
      mockPrismaService.mailing.findMany.mockResolvedValue([
        { status: 'sent', responseReceived: true, channel: 'email' },
        { status: 'sent', responseReceived: false, channel: 'email' },
        { status: 'failed', responseReceived: false, channel: 'telegram' },
      ]);

      // act
      const result = await service.getStats();

      // assert
      expect(result.total).toBe(3);
      expect(result.sent).toBe(2);
      expect(result.failed).toBe(1);
      expect(result.responseReceived).toBe(1);
      expect(result.responseRate).toBeCloseTo(50); // 1 out of 2 sent
    });

    it('should handle empty mailing list', async () => {
      // arrange
      mockPrismaService.mailing.findMany.mockResolvedValue([]);

      // act
      const result = await service.getStats();

      // assert
      expect(result.total).toBe(0);
      expect(result.responseRate).toBe(0);
    });
  });

  describe('sendToCandidate - SMTP integration', () => {
    const candidate = {
      leadId: '27984',
      clientName: 'Тимофей Мишин',
      clientEmail: 'timofey@example.by',
      companyTitle: 'ООО Лесной Край',
      inactiveDays: 45,
      statusName: 'Коммерческое предложение',
      comments: 'Интересовался термоусадочной этикеткой',
    };

    it('should create mailing record with sent status when email channel selected', async () => {
      // arrange
      mockOllamaService.chat.mockResolvedValue(
        JSON.stringify({
          subject: 'Персональное предложение',
          body: 'Здравствуйте! Мы подготовили для вас...',
        }),
      );
      mockPrismaService.mailing.create.mockResolvedValue({ id: 1, status: 'sent' });

      // act
      await service.sendToCandidate(candidate, 'email');

      // assert
      expect(mockPrismaService.mailing.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            leadBitrixId: '27984',
            clientEmail: 'timofey@example.by',
            channel: 'email',
            subject: 'Персональное предложение',
          }),
        }),
      );
    });

    it('should mark as failed when database write fails', async () => {
      // arrange
      mockOllamaService.chat.mockResolvedValue(
        JSON.stringify({
          subject: 'Test',
          body: 'Test body',
        }),
      );
      mockPrismaService.mailing.create.mockRejectedValue(new Error('DB error'));

      // act
      const result = await service.sendToCandidate(candidate, 'email');

      // assert
      expect(result.status).toBe('failed');
    });
  });
});
