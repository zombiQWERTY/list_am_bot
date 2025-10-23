import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

interface FlareSolverrRequest {
  cmd: 'request.get' | 'request.post';
  url: string;
  maxTimeout?: number;
  cookies?: Array<{ name: string; value: string }>;
  returnOnlyCookies?: boolean;
  proxy?: {
    url: string;
  };
}

interface FlareSolverrResponse {
  status: string;
  message: string;
  solution: {
    url: string;
    status: number;
    cookies: Array<{ name: string; value: string; domain: string }>;
    userAgent: string;
    headers: Record<string, string>;
    response: string;
  };
  startTimestamp: number;
  endTimestamp: number;
  version: string;
}

@Injectable()
export class FlaresolvrrService {
  private readonly logger = new Logger(FlaresolvrrService.name);
  private readonly client: AxiosInstance;
  private readonly baseUrl: string;
  private readonly maxTimeout: number;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl = this.configService.get<string>(
      'FLARESOLVERR_URL',
      'http://list_am_bot.flaresolverr:8191',
    );
    this.maxTimeout = parseInt(
      this.configService.get<string>('FLARESOLVERR_MAX_TIMEOUT', '60000'),
      10,
    );

    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: this.maxTimeout + 5000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async fetchHtml(url: string, proxy?: string): Promise<string> {
    this.logger.debug(`Fetching URL via FlareSolverr: ${url}`);

    const requestData: FlareSolverrRequest = {
      cmd: 'request.get',
      url,
      maxTimeout: this.maxTimeout,
    };

    if (proxy) {
      requestData.proxy = { url: proxy };
      this.logger.debug(`Using proxy: ${proxy}`);
    }

    try {
      const startTime = Date.now();

      const response = await this.client.post<FlareSolverrResponse>(
        '/v1',
        requestData,
      );

      const duration = Date.now() - startTime;

      if (response.data.status !== 'ok') {
        throw new Error(
          `FlareSolverr error: ${response.data.message || 'Unknown error'}`,
        );
      }

      const { solution } = response.data;

      this.logger.log(
        `✅ FlareSolverr success (${duration}ms): Status ${solution.status}, HTML size: ${solution.response.length} bytes`,
      );

      if (solution.cookies && solution.cookies.length > 0) {
        this.logger.debug(
          `Received ${solution.cookies.length} cookies from FlareSolverr`,
        );
      }

      return solution.response;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorMsg =
          (error.response?.data as { message?: string })?.message ||
          error.message;
        this.logger.error(
          `FlareSolverr request failed: ${errorMsg}`,
          error.stack,
        );
        throw new Error(`FlareSolverr failed: ${errorMsg}`);
      }

      this.logger.error('Unexpected FlareSolverr error:', error);
      throw error;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      this.logger.log('Testing FlareSolverr connection...');

      const response = await this.client.post<FlareSolverrResponse>('/v1', {
        cmd: 'request.get',
        url: 'https://www.google.com',
        maxTimeout: 10000,
      });

      if (response.data.status === 'ok') {
        this.logger.log('✅ FlareSolverr connection test successful');
        return true;
      }

      this.logger.warn(
        `⚠️  FlareSolverr test failed: ${response.data.message}`,
      );
      return false;
    } catch (error) {
      this.logger.error('❌ FlareSolverr connection test failed:', error);
      return false;
    }
  }

  async getHealth(): Promise<{
    enabled: boolean;
    available: boolean;
    version?: string;
  }> {
    try {
      const isAvailable = await this.testConnection();
      return {
        enabled: true,
        available: isAvailable,
      };
    } catch (error) {
      this.logger.error('❌ FlareSolverr health check failed:', error);
      return {
        enabled: true,
        available: false,
      };
    }
  }
}
