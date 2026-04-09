import { Injectable, Logger, Optional, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

export class OllamaUnavailableException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OllamaUnavailableException';
  }
}

interface OllamaChatResponse {
  model: string;
  message: { role: string; content: string };
  done: boolean;
}

/**
 * OllamaService — HTTP-клиент для Ollama API (qwen2.5:14b)
 *
 * НИКОГДА не должен крашить основной flow.
 * Любая ошибка Ollama → graceful fallback.
 */
@Injectable()
export class OllamaService {
  private readonly logger = new Logger(OllamaService.name);
  private readonly httpClient: AxiosInstance;
  private readonly baseUrl: string;
  private readonly routingModel: string;
  private readonly timeoutMs: number;

  constructor(@Optional() private readonly configService?: ConfigService) {
    this.baseUrl =
      this.configService?.get<string>('OLLAMA_BASE_URL') ?? process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434';
    this.routingModel =
      this.configService?.get<string>('OLLAMA_ROUTING_MODEL') ?? process.env.OLLAMA_ROUTING_MODEL ?? 'qwen2.5:14b-instruct';
    this.timeoutMs =
      this.configService?.get<number>('OLLAMA_TIMEOUT_MS') ?? Number(process.env.OLLAMA_TIMEOUT_MS) ?? 15000;

    this.httpClient = axios.create({
      baseURL: this.baseUrl,
      timeout: this.timeoutMs,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  /**
   * Основной метод для маршрутизации и генерации текста
   */
  async chat(prompt: string, systemPrompt?: string): Promise<string> {
    const messages: Array<{ role: string; content: string }> = [];

    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }

    messages.push({ role: 'user', content: prompt });

    try {
      const response = await this.httpClient.post<OllamaChatResponse>(
        '/api/chat',
        {
          model: this.routingModel,
          messages,
          stream: false,
          options: {
            temperature: 0.1, // Низкая температура для детерминированных ответов
            num_predict: 500,
          },
        },
      );

      return response.data.message.content.trim();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED' || error.code === 'ECONNREFUSED') {
          this.logger.error('Ollama service unavailable — timeout or connection refused');
          throw new OllamaUnavailableException(
            `Ollama is not available: ${error.message}`,
          );
        }
        this.logger.error(
          `Ollama HTTP error: ${error.response?.status ?? 'unknown'}`,
        );
        throw new OllamaUnavailableException(
          `Ollama HTTP error: ${error.message}`,
        );
      }

      this.logger.error('Unexpected error calling Ollama', error);
      throw new OllamaUnavailableException(
        `Unexpected Ollama error: ${error instanceof Error ? error.message : 'unknown'}`,
      );
    }
  }

  /**
   * Создать embedding через Ollama (для векторного поиска)
   * Endpoint: POST /api/embeddings (не /api/embed!)
   */
  async embed(model: string, input: string): Promise<number[]> {
    try {
      const response = await this.httpClient.post<{
        model: string;
        embedding: number[];
      }>('/api/embeddings', {
        model,
        input,
      });

      return response.data.embedding ?? [];
    } catch (error) {
      this.logger.error(
        `Ollama embed failed (${model})`,
        error instanceof Error ? error.message : error,
      );
      throw new OllamaUnavailableException(
        `Embedding failed: ${error instanceof Error ? error.message : 'unknown'}`,
      );
    }
  }
}
