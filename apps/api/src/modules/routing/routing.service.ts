import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmployeesService } from '../employees/employees.service';
import { OllamaService, OllamaUnavailableException } from '../ollama/ollama.service';
import { BitrixService } from '../bitrix/bitrix.service';
import { PrismaService } from '../../prisma/prisma.service';
import { RouteMessageDto } from './dto/route-message.dto';
import { RoutingResultDto, Topic, Urgency } from './dto/routing-result.dto';
import { TransferSessionDto, TransferResultDto } from './dto/transfer-session.dto';

interface ParsedLlmResponse {
  manager_id: number;
  topic: string;
  urgency: string;
  reason: string;
}

@Injectable()
export class RoutingService {
  private readonly logger = new Logger(RoutingService.name);

  constructor(
    private readonly employeesService: EmployeesService,
    private readonly ollamaService: OllamaService,
    private readonly bitrixService: BitrixService,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Главный метод маршрутизации
   */
  async routeMessage(dto: RouteMessageDto): Promise<RoutingResultDto | null> {
    // Дедупликация по eventId
    if (dto.eventId) {
      const existing = await this.prisma.incomingEvent.findUnique({
        where: { eventId: dto.eventId },
      });
      if (existing) {
        this.logger.warn(`Duplicate event: ${dto.eventId}`);
        return null;
      }
    }

    // Приоритет 1: Личный менеджер
    const personalManager = await this.employeesService.getPersonalManager(
      dto.clientPhone,
      dto.clientEmail,
    );

    if (personalManager && personalManager.isAvailable) {
      this.logger.log(
        `Personal manager found: ${personalManager.name} (${personalManager.id})`,
      );

      await this.employeesService.upsertAssignment({
        clientPhone: dto.clientPhone,
        clientEmail: dto.clientEmail,
        clientBitrixId: dto.clientBitrixId,
        employeeId: personalManager.id,
      });

      await this.logIncomingEvent(
        dto,
        {
          manager_id: personalManager.id,
          topic: Topic.OTHER,
          urgency: Urgency.MEDIUM,
          reason: 'Personal manager',
        },
        true,
      );

      return {
        managerId: personalManager.id,
        managerName: personalManager.name,
        topic: Topic.OTHER,
        urgency: Urgency.MEDIUM,
        reason: `Личный менеджер (interaction count >= 2)`,
        isPersonalManager: true,
        autoReplyText: null,
      };
    }

    // Приоритет 2: LLM-маршрутизация
    const availableEmployees =
      await this.employeesService.getAvailableEmployees();

    if (availableEmployees.length === 0) {
      this.logger.warn('No available managers — generating auto-reply');
      return this.handleNoAvailableManagers(dto.messageText);
    }

    try {
      const prompt = this.buildPrompt(
        dto.messageText,
        availableEmployees.map((e) => ({
          id: e.id,
          name: `${e.name} ${e.lastName}`,
          kpiScore: e.kpiScore,
          department: e.department,
          position: e.position,
        })),
      );

      const rawResponse = await this.ollamaService.chat(prompt, this.getSystemPrompt());
      const parsed = this.parseLlmResponse(rawResponse);

      // Найти сотрудника по ID из ответа LLM
      const selectedEmployee = availableEmployees.find(
        (e) => e.id === parsed.manager_id,
      );

      if (!selectedEmployee) {
        throw new Error(
          `LLM вернул несуществующий manager_id: ${parsed.manager_id}`,
        );
      }

      this.logger.log(
        `LLM selected manager: ${selectedEmployee.name} (${selectedEmployee.id})`,
      );

      await this.employeesService.upsertAssignment({
        clientPhone: dto.clientPhone,
        clientEmail: dto.clientEmail,
        clientBitrixId: dto.clientBitrixId,
        employeeId: selectedEmployee.id,
      });

      await this.logIncomingEvent(dto, parsed, false);

      return {
        managerId: selectedEmployee.id,
        managerName: selectedEmployee.name,
        topic: parsed.topic as Topic,
        urgency: parsed.urgency as Urgency,
        reason: parsed.reason,
        isPersonalManager: false,
        autoReplyText: null,
      };
    } catch (error) {
      // Приоритет 3: Fallback — первый по KPI
      this.logger.warn(
        `LLM routing failed, falling back to first by KPI: ${error instanceof Error ? error.message : error}`,
      );

      const firstByKpi = availableEmployees[0];

      await this.employeesService.upsertAssignment({
        clientPhone: dto.clientPhone,
        clientEmail: dto.clientEmail,
        clientBitrixId: dto.clientBitrixId,
        employeeId: firstByKpi.id,
      });

      await this.logIncomingEvent(
        dto,
        {
          manager_id: firstByKpi.id,
          topic: Topic.OTHER,
          urgency: Urgency.MEDIUM,
          reason: 'Fallback by KPI (LLM failed)',
        },
        false,
      );

      return {
        managerId: firstByKpi.id,
        managerName: firstByKpi.name,
        topic: Topic.OTHER,
        urgency: Urgency.MEDIUM,
        reason: 'Fallback: LLM недоступ, выбран по KPI',
        isPersonalManager: false,
        autoReplyText: null,
      };
    }
  }

  /**
   * Построить промпт для LLM
   */
  private buildPrompt(
    messageText: string,
    availableEmployees: Array<{
      id: number;
      name: string;
      kpiScore: number;
      department: string | null;
      position: string | null;
    }>,
  ): string {
    const employeesJson = JSON.stringify(availableEmployees, null, 2);

    return `Сообщение клиента: "${messageText}"

Доступные менеджеры:
${employeesJson}

Верни ТОЛЬКО валидный JSON без markdown и объяснений:
{
  "manager_id": <number>,
  "topic": "<price_negotiation|technical_specs|delivery|complaint|new_client|urgent_reorder|other>",
  "urgency": "<low|medium|high>",
  "reason": "<1-2 предложения почему выбран этот менеджер>"
}`;
  }

  /**
   * Системный промпт для LLM
   */
  private getSystemPrompt(): string {
    return `Ты — система автоматической маршрутизации входящих обращений компании Flex-N-Roll PRO.
Компания производит самоклеящуюся, термоусадочную и сложную этикетку.
Сотрудники делятся на специализации:
- "Сложная этикетка": тиснение, фольга, многослойные этикетки
- "Термоусадочная этикетка": шринк-рукава, ПВХ/ПЕТГ плёнка
- "Чистая этикетка": стандартные самоклеящиеся, массовый сегмент
- "Администрация": директора, технологи, диспетчеры

Классифицируй запрос клиента и выбери оптимального менеджера.
Ответь ТОЛЬКО валидным JSON, без markdown, без объяснений.

ПРАВИЛА urgency:
- high: слово "срочно", "горит", "завтра", жалоба, рекламация
- medium: конкретный запрос с параметрами, повторный клиент
- low: общий вопрос, знакомство, "хотели бы узнать"`;
  }

  /**
   * Распарсить JSON-ответ от LLM
   */
  parseLlmResponse(rawJson: string): ParsedLlmResponse {
    try {
      const parsed = JSON.parse(rawJson) as ParsedLlmResponse;

      // Валидация обязательных полей
      if (
        typeof parsed.manager_id !== 'number' ||
        !parsed.topic ||
        !parsed.urgency ||
        !parsed.reason
      ) {
        throw new BadRequestException(
          `Invalid LLM response structure: missing required fields`,
        );
      }

      return parsed;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to parse LLM response as JSON: ${error instanceof Error ? error.message : 'unknown'}`,
      );
    }
  }

  /**
   * Обработка случая когда нет доступных менеджеров
   */
  private async handleNoAvailableManagers(
    messageText: string,
  ): Promise<RoutingResultDto> {
    try {
      const autoReplyPrompt = `SYSTEM: Ты — вежливый ассистент компании Flex-N-Roll PRO.
Напиши краткое (2-3 предложения) сообщение клиенту о том, что все специалисты заняты.
Укажи примерное время ответа (следующий рабочий день до 10:00).
Тон: профессиональный, дружелюбный. Язык: русский.
Не упоминай что ты ИИ.

USER: Клиент написал: "${messageText}"`;

      const autoReplyText = await this.ollamaService.chat(autoReplyPrompt);

      return {
        managerId: null,
        managerName: null,
        topic: Topic.OTHER,
        urgency: Urgency.LOW,
        reason: 'Нет доступных менеджеров',
        isPersonalManager: false,
        autoReplyText,
      };
    } catch (error) {
      // Fallback на шаблонный автоответ
      return {
        managerId: null,
        managerName: null,
        topic: Topic.OTHER,
        urgency: Urgency.LOW,
        reason: 'Нет доступных менеджеров (шаблон)',
        isPersonalManager: false,
        autoReplyText:
          'Здравствуйте! В данный момент все специалисты заняты. Ваш вопрос зафиксирован. Первый освободившийся менеджер свяжется с вами в следующий рабочий день до 10:00. Спасибо за обращение!',
      };
    }
  }

  /**
   * Логирование входящего события
   */
  private async logIncomingEvent(
    dto: RouteMessageDto,
    parsed: {
      manager_id: number;
      topic: string;
      urgency: string;
      reason: string;
    },
    isPersonalManager: boolean,
  ): Promise<void> {
    await this.prisma.incomingEvent.create({
      data: {
        eventId: dto.eventId ?? `auto-${Date.now()}`,
        eventType: 'ONOPENLINEMESSAGEADD',
        channel: dto.channel,
        clientText: dto.messageText,
        clientPhone: dto.clientPhone,
        clientEmail: dto.clientEmail,
        assignedTo: parsed.manager_id,
        routingReason: parsed.reason,
        topic: parsed.topic,
        urgency: parsed.urgency,
      },
    });
  }

  /**
   * Передача диалога другому менеджеру
   * Вызывается когда текущий менеджер недоступен или рабочий день окончен
   */
  async transferSession(dto: TransferSessionDto): Promise<TransferResultDto> {
    this.logger.log(
      `Transferring session ${dto.sessionId} from manager ${dto.currentManagerId} (reason: ${dto.reason})`,
    );

    // 1. Найти доступных менеджеров (исключая текущего)
    const availableEmployees =
      await this.employeesService.getAvailableEmployees();

    const candidates = availableEmployees.filter(
      (e) => e.id !== dto.currentManagerId,
    );

    if (candidates.length === 0) {
      this.logger.warn(
        'No available managers to transfer to — session stays with current manager',
      );
      return {
        newManagerId: dto.currentManagerId,
        newManagerName: 'No available managers',
        sessionId: dto.sessionId,
        reason: dto.reason,
        transferred: false,
      };
    }

    // 2. Выбрать менеджера с наивысшим KPI
    const newManager = candidates[0]; // Уже отсортированы по KPI DESC

    this.logger.log(
      `Transferring to: ${newManager.name} ${newManager.lastName} (ID: ${newManager.id}, KPI: ${newManager.kpiScore})`,
    );

    // 3. Передать сессию через Bitrix24 API
    try {
      await this.bitrixService.transferSession(dto.sessionId, newManager.id);
      this.logger.log(
        `Session ${dto.sessionId} transferred to manager ${newManager.id}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to transfer session ${dto.sessionId}: ${error instanceof Error ? error.message : error}`,
      );
      // Не бросаем исключение — возвращаем результат с transferred: false
      return {
        newManagerId: newManager.id,
        newManagerName: `${newManager.name} ${newManager.lastName}`,
        sessionId: dto.sessionId,
        reason: dto.reason,
        transferred: false,
      };
    }

    // 4. Записать в историю назначений
    await this.prisma.assignment.create({
      data: {
        employeeId: newManager.id,
        interactionCount: 1,
        lastInteraction: new Date(),
      },
    });

    return {
      newManagerId: newManager.id,
      newManagerName: `${newManager.name} ${newManager.lastName}`,
      sessionId: dto.sessionId,
      reason: dto.reason,
      transferred: true,
    };
  }
}