import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

import { RateLimiter } from '@list-am-bot/common/utils/rate-limiter.util';

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
  private readonly directClient: AxiosInstance;
  private readonly baseUrl: string;
  private readonly maxTimeout: number;
  private readonly maxRetries = 3;
  private readonly enableFallback: boolean;

  private isAvailable = true;
  private lastHealthCheck = 0;
  private readonly healthCheckInterval = 60000;
  private readonly rateLimiter: RateLimiter;

  constructor(private readonly configService: ConfigService) {
    // List.am rate limit: Be respectful, limit to 2 requests per second
    this.rateLimiter = new RateLimiter(2, 2);
    this.baseUrl = this.configService.get<string>(
      'FLARESOLVERR_URL',
      'http://list_am_bot.flaresolverr:8191',
    );
    this.maxTimeout = parseInt(
      this.configService.get<string>('FLARESOLVERR_MAX_TIMEOUT', '60000'),
      10,
    );
    this.enableFallback =
      this.configService.get<string>('FLARESOLVERR_ENABLE_FALLBACK', 'true') ===
      'true';

    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: this.maxTimeout + 5000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.directClient = axios.create({
      timeout: 30000,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    void this.checkHealth();
  }

  async fetchHtml(url: string, proxy?: string): Promise<string> {
    await this.checkHealthIfNeeded();

    if (this.isAvailable) {
      try {
        return await this.fetchWithRetry(url, proxy);
      } catch (error) {
        this.logger.warn(
          `FlareSolverr failed after retries: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
        this.isAvailable = false;

        if (this.enableFallback) {
          this.logger.debug('Attempting fallback to direct fetch...');
          return await this.fetchDirect(url);
        }

        throw error;
      }
    }

    if (this.enableFallback) {
      this.logger.warn('FlareSolverr unavailable, using direct fetch fallback');
      return await this.fetchDirect(url);
    }

    throw new Error('FlareSolverr is unavailable and fallback is disabled');
  }

  private async fetchWithRetry(
    url: string,
    proxy?: string,
    attempt = 1,
  ): Promise<string> {
    this.logger.debug(
      `Fetching URL via FlareSolverr (attempt ${attempt}/${this.maxRetries}): ${url}`,
    );

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
      await this.rateLimiter.acquire();

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

      this.logger.debug(
        `✅ FlareSolverr success (${duration}ms, attempt ${attempt}): Status ${solution.status}, HTML size: ${solution.response.length} bytes`,
      );

      if (solution.cookies && solution.cookies.length > 0) {
        this.logger.debug(
          `Received ${solution.cookies.length} cookies from FlareSolverr`,
        );
      }

      return solution.response;
    } catch (error) {
      if (attempt < this.maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        this.logger.warn(
          `FlareSolverr attempt ${attempt} failed, retrying in ${delay}ms...`,
        );
        await this.sleep(delay);
        return this.fetchWithRetry(url, proxy, attempt + 1);
      }

      if (axios.isAxiosError(error)) {
        const errorMsg =
          (error.response?.data as { message?: string })?.message ||
          error.message;
        this.logger.error(
          `FlareSolverr request failed after ${this.maxRetries} attempts: ${errorMsg}`,
          error.stack,
        );
        throw new Error(`FlareSolverr failed: ${errorMsg}`);
      }

      this.logger.error('Unexpected FlareSolverr error:', error);
      throw error;
    }
  }

  private async fetchDirect(url: string): Promise<string> {
    try {
      this.logger.debug(`Fetching URL directly (fallback): ${url}`);

      await this.rateLimiter.acquire();

      const startTime = Date.now();

      const response = await this.directClient.get<string>(url);
      const duration = Date.now() - startTime;

      this.logger.debug(
        `✅ Direct fetch success (${duration}ms): Status ${response.status}, HTML size: ${String(response.data).length} bytes`,
      );

      return String(response.data);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorMsg = error.message;
        this.logger.error(`Direct fetch failed: ${errorMsg}`, error.stack);
        throw new Error(`Direct fetch failed: ${errorMsg}`);
      }

      this.logger.error('Unexpected direct fetch error:', error);
      throw error;
    }
  }

  private async checkHealthIfNeeded(): Promise<void> {
    const now = Date.now();
    if (now - this.lastHealthCheck > this.healthCheckInterval) {
      await this.checkHealth();
    }
  }

  private async checkHealth(): Promise<void> {
    this.lastHealthCheck = Date.now();
    try {
      const wasAvailable = this.isAvailable;
      this.isAvailable = await this.testConnection();

      if (!wasAvailable && this.isAvailable) {
        this.logger.debug('✅ FlareSolverr is now available');
      } else if (wasAvailable && !this.isAvailable) {
        this.logger.warn('⚠️  FlareSolverr is now unavailable');
      }
    } catch (error) {
      this.logger.error('Health check error:', error);
      this.isAvailable = false;
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve): void => {
      setTimeout(resolve, ms);
    });
  }

  async testConnection(): Promise<boolean> {
    try {
      this.logger.debug('Testing FlareSolverr connection...');

      const response = await this.client.post<FlareSolverrResponse>('/v1', {
        cmd: 'request.get',
        url: 'https://www.google.com',
        maxTimeout: 10000,
      });

      if (response.data.status === 'ok') {
        this.logger.debug('✅ FlareSolverr connection test successful');
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
