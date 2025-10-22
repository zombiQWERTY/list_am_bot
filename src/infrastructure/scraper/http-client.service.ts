import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { fetch } from 'undici';

import { delay } from '@list-am-bot/common/utils/delay.util';

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
];

@Injectable()
export class HttpClientService {
  private readonly timeoutMs: number;
  private readonly maxRetries: number;
  private readonly baseDelayMs: number;
  private readonly proxyUrl?: string;

  constructor(private readonly configService: ConfigService) {
    this.timeoutMs = this.configService.get<number>('fetchTimeoutMs', 15000);
    this.maxRetries = this.configService.get<number>('maxRetries', 3);
    this.baseDelayMs = 1000;
    this.proxyUrl = this.configService.get<string>('proxyUrl');
  }

  async fetchHtml(url: string): Promise<string> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          const backoffDelay = this.baseDelayMs * Math.pow(2, attempt - 1);
          const jitter = Math.random() * 1000;
          await delay(backoffDelay + jitter);
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(
          (): void => controller.abort(),
          this.timeoutMs,
        );

        const userAgent =
          USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];

        const response = await fetch(url, {
          headers: {
            'User-Agent': userAgent,
            Accept:
              'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
            'Accept-Encoding': 'gzip, deflate, br',
            Connection: 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          if (response.status === 429) {
            const retryAfter = response.headers.get('retry-after');
            const waitTime = retryAfter
              ? parseInt(retryAfter, 10) * 1000
              : 5000;
            await delay(waitTime);
            continue;
          }

          if (response.status >= 500) {
            throw new Error(`Server error: ${response.status}`);
          }

          throw new Error(`HTTP error: ${response.status}`);
        }

        return await response.text();
      } catch (error) {
        lastError = error as Error;

        if (error instanceof Error && error.name === 'AbortError') {
          continue;
        }

        if (attempt === this.maxRetries - 1) {
          break;
        }
      }
    }

    throw new Error(
      `Failed to fetch ${url} after ${this.maxRetries} attempts: ${lastError?.message}`,
    );
  }
}
