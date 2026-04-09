import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import { RoutingService } from '../routing.service';
import { EmployeesService } from '../../employees/employees.service';
import { OllamaService, OllamaUnavailableException } from '../../ollama/ollama.service';
import { BitrixService } from '../../bitrix/bitrix.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { Channel } from '../dto/route-message.dto';
import { Topic, Urgency } from '../dto/routing-result.dto';
import { TransferReason } from '../dto/transfer-session.dto';

// Mock dependencies
const mockEmployeesService = {
  getAvailableEmployees: jest.fn(),
  getPersonalManager: jest.fn(),
  upsertAssignment: jest.fn(),
};

const mockOllamaService = {
  chat: jest.fn(),
};

const mockBitrixService = {
  transferSession: jest.fn(),
};

const mockPrismaService = {
  incomingEvent: {
    create: jest.fn(),
    findUnique: jest.fn(),
  },
  assignment: {
    create: jest.fn(),
  },
};

const mockConfigService = {
  get: jest.fn(),
};

describe('RoutingService', () => {
  let service: RoutingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoutingService,
        { provide: EmployeesService, useValue: mockEmployeesService },
        { provide: OllamaService, useValue: mockOllamaService },
        { provide: BitrixService, useValue: mockBitrixService },
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<RoutingService>(RoutingService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('buildPrompt', () => {
    it('should contain message text and available employees list', () => {
      const messageText = 'Нужен расчёт на этикетку';
      const employees = [
        { id: 13, name: 'Марина', kpiScore: 91.0, department: 'Сложная этикетка' },
        { id: 33, name: 'Александр', kpiScore: 78.5, department: 'Сложная этикетка' },
      ];

      const prompt = (service as any).buildPrompt(messageText, employees);

      expect(prompt).toContain(messageText);
      expect(prompt).toContain('Марина');
      expect(prompt).toContain('Александр');
      expect(prompt).toContain('91');
    });
  });

  describe('parseLlmResponse', () => {
    it('should parse valid JSON response', () => {
      const rawJson = JSON.stringify({
        manager_id: 13,
        topic: 'price_negotiation',
        urgency: 'medium',
        reason: 'Лучший KPI по ценовым переговорам',
      });

      const result = (service as any).parseLlmResponse(rawJson);

      expect(result.manager_id).toBe(13);
      expect(result.topic).toBe('price_negotiation');
      expect(result.urgency).toBe('medium');
      expect(result.reason).toBeDefined();
    });

    it('should throw BadRequestException on invalid JSON', () => {
      const invalidJson = 'not valid json';

      expect(() => (service as any).parseLlmResponse(invalidJson)).toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException on missing required fields', () => {
      const incompleteJson = JSON.stringify({
        manager_id: 13,
        // missing topic and urgency
      });

      expect(() => (service as any).parseLlmResponse(incompleteJson)).toThrow(
        BadRequestException,
      );
    });
  });

  describe('routeMessage', () => {
    const availableEmployees = [
      {
        id: 13,
        name: 'Марина',
        lastName: 'Бургацкая',
        kpiScore: 91.0,
        isAvailable: true,
        isPersonalManager: false,
        position: 'Ведущий специалист',
        department: 'Сложная этикетка',
      },
      {
        id: 33,
        name: 'Александр',
        lastName: 'Кипель',
        kpiScore: 78.5,
        isAvailable: true,
        isPersonalManager: false,
        position: 'Специалист',
        department: 'Сложная этикетка',
      },
    ];

    it('should prioritize personal manager if interactionCount >= 2', async () => {
      // arrange
      mockEmployeesService.getPersonalManager.mockResolvedValue({
        id: 33,
        name: 'Александр',
        lastName: 'Кипель',
        kpiScore: 78.5,
        isAvailable: true,
        isPersonalManager: true,
      });
      mockPrismaService.incomingEvent.create.mockResolvedValue({});

      // act
      const result = await service.routeMessage({
        messageText: 'Нужен расчёт',
        channel: Channel.TELEGRAM,
        clientPhone: '+375291234567',
      });

      // assert
      expect(result.managerId).toBe(33);
      expect(result.isPersonalManager).toBe(true);
      expect(mockOllamaService.chat).not.toHaveBeenCalled(); // LLM не вызывается
      expect(mockEmployeesService.upsertAssignment).toHaveBeenCalled();
    });

    it('should use LLM routing when no personal manager', async () => {
      // arrange
      mockEmployeesService.getPersonalManager.mockResolvedValue(null);
      mockEmployeesService.getAvailableEmployees.mockResolvedValue(
        availableEmployees,
      );
      mockOllamaService.chat.mockResolvedValue(
        JSON.stringify({
          manager_id: 13,
          topic: 'price_negotiation',
          urgency: 'medium',
          reason: 'Лучший KPI',
        }),
      );
      mockPrismaService.incomingEvent.create.mockResolvedValue({});

      // act
      const result = await service.routeMessage({
        messageText: 'Нужен расчёт на этикетку',
        channel: Channel.EMAIL,
        clientEmail: 'test@example.com',
      });

      // assert
      expect(result.managerId).toBe(13);
      expect(result.managerName).toBe('Марина');
      expect(result.topic).toBe(Topic.PRICE_NEGOTIATION);
      expect(result.urgency).toBe(Urgency.MEDIUM);
      expect(result.isPersonalManager).toBe(false);
      expect(mockOllamaService.chat).toHaveBeenCalled();
    });

    it('should fallback to first by KPI if LLM fails', async () => {
      // arrange
      mockEmployeesService.getPersonalManager.mockResolvedValue(null);
      mockEmployeesService.getAvailableEmployees.mockResolvedValue(
        availableEmployees,
      );
      mockOllamaService.chat.mockRejectedValue(
        new OllamaUnavailableException('Ollama unavailable'),
      );
      mockPrismaService.incomingEvent.create.mockResolvedValue({});

      // act
      const result = await service.routeMessage({
        messageText: 'Нужен расчёт',
        channel: Channel.TELEGRAM,
      });

      // assert
      expect(result.managerId).toBe(13); // Первый по KPI
      expect(result.managerName).toBe('Марина');
      expect(result.topic).toBe(Topic.OTHER);
      expect(result.urgency).toBe(Urgency.MEDIUM);
    });

    it('should return null when no managers available', async () => {
      // arrange
      mockEmployeesService.getPersonalManager.mockResolvedValue(null);
      mockEmployeesService.getAvailableEmployees.mockResolvedValue([]);
      mockOllamaService.chat.mockResolvedValue(
        'Все специалисты заняты, ответим до 10:00',
      );
      mockPrismaService.incomingEvent.create.mockResolvedValue({});

      // act
      const result = await service.routeMessage({
        messageText: 'Нужен расчёт',
        channel: Channel.TELEGRAM,
      });

      // assert
      expect(result.managerId).toBeNull();
      expect(result.autoReplyText).toBeDefined();
      expect(result.autoReplyText).not.toBe('');
      expect(mockOllamaService.chat).toHaveBeenCalled(); // Вызывается для генерации автоответа
    });

    it('should deduplicate events by eventId', async () => {
      // arrange
      mockPrismaService.incomingEvent.findUnique.mockResolvedValue({
        id: 1,
        eventId: 'event-123',
      });
      mockEmployeesService.getPersonalManager.mockResolvedValue(null);
      mockEmployeesService.getAvailableEmployees.mockResolvedValue([]);

      // act
      const result = await service.routeMessage({
        messageText: 'Нужен расчёт',
        channel: Channel.TELEGRAM,
        eventId: 'event-123',
      });

      // assert
      expect(result).toBeNull(); // Дедупликация — событие уже обработано
    });
  });

  describe('transferSession', () => {
    const availableEmployees = [
      {
        id: 13,
        name: 'Марина',
        lastName: 'Бургацкая',
        kpiScore: 91.0,
        isAvailable: true,
        isPersonalManager: false,
        position: 'Ведущий специалист',
        department: 'Сложная этикетка',
      },
      {
        id: 33,
        name: 'Александр',
        lastName: 'Кипель',
        kpiScore: 78.5,
        isAvailable: true,
        isPersonalManager: false,
        position: 'Специалист',
        department: 'Сложная этикетка',
      },
    ];

    it('should transfer session to manager with highest KPI', async () => {
      // arrange
      mockEmployeesService.getAvailableEmployees.mockResolvedValue(
        availableEmployees,
      );
      mockBitrixService.transferSession.mockResolvedValue({ success: true });
      mockPrismaService.assignment.create.mockResolvedValue({});

      // act
      const result = await service.transferSession({
        sessionId: 'session_12345',
        currentManagerId: 1, // Текущий менеджер не в списке доступных
        reason: TransferReason.UNAVAILABLE,
      });

      // assert
      expect(result.transferred).toBe(true);
      expect(result.newManagerId).toBe(13); // Марина — наивысший KPI
      expect(result.newManagerName).toBe('Марина Бургацкая');
      expect(result.sessionId).toBe('session_12345');
      expect(mockBitrixService.transferSession).toHaveBeenCalledWith(
        'session_12345',
        13,
      );
      expect(mockPrismaService.assignment.create).toHaveBeenCalled();
    });

    it('should exclude current manager from candidates', async () => {
      // arrange
      mockEmployeesService.getAvailableEmployees.mockResolvedValue(
        availableEmployees,
      );
      mockBitrixService.transferSession.mockResolvedValue({ success: true });
      mockPrismaService.assignment.create.mockResolvedValue({});

      // act
      const result = await service.transferSession({
        sessionId: 'session_67890',
        currentManagerId: 13, // Марина — текущий менеджер
        reason: TransferReason.END_OF_DAY,
      });

      // assert
      expect(result.transferred).toBe(true);
      expect(result.newManagerId).toBe(33); // Александр — следующий по KPI
      expect(result.newManagerName).toBe('Александр Кипель');
      expect(mockBitrixService.transferSession).toHaveBeenCalledWith(
        'session_67890',
        33,
      );
    });

    it('should return transferred: false if no available managers', async () => {
      // arrange
      mockEmployeesService.getAvailableEmployees.mockResolvedValue([]);

      // act
      const result = await service.transferSession({
        sessionId: 'session_no_managers',
        currentManagerId: 1,
        reason: TransferReason.UNAVAILABLE,
      });

      // assert
      expect(result.transferred).toBe(false);
      expect(result.newManagerId).toBe(1); // Остаётся у текущего
      expect(result.newManagerName).toBe('No available managers');
      expect(mockBitrixService.transferSession).not.toHaveBeenCalled();
    });

    it('should return transferred: false if Bitrix API fails', async () => {
      // arrange
      mockEmployeesService.getAvailableEmployees.mockResolvedValue(
        availableEmployees,
      );
      mockBitrixService.transferSession.mockRejectedValue(
        new Error('Bitrix API error'),
      );

      // act
      const result = await service.transferSession({
        sessionId: 'session_bitrix_fail',
        currentManagerId: 1,
        reason: TransferReason.UNAVAILABLE,
      });

      // assert
      expect(result.transferred).toBe(false);
      expect(result.newManagerId).toBe(13); // Выбран менеджер
      expect(result.newManagerName).toBe('Марина Бургацкая');
      expect(mockPrismaService.assignment.create).not.toHaveBeenCalled(); // Не записано т.к. не передано
    });

    it('should create assignment record on successful transfer', async () => {
      // arrange
      mockEmployeesService.getAvailableEmployees.mockResolvedValue(
        availableEmployees,
      );
      mockBitrixService.transferSession.mockResolvedValue({ success: true });
      mockPrismaService.assignment.create.mockResolvedValue({});

      // act
      await service.transferSession({
        sessionId: 'session_assignment_test',
        currentManagerId: 1,
        reason: TransferReason.UNAVAILABLE,
      });

      // assert
      expect(mockPrismaService.assignment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          employeeId: 13,
          interactionCount: 1,
        }),
      });
    });
  });
});