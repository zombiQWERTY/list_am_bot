/* eslint-disable @typescript-eslint/unbound-method */
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import axios, { AxiosInstance } from 'axios';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';

import { FlaresolvrrService } from '@list-am-bot/infrastructure/scraper/flaresolverr.service';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('FlaresolvrrService', (): void => {
  let service: FlaresolvrrService;
  let configService: DeepMockProxy<ConfigService>;
  let mockAxiosInstance: DeepMockProxy<AxiosInstance>;

  beforeEach(async (): Promise<void> => {
    configService = mockDeep<ConfigService>();
    mockAxiosInstance = mockDeep<AxiosInstance>();

    configService.get.mockImplementation((key: string): unknown => {
      if (key === 'scraper') {
        return {
          flaresolverr: {
            url: 'http://localhost:8191',
            port: 8191,
            maxTimeout: 60000,
          },
        };
      }
      return undefined;
    });

    mockedAxios.create.mockReturnValue(mockAxiosInstance as never);
    mockedAxios.isAxiosError.mockReturnValue(false);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FlaresolvrrService,
        {
          provide: ConfigService,
          useValue: configService,
        },
      ],
    }).compile();

    service = module.get<FlaresolvrrService>(FlaresolvrrService);

    jest.spyOn(Logger.prototype, 'log').mockImplementation();
    jest.spyOn(Logger.prototype, 'debug').mockImplementation();
    jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    jest.spyOn(Logger.prototype, 'error').mockImplementation();

    // Mock testConnection to always return true for existing tests
    jest.spyOn(service, 'testConnection').mockResolvedValue(true);
  });

  afterEach((): void => {
    jest.clearAllMocks();
  });

  it('should be defined', (): void => {
    expect(service).toBeDefined();
  });

  describe('fetchHtml', (): void => {
    const mockSuccessResponse = {
      data: {
        status: 'ok',
        message: 'Challenge solved',
        solution: {
          url: 'https://example.com',
          status: 200,
          cookies: [],
          userAgent: 'Mozilla/5.0',
          headers: {},
          response: '<html>Test HTML</html>',
        },
        startTimestamp: Date.now(),
        endTimestamp: Date.now(),
        version: '1.0.0',
      },
    };

    beforeEach((): void => {
      mockAxiosInstance.post.mockResolvedValue(mockSuccessResponse);
      (service as unknown as { lastHealthCheck: number }).lastHealthCheck =
        Date.now();
      (service as unknown as { isAvailable: boolean }).isAvailable = true;
    });

    it('should call axios post with correct url', async (): Promise<void> => {
      await service.fetchHtml('https://example.com');

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/v1',
        expect.objectContaining({
          cmd: 'request.get',
          url: 'https://example.com',
        }),
      );
    });

    it('should return html response from solution', async (): Promise<void> => {
      const result = await service.fetchHtml('https://example.com');

      expect(result).toBe('<html>Test HTML</html>');
    });

    it('should include maxTimeout in request', async (): Promise<void> => {
      await service.fetchHtml('https://example.com');

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/v1',
        expect.objectContaining({
          maxTimeout: 60000,
        }),
      );
    });

    it('should include proxy when provided', async (): Promise<void> => {
      await service.fetchHtml('https://example.com', 'http://proxy:8080');

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/v1',
        expect.objectContaining({
          proxy: { url: 'http://proxy:8080' },
        }),
      );
    });

    it('should not include proxy when not provided', async (): Promise<void> => {
      await service.fetchHtml('https://example.com');

      const callArgs = mockAxiosInstance.post.mock.calls[0][1];
      expect(callArgs).not.toHaveProperty('proxy');
    });

    it('should throw error when status is not ok', async (): Promise<void> => {
      mockAxiosInstance.post.mockResolvedValue({
        data: {
          status: 'error',
          message: 'Something went wrong',
        },
      });

      await expect(service.fetchHtml('https://example.com')).rejects.toThrow(
        'FlareSolverr error: Something went wrong',
      );
    });

    it('should throw error with unknown error when no message', async (): Promise<void> => {
      mockAxiosInstance.post.mockResolvedValue({
        data: {
          status: 'error',
        },
      });

      await expect(service.fetchHtml('https://example.com')).rejects.toThrow(
        'Unknown error',
      );
    });

    it('should handle axios error', async (): Promise<void> => {
      const axiosError = new Error('Network error');
      mockAxiosInstance.post.mockRejectedValue(axiosError);
      mockedAxios.isAxiosError.mockReturnValue(true);

      await expect(service.fetchHtml('https://example.com')).rejects.toThrow(
        'FlareSolverr failed',
      );
    });

    it('should rethrow non-axios errors', async (): Promise<void> => {
      const genericError = new Error('Generic error');
      mockAxiosInstance.post.mockRejectedValue(genericError);

      await expect(service.fetchHtml('https://example.com')).rejects.toThrow(
        'Generic error',
      );
    });
  });

  describe('testConnection', (): void => {
    beforeEach((): void => {
      // Restore real implementation for these tests
      jest.spyOn(service, 'testConnection').mockRestore();
    });

    it('should return true on successful connection', async (): Promise<void> => {
      mockAxiosInstance.post.mockResolvedValue({
        data: {
          status: 'ok',
          solution: {
            response: '<html></html>',
          },
        },
      });

      const result = await service.testConnection();

      expect(result).toBe(true);
    });

    it('should call axios post with google url', async (): Promise<void> => {
      mockAxiosInstance.post.mockResolvedValue({
        data: {
          status: 'ok',
        },
      });

      await service.testConnection();

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/v1',
        expect.objectContaining({
          url: 'https://www.google.com',
        }),
      );
    });

    it('should return false when status is not ok', async (): Promise<void> => {
      mockAxiosInstance.post.mockResolvedValue({
        data: {
          status: 'error',
          message: 'Connection failed',
        },
      });

      const result = await service.testConnection();

      expect(result).toBe(false);
    });

    it('should return false on error', async (): Promise<void> => {
      mockAxiosInstance.post.mockRejectedValue(new Error('Connection error'));

      const result = await service.testConnection();

      expect(result).toBe(false);
    });

    it('should use 10 second timeout for test', async (): Promise<void> => {
      mockAxiosInstance.post.mockResolvedValue({
        data: {
          status: 'ok',
        },
      });

      await service.testConnection();

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/v1',
        expect.objectContaining({
          maxTimeout: 10000,
        }),
      );
    });
  });

  describe('getHealth', (): void => {
    beforeEach((): void => {
      // Restore real implementation for these tests
      jest.spyOn(service, 'testConnection').mockRestore();
    });

    it('should return enabled true', async (): Promise<void> => {
      mockAxiosInstance.post.mockResolvedValue({
        data: {
          status: 'ok',
        },
      });

      const result = await service.getHealth();

      expect(result.enabled).toBe(true);
    });

    it('should return available true when connection succeeds', async (): Promise<void> => {
      mockAxiosInstance.post.mockResolvedValue({
        data: {
          status: 'ok',
        },
      });

      const result = await service.getHealth();

      expect(result.available).toBe(true);
    });

    it('should return available false when connection fails', async (): Promise<void> => {
      mockAxiosInstance.post.mockResolvedValue({
        data: {
          status: 'error',
          message: 'Connection failed',
        },
      });

      const result = await service.getHealth();

      expect(result.available).toBe(false);
    });

    it('should return available false on error', async (): Promise<void> => {
      mockAxiosInstance.post.mockRejectedValue(new Error('Error'));

      const result = await service.getHealth();

      expect(result.available).toBe(false);
    });

    it('should always return enabled true even on error', async (): Promise<void> => {
      mockAxiosInstance.post.mockRejectedValue(new Error('Error'));

      const result = await service.getHealth();

      expect(result.enabled).toBe(true);
    });
  });
});
