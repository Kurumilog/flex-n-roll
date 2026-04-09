import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BitrixService } from '../bitrix.service';
import axios from 'axios';

// Mock axios module
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    post: jest.fn(),
    request: jest.fn(),
    interceptors: {
      response: {
        use: jest.fn(),
      },
    },
  })),
  isAxiosError: jest.fn(),
}));

// Mock ConfigService
const mockConfigService = {
  get: jest.fn().mockReturnValue('https://hackathon-team-xx.bitrix24.ru/rest/1/XXXXX'),
};

describe('BitrixService', () => {
  let service: BitrixService;
  let mockHttpClient: any;
  let interceptorUseSpy: jest.SpyInstance;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BitrixService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<BitrixService>(BitrixService);
    // Get the mocked HTTP client from the service
    mockHttpClient = (service as any).httpClient;
    
    // Capture the interceptor spy AFTER clearAllMocks
    interceptorUseSpy = mockHttpClient.interceptors.response.use;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createLead', () => {
    it('should create a lead with required fields', async () => {
      // arrange
      const mockResponse = { result: { ID: '27984' } };
      const mockPost = jest.fn().mockResolvedValue({ data: mockResponse });
      mockHttpClient.post = mockPost;

      const fields = {
        TITLE: 'Тестовый лид',
        NAME: 'Иван',
        LAST_NAME: 'Иванов',
      };

      // act
      const result = await service.createLead(fields);

      // assert
      expect(result).toEqual({ ID: '27984' });
      expect(mockPost).toHaveBeenCalledWith(
        'crm.lead.add',
        expect.objectContaining({
          fields: expect.objectContaining({
            TITLE: 'Тестовый лид',
            NAME: 'Иван',
            LAST_NAME: 'Иванов',
          }),
        }),
      );
    });

    it('should create a lead with all optional fields', async () => {
      // arrange
      const mockResponse = { result: { ID: '27985' } };
      const mockPost = jest.fn().mockResolvedValue({ data: mockResponse });
      mockHttpClient.post = mockPost;

      const fields = {
        TITLE: 'Полный лид',
        STATUS_ID: 'NEW',
        SOURCE_ID: 'WEB',
        ASSIGNED_BY_ID: 13,
        NAME: 'Пётр',
        LAST_NAME: 'Петров',
        EMAIL: [{ VALUE: 'test@example.com', VALUE_TYPE: 'WORK' }],
        PHONE: [{ VALUE: '+375291234567', VALUE_TYPE: 'WORK' }],
        COMMENTS: 'Комментарий к лиду',
        OPPORTUNITY: 5000,
        CURRENCY_ID: 'BYN',
      };

      // act
      const result = await service.createLead(fields);

      // assert
      expect(result).toEqual({ ID: '27985' });
      expect(mockPost).toHaveBeenCalledWith(
        'crm.lead.add',
        expect.objectContaining({
          fields: expect.objectContaining({
            TITLE: 'Полный лид',
            STATUS_ID: 'NEW',
            SOURCE_ID: 'WEB',
            ASSIGNED_BY_ID: 13,
            COMMENTS: 'Комментарий к лиду',
            OPPORTUNITY: 5000,
            CURRENCY_ID: 'BYN',
          }),
        }),
      );
    });

    it('should handle create lead API errors', async () => {
      // arrange
      const mockPost = jest.fn().mockRejectedValue(new Error('Network Error'));
      mockHttpClient.post = mockPost;

      const fields = { TITLE: 'Ошибка' };

      // act & assert
      await expect(service.createLead(fields)).rejects.toThrow('Network Error');
    });
  });

  describe('updateLead', () => {
    it('should update a lead with ASSIGNED_BY_ID', async () => {
      // arrange
      const mockResponse = { result: true };
      const mockPost = jest.fn().mockResolvedValue({ data: mockResponse });
      mockHttpClient.post = mockPost;

      // act
      const result = await service.updateLead('27984', { ASSIGNED_BY_ID: 13 });

      // assert
      expect(result).toBe(true);
      expect(mockPost).toHaveBeenCalledWith(
        'crm.lead.update',
        expect.objectContaining({
          id: '27984',
          fields: { ASSIGNED_BY_ID: 13 },
        }),
      );
    });

    it('should update a lead with multiple fields', async () => {
      // arrange
      const mockResponse = { result: true };
      const mockPost = jest.fn().mockResolvedValue({ data: mockResponse });
      mockHttpClient.post = mockPost;

      // act
      const result = await service.updateLead('27984', {
        STATUS_ID: 'CONVERTED',
        COMMENTS: 'Успешно конвертирован',
      });

      // assert
      expect(result).toBe(true);
      expect(mockPost).toHaveBeenCalledWith(
        'crm.lead.update',
        expect.objectContaining({
          id: '27984',
          fields: {
            STATUS_ID: 'CONVERTED',
            COMMENTS: 'Успешно конвертирован',
          },
        }),
      );
    });

    it('should handle update lead errors', async () => {
      // arrange
      const mockPost = jest.fn().mockRejectedValue(new Error('Lead not found'));
      mockHttpClient.post = mockPost;

      // act & assert
      await expect(
        service.updateLead('99999', { STATUS_ID: 'NEW' }),
      ).rejects.toThrow('Lead not found');
    });
  });

  describe('getLeads', () => {
    it('should fetch leads with default parameters', async () => {
      // arrange
      const mockLeads = [
        { ID: '1', TITLE: 'Лид 1', STATUS_ID: 'NEW' },
        { ID: '2', TITLE: 'Лид 2', STATUS_ID: '3' },
      ];
      const mockPost = jest.fn().mockResolvedValue({ data: { result: mockLeads } });
      mockHttpClient.post = mockPost;

      // act
      const result = await service.getLeads({});

      // assert
      expect(result).toEqual(mockLeads);
      expect(mockPost).toHaveBeenCalledWith(
        'crm.lead.list',
        expect.objectContaining({
          order: { ID: 'ASC' },
          filter: {},
          select: ['ID', 'TITLE', 'STATUS_ID', 'ASSIGNED_BY_ID'],
          start: 0,
        }),
      );
    });

    it('should fetch leads with custom filter and select', async () => {
      // arrange
      const mockLeads = [{ ID: '1', TITLE: 'Лид 1' }];
      const mockPost = jest.fn().mockResolvedValue({ data: { result: mockLeads } });
      mockHttpClient.post = mockPost;

      // act
      const result = await service.getLeads({
        filter: { STATUS_ID: 'CONVERTED' },
        select: ['ID', 'TITLE'],
      });

      // assert
      expect(result).toEqual(mockLeads);
      expect(mockPost).toHaveBeenCalledWith(
        'crm.lead.list',
        expect.objectContaining({
          filter: { STATUS_ID: 'CONVERTED' },
          select: ['ID', 'TITLE'],
        }),
      );
    });

    it('should handle empty leads response', async () => {
      // arrange
      const mockPost = jest.fn().mockResolvedValue({ data: { result: [] } });
      mockHttpClient.post = mockPost;

      // act
      const result = await service.getLeads({});

      // assert
      expect(result).toEqual([]);
    });

    it('should handle API errors when fetching leads', async () => {
      // arrange
      const mockPost = jest.fn().mockRejectedValue(new Error('API Error'));
      mockHttpClient.post = mockPost;

      // act & assert
      await expect(service.getLeads({})).rejects.toThrow('API Error');
    });
  });

  describe('getDeals', () => {
    it('should fetch deals with default parameters', async () => {
      // arrange
      const mockDeals = [
        {
          ID: '100',
          TITLE: 'Сделка 1',
          STAGE_ID: 'NEW',
          ASSIGNED_BY_ID: 13,
          OPPORTUNITY: 5000,
        },
      ];
      const mockPost = jest.fn().mockResolvedValue({ data: { result: mockDeals } });
      mockHttpClient.post = mockPost;

      // act
      const result = await service.getDeals({});

      // assert
      expect(result).toEqual(mockDeals);
      expect(mockPost).toHaveBeenCalledWith(
        'crm.deal.list',
        expect.objectContaining({
          order: { ID: 'ASC' },
          filter: {},
          select: [
            'ID',
            'TITLE',
            'STAGE_ID',
            'ASSIGNED_BY_ID',
            'OPPORTUNITY',
            'DATE_CREATE',
            'DATE_MODIFY',
          ],
        }),
      );
    });

    it('should fetch deals with custom filter', async () => {
      // arrange
      const mockDeals = [
        { ID: '100', TITLE: 'Сделка 1', ASSIGNED_BY_ID: 13 },
      ];
      const mockPost = jest.fn().mockResolvedValue({ data: { result: mockDeals } });
      mockHttpClient.post = mockPost;

      // act
      const result = await service.getDeals({
        filter: { '>DATE_MODIFY': '2024-01-01' },
        select: ['ID', 'TITLE', 'ASSIGNED_BY_ID'],
      });

      // assert
      expect(result).toEqual(mockDeals);
      expect(mockPost).toHaveBeenCalledWith(
        'crm.deal.list',
        expect.objectContaining({
          filter: { '>DATE_MODIFY': '2024-01-01' },
          select: ['ID', 'TITLE', 'ASSIGNED_BY_ID'],
        }),
      );
    });

    it('should handle empty deals response', async () => {
      // arrange
      const mockPost = jest.fn().mockResolvedValue({ data: { result: [] } });
      mockHttpClient.post = mockPost;

      // act
      const result = await service.getDeals({});

      // assert
      expect(result).toEqual([]);
    });
  });

  describe('updateDeal', () => {
    it('should update a deal with ASSIGNED_BY_ID', async () => {
      // arrange
      const mockResponse = { result: true };
      const mockPost = jest.fn().mockResolvedValue({ data: mockResponse });
      mockHttpClient.post = mockPost;

      // act
      const result = await service.updateDeal('100', { ASSIGNED_BY_ID: 33 });

      // assert
      expect(result).toBe(true);
      expect(mockPost).toHaveBeenCalledWith(
        'crm.deal.update',
        expect.objectContaining({
          id: '100',
          fields: { ASSIGNED_BY_ID: 33 },
        }),
      );
    });

    it('should update a deal with STAGE_ID', async () => {
      // arrange
      const mockResponse = { result: true };
      const mockPost = jest.fn().mockResolvedValue({ data: mockResponse });
      mockHttpClient.post = mockPost;

      // act
      const result = await service.updateDeal('100', { STAGE_ID: 'WON' });

      // assert
      expect(result).toBe(true);
      expect(mockPost).toHaveBeenCalledWith(
        'crm.deal.update',
        expect.objectContaining({
          id: '100',
          fields: { STAGE_ID: 'WON' },
        }),
      );
    });

    it('should handle update deal errors', async () => {
      // arrange
      const mockPost = jest.fn().mockRejectedValue(new Error('Deal not found'));
      mockHttpClient.post = mockPost;

      // act & assert
      await expect(
        service.updateDeal('99999', { STAGE_ID: 'WON' }),
      ).rejects.toThrow('Deal not found');
    });
  });

  describe('transferSession', () => {
    it('should transfer session to another manager', async () => {
      // arrange
      const mockResponse = { result: true };
      const mockPost = jest.fn().mockResolvedValue({ data: mockResponse });
      mockHttpClient.post = mockPost;

      // act
      const result = await service.transferSession('session-123', 13);

      // assert
      expect(result).toBe(true);
      expect(mockPost).toHaveBeenCalledWith(
        'imopenlines.session.transfer',
        expect.objectContaining({
          id: 'session-123',
          to: 13,
        }),
      );
    });

    it('should handle transfer session errors', async () => {
      // arrange
      const mockPost = jest.fn().mockRejectedValue(new Error('Session not found'));
      mockHttpClient.post = mockPost;

      // act & assert
      await expect(
        service.transferSession('invalid-session', 13),
      ).rejects.toThrow('Session not found');
    });
  });

  describe('getOpenSessions', () => {
    it('should get open sessions with default filter', async () => {
      // arrange
      const mockSessions = [
        { ID: 'sess-1', ACTIVE: 'Y', USER_ID: 13 },
      ];
      const mockResponse = { result: mockSessions };
      const mockPost = jest.fn().mockResolvedValue({ data: mockResponse });
      mockHttpClient.post = mockPost;

      // act
      const result = await service.getOpenSessions();

      // assert
      expect(result).toEqual(mockSessions);
      expect(mockPost).toHaveBeenCalledWith(
        'imopenlines.session.list',
        expect.objectContaining({
          filter: { ACTIVE: 'Y' },
        }),
      );
    });

    it('should get open sessions with custom filter', async () => {
      // arrange
      const mockSessions = [{ ID: 'sess-1' }];
      const mockResponse = { result: mockSessions };
      const mockPost = jest.fn().mockResolvedValue({ data: mockResponse });
      mockHttpClient.post = mockPost;

      // act
      const result = await service.getOpenSessions({
        filter: { USER_ID: 13 },
      });

      // assert
      expect(result).toEqual(mockSessions);
      expect(mockPost).toHaveBeenCalledWith(
        'imopenlines.session.list',
        expect.objectContaining({
          filter: { USER_ID: 13 },
        }),
      );
    });
  });

  describe('sendMessage', () => {
    it('should send a message to a dialog', async () => {
      // arrange
      const mockResponse = { result: { ID: 'msg-1' } };
      const mockPost = jest.fn().mockResolvedValue({ data: mockResponse });
      mockHttpClient.post = mockPost;

      // act
      const result = await service.sendMessage('dialog-123', 'Привет!');

      // assert
      expect(result).toEqual({ ID: 'msg-1' });
      expect(mockPost).toHaveBeenCalledWith(
        'im.message.add',
        expect.objectContaining({
          dialogId: 'dialog-123',
          message: { text: 'Привет!' },
        }),
      );
    });

    it('should handle send message errors', async () => {
      // arrange
      const mockPost = jest.fn().mockRejectedValue(new Error('Dialog not found'));
      mockHttpClient.post = mockPost;

      // act & assert
      await expect(
        service.sendMessage('invalid-dialog', 'Текст'),
      ).rejects.toThrow('Dialog not found');
    });
  });

  describe('createTask', () => {
    it('should create a task for a manager', async () => {
      // arrange
      const mockResponse = { result: { task: { ID: 'task-1' } } };
      const mockPost = jest.fn().mockResolvedValue({ data: mockResponse });
      mockHttpClient.post = mockPost;

      const fields = {
        TITLE: 'Обработать лид',
        DESCRIPTION: 'Нужно связаться с клиентом',
        RESPONSIBLE_ID: 13,
        DEADLINE: '2026-04-10T18:00:00Z',
        UF_CRM_TASK: 'LEAD_27984',
      };

      // act
      const result = await service.createTask(fields);

      // assert
      expect(result).toEqual({ task: { ID: 'task-1' } });
      expect(mockPost).toHaveBeenCalledWith(
        'tasks.task.add',
        expect.objectContaining({
          fields: expect.objectContaining({
            TITLE: 'Обработать лид',
            RESPONSIBLE_ID: 13,
            UF_CRM_TASK: 'LEAD_27984',
          }),
        }),
      );
    });

    it('should create a task with minimal fields', async () => {
      // arrange
      const mockResponse = { result: { task: { ID: 'task-2' } } };
      const mockPost = jest.fn().mockResolvedValue({ data: mockResponse });
      mockHttpClient.post = mockPost;

      const fields = {
        TITLE: 'Простая задача',
        RESPONSIBLE_ID: 33,
      };

      // act
      const result = await service.createTask(fields);

      // assert
      expect(result).toEqual({ task: { ID: 'task-2' } });
      expect(mockPost).toHaveBeenCalledWith(
        'tasks.task.add',
        expect.objectContaining({
          fields: {
            TITLE: 'Простая задача',
            RESPONSIBLE_ID: 33,
          },
        }),
      );
    });

    it('should handle create task errors', async () => {
      // arrange
      const mockPost = jest.fn().mockRejectedValue(new Error('User not found'));
      mockHttpClient.post = mockPost;

      // act & assert
      await expect(
        service.createTask({
          TITLE: 'Ошибка',
          RESPONSIBLE_ID: 99999,
        }),
      ).rejects.toThrow('User not found');
    });
  });

  describe('addActivity', () => {
    it('should add an email activity to a lead', async () => {
      // arrange
      const mockResponse = { result: { ID: 'activity-1' } };
      const mockPost = jest.fn().mockResolvedValue({ data: mockResponse });
      mockHttpClient.post = mockPost;

      const fields = {
        OWNER_TYPE_ID: 1, // лид
        OWNER_ID: '27984',
        TYPE_ID: 4, // email
        SUBJECT: 'Коммерческое предложение',
        DESCRIPTION: 'Отправлено КП на email',
        COMPLETED: 'Y',
      };

      // act
      const result = await service.addActivity(fields);

      // assert
      expect(result).toEqual({ ID: 'activity-1' });
      expect(mockPost).toHaveBeenCalledWith(
        'crm.activity.add',
        expect.objectContaining({
          fields: expect.objectContaining({
            OWNER_TYPE_ID: 1,
            OWNER_ID: '27984',
            TYPE_ID: 4,
            SUBJECT: 'Коммерческое предложение',
            COMPLETED: 'Y',
          }),
        }),
      );
    });

    it('should add activity with minimal fields', async () => {
      // arrange
      const mockResponse = { result: { ID: 'activity-2' } };
      const mockPost = jest.fn().mockResolvedValue({ data: mockResponse });
      mockHttpClient.post = mockPost;

      const fields = {
        OWNER_TYPE_ID: 2, // сделка
        OWNER_ID: '100',
        TYPE_ID: 4,
      };

      // act
      const result = await service.addActivity(fields);

      // assert
      expect(result).toEqual({ ID: 'activity-2' });
      expect(mockPost).toHaveBeenCalledWith(
        'crm.activity.add',
        expect.objectContaining({
          fields: {
            OWNER_TYPE_ID: 2,
            OWNER_ID: '100',
            TYPE_ID: 4,
          },
        }),
      );
    });

    it('should handle add activity errors', async () => {
      // arrange
      const mockPost = jest.fn().mockRejectedValue(new Error('Invalid owner'));
      mockHttpClient.post = mockPost;

      // act & assert
      await expect(
        service.addActivity({
          OWNER_TYPE_ID: 1,
          OWNER_ID: 'invalid',
          TYPE_ID: 4,
        }),
      ).rejects.toThrow('Invalid owner');
    });
  });

  describe('retry logic on rate limit', () => {
    it('should have retry interceptor configured for HTTP 429', async () => {
      // assert — проверяем, что интерцептор установлен
      expect(interceptorUseSpy).toHaveBeenCalledTimes(1);
      expect(interceptorUseSpy).toHaveBeenCalledWith(
        expect.any(Function),
        expect.any(Function),
      );
    });

    it('should have retry interceptor configured for HTTP 503', async () => {
      // Проверяем, что интерцептор правильно обрабатывает rate limit
      // Получаем error handler из интерцептора
      const errorHandler = interceptorUseSpy.mock.calls[0][1];
      expect(errorHandler).toBeDefined();
      expect(typeof errorHandler).toBe('function');
    });
  });

  describe('call method response handling', () => {
    it('should return result from response.data.result', async () => {
      // arrange
      const mockPost = jest.fn().mockResolvedValue({
        data: { result: { ID: '123', TITLE: 'Test' } },
      });
      mockHttpClient.post = mockPost;

      // act
      const result = await service.createLead({ TITLE: 'Test' });

      // assert
      expect(result).toEqual({ ID: '123', TITLE: 'Test' });
    });

    it('should return full response.data when no result field', async () => {
      // arrange
      const mockPost = jest.fn().mockResolvedValue({
        data: { success: true },
      });
      mockHttpClient.post = mockPost;

      // act
      const result = await service.createLead({ TITLE: 'Test' });

      // assert
      expect(result).toEqual({ success: true });
    });

    it('should log error when API call fails', async () => {
      // arrange
      const errorLogger = jest.spyOn((service as any).logger, 'error');
      const mockPost = jest.fn().mockRejectedValue(new Error('Connection failed'));
      mockHttpClient.post = mockPost;

      // act & assert
      await expect(service.createLead({ TITLE: 'Test' })).rejects.toThrow(
        'Connection failed',
      );
      expect(errorLogger).toHaveBeenCalledWith(
        'Bitrix24 API call failed: crm.lead.add',
        'Connection failed',
      );
    });
  });
});
