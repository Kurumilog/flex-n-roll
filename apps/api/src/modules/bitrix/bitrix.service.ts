import { Injectable, Logger, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

/**
 * BitrixService — обёртка над Bitrix24 REST API
 *
 * Все методы возвращают Promise<any>. Внутри используют axios.post().
 * Rate limit Bitrix24: 2 req/sec → задержка 500ms между вызовами.
 */
@Injectable()
export class BitrixService {
  private readonly logger = new Logger(BitrixService.name);
  private readonly httpClient: AxiosInstance;
  private readonly webhookUrl: string;

  constructor(@Optional() private readonly configService?: ConfigService) {
    this.webhookUrl =
      this.configService?.get<string>('BITRIX24_WEBHOOK_URL') ?? process.env.BITRIX24_WEBHOOK_URL ?? '';

    this.httpClient = axios.create({
      baseURL: this.webhookUrl,
      timeout: 10000,
      headers: { 'Content-Type': 'application/json' },
    });

    // Interceptor для retry при rate limit (HTTP 503 / 429)
    this.httpClient.interceptors.response.use(
      (response) => response,
      async (error) => {
        const status = error.response?.status;
        if (status === 429 || status === 503) {
          this.logger.warn(
            `Bitrix24 rate limit hit (HTTP ${status}), retrying after 500ms...`,
          );
          await this.delay(500);
          return this.httpClient.request(error.config);
        }
        return Promise.reject(error);
      },
    );
  }

  // ============================================================
  // Лиды
  // ============================================================

  /**
   * Создать лид в Bitrix24
   */
  async createLead(fields: {
    TITLE: string;
    STATUS_ID?: string;
    SOURCE_ID?: string;
    ASSIGNED_BY_ID?: number;
    NAME?: string;
    LAST_NAME?: string;
    EMAIL?: Array<{ VALUE: string; VALUE_TYPE: string }>;
    PHONE?: Array<{ VALUE: string; VALUE_TYPE: string }>;
    COMMENTS?: string;
    OPPORTUNITY?: number;
    CURRENCY_ID?: string;
  }): Promise<any> {
    return this.call('crm.lead.add', { fields });
  }

  /**
   * Обновить лид в Bitrix24
   */
  async updateLead(
    id: string,
    fields: {
      ASSIGNED_BY_ID?: number;
      STATUS_ID?: string;
      COMMENTS?: string;
    },
  ): Promise<any> {
    return this.call('crm.lead.update', { id, fields });
  }

  /**
   * Получить лиды из Bitrix24 с пагинацией
   */
  async getLeads(params: {
    filter?: Record<string, any>;
    select?: string[];
    start?: number;
  }): Promise<any[]> {
    const allLeads: any[] = [];
    let currentStart = params.start ?? 0;

    while (true) {
      const result = await this.call('crm.lead.list', {
        order: { ID: 'ASC' },
        filter: params.filter ?? {},
        select: params.select ?? ['ID', 'TITLE', 'STATUS_ID', 'ASSIGNED_BY_ID'],
        start: currentStart,
      });

      if (!result || result.length === 0) break;

      allLeads.push(...result);
      if (result.length < 50) break; // меньше лимита → это последний батч
      currentStart += 50;
    }

    return allLeads;
  }

  // ============================================================
  // Сделки
  // ============================================================

  /**
   * Получить сделки из Bitrix24
   */
  async getDeals(params: {
    filter?: Record<string, any>;
    select?: string[];
  }): Promise<any[]> {
    return this.call('crm.deal.list', {
      order: { ID: 'ASC' },
      filter: params.filter ?? {},
      select: params.select ?? [
        'ID',
        'TITLE',
        'STAGE_ID',
        'ASSIGNED_BY_ID',
        'OPPORTUNITY',
        'DATE_CREATE',
        'DATE_MODIFY',
      ],
    });
  }

  /**
   * Обновить сделку (например, назначить менеджера)
   */
  async updateDeal(
    id: string,
    fields: {
      ASSIGNED_BY_ID?: number;
      STAGE_ID?: string;
    },
  ): Promise<any> {
    return this.call('crm.deal.update', { id, fields });
  }

  // ============================================================
  // Open Lines (диалоги)
  // ============================================================

  /**
   * Передать сессию другому менеджеру
   */
  async transferSession(sessionId: string, toUserId: number): Promise<any> {
    return this.call('imopenlines.session.transfer', {
      id: sessionId,
      to: toUserId,
    });
  }

  /**
   * Получить открытые сессии
   */
  async getOpenSessions(params?: {
    filter?: Record<string, any>;
  }): Promise<any> {
    return this.call('imopenlines.session.list', {
      filter: params?.filter ?? { ACTIVE: 'Y' },
    });
  }

  /**
   * Отправить сообщение в диалог
   */
  async sendMessage(dialogId: string, text: string): Promise<any> {
    return this.call('im.message.add', {
      dialogId,
      message: { text },
    });
  }

  // ============================================================
  // Задачи
  // ============================================================

  /**
   * Создать задачу для менеджера
   */
  async createTask(fields: {
    TITLE: string;
    DESCRIPTION?: string;
    RESPONSIBLE_ID: number;
    DEADLINE?: string;
    UF_CRM_TASK?: string;
  }): Promise<any> {
    return this.call('tasks.task.add', { fields });
  }

  // ============================================================
  // CRM Activity (для email через Bitrix)
  // ============================================================

  /**
   * Добавить активность (email, звонок, встреча)
   */
  async addActivity(fields: {
    OWNER_TYPE_ID: number; // 1 = лид, 2 = сделка
    OWNER_ID: string;
    TYPE_ID: number; // 4 = email
    SUBJECT?: string;
    DESCRIPTION?: string;
    COMPLETED?: string; // 'Y' | 'N'
  }): Promise<any> {
    return this.call('crm.activity.add', { fields });
  }

  // ============================================================
  // Внутренние методы
  // ============================================================

  /**
   * Вызов метода Bitrix24 REST API
   */
  private async call(method: string, params: Record<string, any>): Promise<any> {
    try {
      const response = await this.httpClient.post(method, params);
      return response.data?.result ?? response.data;
    } catch (error) {
      this.logger.error(
        `Bitrix24 API call failed: ${method}`,
        error instanceof Error ? error.message : error,
      );
      throw error;
    }
  }

  /**
   * Утилита задержки (для rate limit)
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
