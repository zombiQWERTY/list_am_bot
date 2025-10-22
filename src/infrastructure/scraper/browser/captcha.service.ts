import { Injectable, Logger } from '@nestjs/common';
import type { Page } from 'puppeteer';

import { delay } from '@list-am-bot/common/utils/delay.util';

import type {
  CaptchaResult,
  RecaptchaPluginConstructor,
} from './browser.types';
import { isPageWithCaptcha, isFrameWithCaptcha } from './browser.types';

@Injectable()
export class CaptchaService {
  private readonly logger = new Logger(CaptchaService.name);

  private readonly CAPTCHA_SELECTORS = [
    'iframe[src*="recaptcha"]',
    'iframe[src*="captcha"]',
    'iframe[src*="turnstile"]',
    'iframe[src*="hcaptcha"]',
    '.cf-challenge',
    '#challenge-form',
  ];

  async detectAndHandleCaptcha(
    page: Page,
    recaptchaPlugin: RecaptchaPluginConstructor | null,
  ): Promise<void> {
    try {
      const hasCaptcha = await this.detectCaptcha(page);

      if (!hasCaptcha) {
        this.logger.debug('No CAPTCHA detected');
        return;
      }

      if (!recaptchaPlugin || !process.env.CAPTCHA_API_KEY) {
        this.logger.warn(
          'CAPTCHA detected but solving disabled. Set CAPTCHA_API_KEY to enable.',
        );
        await delay(10000);
        return;
      }

      await this.solveCaptcha(page);
    } catch (error) {
      this.logger.warn('CAPTCHA handling failed (non-critical):', error);
    }
  }

  private async detectCaptcha(page: Page): Promise<boolean> {
    for (const selector of this.CAPTCHA_SELECTORS) {
      const element = await page.$(selector);
      if (element) {
        this.logger.warn(`⚠️  CAPTCHA detected: ${selector}`);
        return true;
      }
    }
    return false;
  }

  private async solveCaptcha(page: Page): Promise<void> {
    try {
      // Wait for CAPTCHA iframe to load
      this.logger.debug('Waiting for CAPTCHA iframe to load...');
      await page
        .waitForSelector('iframe[src*="recaptcha"], iframe[src*="captcha"]', {
          timeout: 10000,
        })
        .catch((): void => {
          this.logger.debug('CAPTCHA iframe wait timeout (non-critical)');
        });

      this.logger.log('🔧 Attempting to solve CAPTCHA with 2captcha...');

      // Solve in main frame (using type guard)
      if (isPageWithCaptcha(page)) {
        const result = await page.solveRecaptchas();

        // Log results (result structure from plugin)
        const resultAny: CaptchaResult = result as unknown as CaptchaResult;

        if (resultAny && resultAny.solved && Array.isArray(resultAny.solved)) {
          const solvedCount = resultAny.solved.length;
          if (solvedCount > 0) {
            this.logger.log(`✅ CAPTCHA solved! Count: ${solvedCount}`);

            this.logger.debug(
              `Solutions: ${JSON.stringify(resultAny.solutions)}`,
            );
          } else {
            this.logger.warn(
              '⚠️  No CAPTCHAs were solved (may not be present)',
            );
          }
        } else {
          this.logger.warn('⚠️  No CAPTCHAs were solved (may not be present)');
        }
      }

      // Solve in child frames
      this.logger.debug('Checking child frames for CAPTCHAs...');
      const childFrames = page.mainFrame().childFrames();
      for (const frame of childFrames) {
        try {
          if (isFrameWithCaptcha(frame)) {
            await frame.solveRecaptchas();
          }
        } catch (_frameError) {
          // Non-critical, continue
        }
      }

      await delay(5000);
    } catch (error) {
      this.logger.error('❌ Failed to solve CAPTCHA:', error);
      this.logger.warn('Waiting for manual resolution (15s)...');
      await delay(15000);
    }
  }
}
