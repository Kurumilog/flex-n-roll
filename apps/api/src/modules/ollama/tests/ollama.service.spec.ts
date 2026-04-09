import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { OllamaService, OllamaUnavailableException } from '../ollama.service';
import axios from 'axios';

// Mock axios module
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    post: jest.fn(),
    interceptors: {
      response: {
        use: jest.fn(),
      },
    },
  })),
  isAxiosError: jest.fn((error) => error.isAxiosError === true),
}));

// Mock ConfigService
const mockConfigService = {
  get: jest.fn((key: string, defaultValue?: any) => {
    const config: Record<string, any> = {
      OLLAMA_BASE_URL: 'http://100.64.1.5:11434',
      OLLAMA_ROUTING_MODEL: 'qwen2.5:14b-instruct',
      OLLAMA_TIMEOUT_MS: 15000,
    };
    return config[key] ?? defaultValue;
  }),
};

describe('OllamaService', () => {
  let service: OllamaService;
  let mockHttpClient: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OllamaService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<OllamaService>(OllamaService);
    mockHttpClient = (service as any).httpClient;
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('chat', () => {
    it('should send a chat request with system prompt and user prompt', async () => {
      // arrange
      const mockResponse = {
        model: 'qwen2.5:14b-instruct',
        message: { role: 'assistant', content: '{"manager_id": 13, "topic": "price_negotiation"}' },
        done: true,
      };
      const mockPost = jest.fn().mockResolvedValue({ data: mockResponse });
      mockHttpClient.post = mockPost;

      const systemPrompt = 'You are a routing assistant';
      const userPrompt = 'Клиент хочет расчёт цены';

      // act
      const result = await service.chat(userPrompt, systemPrompt);

      // assert
      expect(result).toBe('{"manager_id": 13, "topic": "price_negotiation"}');
      expect(mockPost).toHaveBeenCalledWith(
        '/api/chat',
        expect.objectContaining({
          model: 'qwen2.5:14b-instruct',
          messages: [
            { role: 'system', content: 'You are a routing assistant' },
            { role: 'user', content: 'Клиент хочет расчёт цены' },
          ],
          stream: false,
          options: expect.objectContaining({
            temperature: 0.1,
            num_predict: 500,
          }),
        }),
      );
    });

    it('should send a chat request without system prompt', async () => {
      // arrange
      const mockResponse = {
        model: 'qwen2.5:14b-instruct',
        message: { role: 'assistant', content: 'Hello there!' },
        done: true,
      };
      const mockPost = jest.fn().mockResolvedValue({ data: mockResponse });
      mockHttpClient.post = mockPost;

      // act
      const result = await service.chat('Привет!');

      // assert
      expect(result).toBe('Hello there!');
      expect(mockPost).toHaveBeenCalledWith(
        '/api/chat',
        expect.objectContaining({
          messages: [{ role: 'user', content: 'Привет!' }],
        }),
      );
    });

    it('should trim whitespace from response content', async () => {
      // arrange
      const mockResponse = {
        model: 'qwen2.5:14b-instruct',
        message: { role: 'assistant', content: '  {"manager_id": 13}  \n' },
        done: true,
      };
      const mockPost = jest.fn().mockResolvedValue({ data: mockResponse });
      mockHttpClient.post = mockPost;

      // act
      const result = await service.chat('Test');

      // assert
      expect(result).toBe('{"manager_id": 13}');
    });

    it('should throw OllamaUnavailableException on connection timeout (ECONNABORTED)', async () => {
      // arrange
      const timeoutError = Object.assign(new Error('timeout of 15000ms exceeded'), {
        code: 'ECONNABORTED',
        isAxiosError: true,
      });
      const mockPost = jest.fn().mockRejectedValue(timeoutError);
      mockHttpClient.post = mockPost;

      // act & assert
      await expect(service.chat('Test')).rejects.toThrow(OllamaUnavailableException);
      await expect(service.chat('Test')).rejects.toThrow(/Ollama is not available/);
    });

    it('should throw OllamaUnavailableException on connection refused (ECONNREFUSED)', async () => {
      // arrange
      const refusedError = Object.assign(new Error('connect ECONNREFUSED 100.64.1.5:11434'), {
        code: 'ECONNREFUSED',
        isAxiosError: true,
      });
      const mockPost = jest.fn().mockRejectedValue(refusedError);
      mockHttpClient.post = mockPost;

      // act & assert
      await expect(service.chat('Test')).rejects.toThrow(OllamaUnavailableException);
      await expect(service.chat('Test')).rejects.toThrow(/Ollama is not available/);
    });

    it('should throw OllamaUnavailableException on HTTP error (500)', async () => {
      // arrange
      const httpError = Object.assign(new Error('Request failed with status code 500'), {
        code: 'ERR_BAD_RESPONSE',
        isAxiosError: true,
        response: { status: 500 },
      });
      const mockPost = jest.fn().mockRejectedValue(httpError);
      mockHttpClient.post = mockPost;

      // act & assert
      await expect(service.chat('Test')).rejects.toThrow(OllamaUnavailableException);
      await expect(service.chat('Test')).rejects.toThrow(/Ollama HTTP error/);
    });

    it('should throw OllamaUnavailableException on unexpected errors', async () => {
      // arrange
      const unexpectedError = new Error('Something weird happened');
      const mockPost = jest.fn().mockRejectedValue(unexpectedError);
      mockHttpClient.post = mockPost;

      // act & assert
      await expect(service.chat('Test')).rejects.toThrow(OllamaUnavailableException);
      await expect(service.chat('Test')).rejects.toThrow(/Unexpected Ollama error/);
    });

    it('should log error when chat request fails', async () => {
      // arrange
      const errorLogger = jest.spyOn((service as any).logger, 'error');
      const timeoutError = Object.assign(new Error('timeout'), {
        code: 'ECONNABORTED',
        isAxiosError: true,
      });
      const mockPost = jest.fn().mockRejectedValue(timeoutError);
      mockHttpClient.post = mockPost;

      // act & assert
      await expect(service.chat('Test')).rejects.toThrow();
      expect(errorLogger).toHaveBeenCalledWith(
        'Ollama service unavailable — timeout or connection refused',
      );
    });
  });

  describe('embed', () => {
    it('should create an embedding for input text', async () => {
      // arrange
      const mockEmbedding = [0.1, 0.2, 0.3, 0.4, 0.5];
      const mockResponse = {
        model: 'nomic-embed-text',
        embedding: mockEmbedding,
      };
      const mockPost = jest.fn().mockResolvedValue({ data: mockResponse });
      mockHttpClient.post = mockPost;

      // act
      const result = await service.embed('nomic-embed-text', 'Hello world');

      // assert
      expect(result).toEqual(mockEmbedding);
      expect(mockPost).toHaveBeenCalledWith(
        '/api/embeddings',
        expect.objectContaining({
          model: 'nomic-embed-text',
          input: 'Hello world',
        }),
      );
    });

    it('should return empty array when embedding is null', async () => {
      // arrange
      const mockResponse = {
        model: 'nomic-embed-text',
        embedding: null,
      };
      const mockPost = jest.fn().mockResolvedValue({ data: mockResponse });
      mockHttpClient.post = mockPost;

      // act
      const result = await service.embed('nomic-embed-text', 'Test');

      // assert
      expect(result).toEqual([]);
    });

    it('should return empty array when embedding is undefined', async () => {
      // arrange
      const mockResponse = {
        model: 'nomic-embed-text',
      };
      const mockPost = jest.fn().mockResolvedValue({ data: mockResponse });
      mockHttpClient.post = mockPost;

      // act
      const result = await service.embed('nomic-embed-text', 'Test');

      // assert
      expect(result).toEqual([]);
    });

    it('should throw OllamaUnavailableException on embed failure', async () => {
      // arrange
      const embedError = Object.assign(new Error('Model not found'), {
        code: 'ERR_BAD_REQUEST',
        isAxiosError: true,
        response: { status: 400 },
      });
      const mockPost = jest.fn().mockRejectedValue(embedError);
      mockHttpClient.post = mockPost;

      // act & assert
      await expect(
        service.embed('invalid-model', 'Test'),
      ).rejects.toThrow(OllamaUnavailableException);
      await expect(
        service.embed('invalid-model', 'Test'),
      ).rejects.toThrow(/Embedding failed/);
    });

    it('should log error when embedding fails', async () => {
      // arrange
      const errorLogger = jest.spyOn((service as any).logger, 'error');
      const embedError = new Error('Embedding service error');
      const mockPost = jest.fn().mockRejectedValue(embedError);
      mockHttpClient.post = mockPost;

      // act & assert
      await expect(
        service.embed('nomic-embed-text', 'Test'),
      ).rejects.toThrow();
      expect(errorLogger).toHaveBeenCalledWith(
        'Ollama embed failed (nomic-embed-text)',
        'Embedding service error',
      );
    });
  });

  describe('configuration', () => {
    it('should use default values when config is missing', async () => {
      // arrange
      const partialConfigService = {
        get: jest.fn((key: string, defaultValue?: any) => defaultValue),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          OllamaService,
          { provide: ConfigService, useValue: partialConfigService },
        ],
      }).compile();

      const ollamaService = module.get<OllamaService>(OllamaService);

      // assert — should not throw, use defaults
      expect(ollamaService).toBeDefined();
    });

    it('should use custom timeout from config', async () => {
      // arrange
      const customConfigService = {
        get: jest.fn((key: string) => {
          const config: Record<string, any> = {
            OLLAMA_BASE_URL: 'http://localhost:11434',
            OLLAMA_ROUTING_MODEL: 'qwen2.5:14b-instruct',
            OLLAMA_TIMEOUT_MS: 30000,
          };
          return config[key];
        }),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          OllamaService,
          { provide: ConfigService, useValue: customConfigService },
        ],
      }).compile();

      const ollamaService = module.get<OllamaService>(OllamaService);

      // assert
      expect((ollamaService as any).timeoutMs).toBe(30000);
    });

    it('should use custom model from config', async () => {
      // arrange
      const customConfigService = {
        get: jest.fn((key: string) => {
          const config: Record<string, any> = {
            OLLAMA_BASE_URL: 'http://localhost:11434',
            OLLAMA_ROUTING_MODEL: 'llama3:70b',
            OLLAMA_TIMEOUT_MS: 15000,
          };
          return config[key];
        }),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          OllamaService,
          { provide: ConfigService, useValue: customConfigService },
        ],
      }).compile();

      const ollamaService = module.get<OllamaService>(OllamaService);

      // assert
      expect((ollamaService as any).routingModel).toBe('llama3:70b');
    });
  });

  describe('OllamaUnavailableException', () => {
    it('should have correct name property', () => {
      // act
      const exception = new OllamaUnavailableException('Test error');

      // assert
      expect(exception.name).toBe('OllamaUnavailableException');
    });

    it('should have correct message property', () => {
      // act
      const exception = new OllamaUnavailableException('Custom error message');

      // assert
      expect(exception.message).toBe('Custom error message');
    });

    it('should be instance of Error', () => {
      // act
      const exception = new OllamaUnavailableException('Test');

      // assert
      expect(exception).toBeInstanceOf(Error);
    });
  });
});
