import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { N8nService, N8nUnavailableException } from '../n8n.service';
import * as axiosPackage from 'axios';

const mockAxiosInstance = {
  post: jest.fn(),
};

const mockAxiosCreate = jest.fn().mockReturnValue(mockAxiosInstance);

jest.mock('axios', () => ({
  create: jest.fn(),
  isAxiosError: jest.fn(),
}));

const mockConfigService = {
  get: jest.fn((key: string, defaultValue?: string) => {
    if (key === 'N8N_BASE_URL') return 'https://n8n.kurumi.software';
    return defaultValue;
  }),
};

describe('N8nService', () => {
  let service: N8nService;

  beforeEach(async () => {
    jest.clearAllMocks();
    (axiosPackage.create as jest.Mock).mockReturnValue(mockAxiosInstance);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        N8nService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<N8nService>(N8nService);
  });

  describe('triggerWorkflow', () => {
    it('should successfully trigger a webhook and return response data', async () => {
      // arrange
      const mockResponse = { success: true, data: { managerId: 13 } };
      mockAxiosInstance.post.mockResolvedValue({ data: mockResponse });

      // act
      const result = await service.triggerWorkflow('test-webhook', {
        messageText: 'test',
      });

      // assert
      expect(result).toEqual(mockResponse);
      expect(axiosPackage.create).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: 'https://n8n.kurumi.software',
          timeout: 10000,
        }),
      );
    });

    it('should throw N8nUnavailableException on timeout', async () => {
      // arrange
      mockAxiosInstance.post.mockRejectedValue({
        code: 'ECONNABORTED',
      });

      // act & assert
      await expect(
        service.triggerWorkflow('test-webhook', {}),
      ).rejects.toThrow(N8nUnavailableException);
    });

    it('should throw N8nUnavailableException on connection refused', async () => {
      // arrange
      mockAxiosInstance.post.mockRejectedValue({
        code: 'ECONNREFUSED',
      });

      // act & assert
      await expect(
        service.triggerWorkflow('test-webhook', {}),
      ).rejects.toThrow(N8nUnavailableException);
    });

    it('should throw N8nUnavailableException on HTTP error', async () => {
      // arrange
      mockAxiosInstance.post.mockRejectedValue({
        code: 'ERR_BAD_REQUEST',
        response: { status: 500 },
      });

      // act & assert
      await expect(
        service.triggerWorkflow('test-webhook', {}),
      ).rejects.toThrow(N8nUnavailableException);
    });

    it('should use default base URL when N8N_BASE_URL not configured', async () => {
      // arrange
      mockConfigService.get.mockReturnValue(undefined);
      mockAxiosInstance.post.mockResolvedValue({ data: {} });

      // act
      await service.triggerWorkflow('test-webhook', {});

      // assert
      expect(axiosPackage.create).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: 'https://n8n.kurumi.software',
        }),
      );
    });
  });

  describe('callApi', () => {
    it('should successfully call n8n REST API', async () => {
      // arrange
      const mockResponse = { workflows: [] };
      mockAxiosInstance.post.mockResolvedValue({ data: mockResponse });

      // act
      const result = await service.callApi('workflows');

      // assert
      expect(result).toEqual(mockResponse);
    });

    it('should throw N8nUnavailableException on API timeout', async () => {
      // arrange
      mockAxiosInstance.post.mockRejectedValue({
        code: 'ECONNABORTED',
      });

      // act & assert
      await expect(service.callApi('workflows')).rejects.toThrow(
        N8nUnavailableException,
      );
    });

    it('should send POST data when provided', async () => {
      // arrange
      mockAxiosInstance.post.mockResolvedValue({ data: {} });

      // act
      await service.callApi('workflows', { name: 'test' });

      // assert
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/api/v1/workflows',
        { name: 'test' },
      );
    });
  });
});
