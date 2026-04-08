import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import { RoutingService } from '../routing.service';
import { EmployeesService } from '../../employees/employees.service';
import { OllamaService, OllamaUnavailableException } from '../../ollama/ollama.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { Channel } from '../dto/route-message.dto';
import { Topic, Urgency } from '../dto/routing-result.dto';

// Mock dependencies
const mockEmployeesService = {
  getAvailableEmployees: jest.fn(),
  getPersonalManager: jest.fn(),
  upsertAssignment: jest.fn(),
};

const mockOllamaService = {
  chat: jest.fn(),
};

const mockPrismaService = {
  incomingEvent: {
    create: jest.fn(),
    findUnique: jest.fn(),
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
});