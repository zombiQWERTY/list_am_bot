import { Injectable, Logger } from '@nestjs/common';
import type { Page } from 'puppeteer';

import { delay } from '@list-am-bot/common/utils/delay.util';

@Injectable()
export class CloudflareChallengeService {
  private readonly logger = new Logger(CloudflareChallengeService.name);

  async handleChallenge(page: Page): Promise<void> {
    const pageTitle = await page.title();

    if (!this.isChallengeDetected(pageTitle)) {
      return;
    }

    this.logger.warn(
      '⚠️  Cloudflare challenge detected! Waiting up to 60 seconds...',
    );

    // Log page content for debugging
    const bodyText = await page.evaluate((): string =>
      document.body.innerText.substring(0, 200),
    );
    this.logger.debug(`Page body preview: "${bodyText}"`);

    // Add random delay before waiting (more human-like)
    const randomDelay = Math.floor(Math.random() * 2000) + 1000; // 1-3 seconds
    await delay(randomDelay);

    // Try to wait for challenge to resolve
    await this.waitForChallengeResolution(page);
  }

  private isChallengeDetected(pageTitle: string): boolean {
    return (
      pageTitle.includes('Just a moment') ||
      pageTitle.includes('Один момент') ||
      pageTitle.includes('challenge') ||
      pageTitle.includes('Verifying you are human')
    );
  }

  private async waitForChallengeResolution(page: Page): Promise<void> {
    // Method 1: Wait for title to change
    try {
      this.logger.debug('Waiting for challenge to complete (up to 45s)...');
      await page.waitForFunction(
        (): boolean => {
          const title = document.title;
          const hasChallenge =
            title.includes('Just a moment') ||
            title.includes('Один момент') ||
            title.includes('challenge') ||
            title.includes('Verifying you are human');
          return !hasChallenge;
        },
        { timeout: 45000 },
      );
      this.logger.log('✅ Cloudflare challenge resolved (title changed)');
      await delay(3000);
    } catch (_titleError) {
      this.logger.warn('Title-based wait failed, trying navigation wait');

      // Method 2: Wait for navigation
      try {
        await page.waitForNavigation({
          timeout: 30000,
          waitUntil: 'domcontentloaded',
        });
        this.logger.log('✅ Cloudflare challenge passed (navigation)');
        await delay(3000);
      } catch (_navError) {
        this.logger.warn('⚠️  Navigation wait also failed');
        // Don't throw, give it more time
        await delay(5000);
      }
    }
  }

  async verifyChallengeResolved(page: Page): Promise<boolean> {
    try {
      const html = await page.content();
      const finalTitle = await page.title();

      if (
        html.includes('challenges.cloudflare.com') ||
        this.isChallengeDetected(finalTitle)
      ) {
        this.logger.warn(`⚠️  Challenge still present. Title: "${finalTitle}"`);
        this.logger.debug(
          `HTML preview: ${html.substring(0, 500).replace(/\s+/g, ' ')}`,
        );
        return false;
      }

      this.logger.log('✅ No challenge detected, page ready');
      return true;
    } catch (error) {
      this.logger.error(
        `Error verifying challenge: ${error instanceof Error ? error.message : String(error)}`,
      );
      return false;
    }
  }
}
