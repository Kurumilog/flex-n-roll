import { Injectable, Logger, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

/**
 * Исключение при недоступности n8n
 */
export class N8nUnavailableException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'N8nUnavailableException';
  }
}

/**
 * N8nService — HTTP-клиент для вызова n8n webhooks
 *
 * NestJS триггерит n8n workflow'ы через webhook endpoints.
 * НИКОГДА не должен крашить основной flow — graceful fallback.
 */
@Injectable()
export class N8nService {
  private readonly logger = new Logger(N8nService.name);
  private readonly httpClient: AxiosInstance;
  private readonly baseUrl: string;

  constructor(@Optional() private readonly configService?: ConfigService) {
    this.baseUrl =
      this.configService?.get<string>('N8N_BASE_URL') ?? process.env.N8N_BASE_URL ?? 'https://n8n.kurumi.software';

    this.httpClient = axios.create({
      baseURL: this.baseUrl,
      timeout: 10000,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  /**
   * Триггерить n8n workflow через webhook
   *
   * @param webhookPath — путь webhook'а (напр. 'routing-message')
   * @param data — payload для workflow
   */
  async triggerWorkflow(webhookPath: string, data: Record<string, any>): Promise<any> {
    try {
      this.logger.log(`Triggering n8n webhook: ${webhookPath}`);

      const response = await this.httpClient.post(
        `/webhook/${webhookPath}`,
        data,
      );

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED' || error.code === 'ECONNREFUSED') {
          this.logger.error(`n8n webhook '${webhookPath}' unavailable — timeout or connection refused`);
          throw new N8nUnavailableException(
            `n8n is not available: ${error.message}`,
          );
        }
        this.logger.error(
          `n8n webhook '${webhookPath}' failed: HTTP ${error.response?.status ?? 'unknown'}`,
        );
        throw new N8nUnavailableException(
          `n8n HTTP error: ${error.message}`,
        );
      }

      this.logger.error(`Unexpected error triggering n8n webhook '${webhookPath}'`, error);
      throw new N8nUnavailableException(
        `Unexpected n8n error: ${error instanceof Error ? error.message : 'unknown'}`,
      );
    }
  }

  /**
   * Вызвать REST API n8n (для управления workflows)
   *
   * @param method — REST метод (напр. 'workflows', 'executions')
   * @param data — payload (для POST/PUT)
   */
  async callApi(method: string, data?: Record<string, any>): Promise<any> {
    try {
      this.logger.log(`Calling n8n API: ${method}`);

      const response = await this.httpClient.post(
        `/api/v1/${method}`,
        data,
      );

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED' || error.code === 'ECONNREFUSED') {
          this.logger.error(`n8n API '${method}' unavailable`);
          throw new N8nUnavailableException(
            `n8n API is not available: ${error.message}`,
          );
        }
        this.logger.error(
          `n8n API '${method}' failed: HTTP ${error.response?.status ?? 'unknown'}`,
        );
        throw new N8nUnavailableException(
          `n8n API error: ${error.message}`,
        );
      }

      this.logger.error(`Unexpected error calling n8n API '${method}'`, error);
      throw new N8nUnavailableException(
        `Unexpected n8n API error: ${error instanceof Error ? error.message : 'unknown'}`,
      );
    }
  }
}
