import { Injectable, Logger } from '@nestjs/common';
import type { Page } from 'puppeteer';

import { PROXY_CONFIG } from '@list-am-bot/infrastructure/scraper/proxy/proxy.config';

/**
 * Service to check and verify external IP addresses
 */
@Injectable()
export class IpCheckerService {
  private readonly logger = new Logger(IpCheckerService.name);

  /**
   * Check external IP address using page context
   */
  async checkIpAddress(page: Page): Promise<string> {
    const services = PROXY_CONFIG.ipCheck.services;

    for (const serviceUrl of services) {
      try {
        this.logger.debug(`Checking IP via ${serviceUrl}...`);

        const response = await page.evaluate(
          async (
            url: string,
            timeout: number,
          ): Promise<
            { success: true; data: unknown } | { success: false; error: string }
          > => {
            const controller = new AbortController();
            const timeoutId = setTimeout(
              (): void => controller.abort(),
              timeout,
            );

            try {
              const res = await fetch(url, {
                signal: controller.signal,
                headers: {
                  Accept: 'application/json',
                },
              });

              if (!res.ok) {
                throw new Error(`HTTP ${res.status}`);
              }

              const data: unknown = await res.json();
              return { success: true, data };
            } catch (err) {
              return {
                success: false,
                error: err instanceof Error ? err.message : String(err),
              };
            } finally {
              clearTimeout(timeoutId);
            }
          },
          serviceUrl,
          PROXY_CONFIG.ipCheck.timeoutMs,
        );

        if (!response.success) {
          this.logger.warn(
            `IP check failed for ${serviceUrl}: ${response.error}`,
          );
          continue;
        }

        const ip = this.extractIpFromResponse(response.data);
        if (ip) {
          this.logger.debug(`External IP detected: ${ip}`);
          return ip;
        }
      } catch (error) {
        this.logger.warn(
          `Failed to check IP via ${serviceUrl}:`,
          error instanceof Error ? error.message : error,
        );
        continue;
      }
    }

    throw new Error('Failed to detect external IP from all services');
  }

  /**
   * Extract IP from various service response formats
   */
  private extractIpFromResponse(data: unknown): string | null {
    if (!data || typeof data !== 'object') {
      return null;
    }

    const dataObj = data as Record<string, unknown>;

    // Try common field names
    const ipFields = ['ip', 'query', 'ipAddress', 'ip_addr'];

    for (const field of ipFields) {
      if (typeof dataObj[field] === 'string') {
        const ip = dataObj[field];
        if (this.isValidIp(ip)) {
          return ip;
        }
      }
    }

    return null;
  }

  /**
   * Validate IP address format
   */
  private isValidIp(ip: string): boolean {
    // Simple IPv4 validation
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (ipv4Regex.test(ip)) {
      const parts = ip.split('.');
      return parts.every((part): boolean => {
        const num = parseInt(part, 10);
        return num >= 0 && num <= 255;
      });
    }

    // Simple IPv6 validation (basic check)
    const ipv6Regex = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;
    return ipv6Regex.test(ip);
  }

  /**
   * Detect if IP has changed
   */
  async detectIpChange(page: Page, expectedIp: string): Promise<boolean> {
    try {
      const currentIp = await this.checkIpAddress(page);

      if (currentIp !== expectedIp) {
        this.logger.warn(
          `IP changed! Expected: ${expectedIp}, Current: ${currentIp}`,
        );
        return true;
      }

      return false;
    } catch (error) {
      this.logger.error('Failed to detect IP change:', error);
      // Assume IP might have changed on error
      return true;
    }
  }

  /**
   * Verify IP after proxy assignment
   */
  async verifyProxyIp(page: Page): Promise<string> {
    try {
      const ip = await this.checkIpAddress(page);
      this.logger.log(`✅ Proxy IP verified: ${ip}`);
      return ip;
    } catch (error) {
      this.logger.error('❌ Failed to verify proxy IP:', error);
      throw new Error('Proxy IP verification failed');
    }
  }
}
