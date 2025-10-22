import { Injectable, Logger } from '@nestjs/common';
import type { Page } from 'puppeteer';

import { delay } from '@list-am-bot/common/utils/delay.util';
import { USER_AGENTS } from '@list-am-bot/infrastructure/scraper/browser/browser.config';

@Injectable()
export class HumanBehaviorService {
  private readonly logger = new Logger(HumanBehaviorService.name);

  async setupPageForHuman(page: Page): Promise<void> {
    try {
      // Proxy authentication
      await this.setupProxyAuth(page);

      // Random user agent
      await this.setRandomUserAgent(page);

      // Randomize viewport
      await this.setRandomViewport(page);

      // Set realistic headers
      await this.setHeaders(page);

      // Simulate human behavior
      await this.simulateBehavior(page);
    } catch (error) {
      this.logger.error('Failed to setup page for human simulation:', error);
      throw error;
    }
  }

  private async setupProxyAuth(page: Page): Promise<void> {
    const proxyUsername = process.env.PROXY_USERNAME;
    const proxyPassword = process.env.PROXY_PASSWORD;

    if (proxyUsername && proxyPassword) {
      await page.authenticate({
        username: proxyUsername,
        password: proxyPassword,
      });
      this.logger.debug('Proxy authentication configured');
    }
  }

  private async setRandomUserAgent(page: Page): Promise<void> {
    const userAgent =
      USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
    await page.setUserAgent(userAgent);
    this.logger.debug(`Set user agent: ${userAgent}`);
  }

  private async setRandomViewport(page: Page): Promise<void> {
    await page.setViewport({
      width: Math.floor(1024 + Math.random() * 500),
      height: Math.floor(768 + Math.random() * 300),
    });
    this.logger.debug('Set randomized viewport');
  }

  private async setHeaders(page: Page): Promise<void> {
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
      Accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    });
    this.logger.debug('Extra headers set');
  }

  async simulateBehavior(page: Page): Promise<void> {
    try {
      // More realistic mouse movements (5-7 movements)
      const movements = Math.floor(Math.random() * 3) + 5;
      for (let i = 0; i < movements; i++) {
        const randomX = Math.floor(Math.random() * 800) + 100;
        const randomY = Math.floor(Math.random() * 600) + 100;

        await page.mouse.move(randomX, randomY, {
          steps: Math.floor(Math.random() * 30) + 10,
        });
        await delay(Math.floor(Math.random() * 800) + 300);
      }

      // Random scroll behavior (multiple scrolls)
      for (let i = 0; i < 2; i++) {
        await page.evaluate((): void => {
          window.scrollTo({
            top: Math.floor(Math.random() * 500),
            behavior: 'smooth',
          });
        });
        await delay(Math.floor(Math.random() * 1000) + 500);
      }

      this.logger.debug('Simulated human behavior (mouse + scroll)');
    } catch (_error) {
      this.logger.debug('Failed to simulate human behavior (non-critical)');
    }
  }

  async clickElementLikeHuman(page: Page, selector: string): Promise<boolean> {
    try {
      const element = await page.$(selector);
      if (!element) {
        return false;
      }

      this.logger.log(`Found element: ${selector}, clicking like human...`);

      // Move mouse to element first
      const box = await element.boundingBox();
      if (box) {
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, {
          steps: 10,
        });
        await delay(500);
      }

      await element.click();
      await delay(3000);

      return true;
    } catch (_error) {
      return false;
    }
  }
}
