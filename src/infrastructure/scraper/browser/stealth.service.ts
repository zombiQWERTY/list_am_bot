import { Injectable, Logger } from '@nestjs/common';
import type { Page } from 'puppeteer';
import puppeteer from 'puppeteer-extra';

import type {
  AdblockerPluginConstructor,
  RecaptchaPluginConstructor,
  StealthPluginConstructor,
} from '@list-am-bot/infrastructure/scraper/browser/browser.types';

// Will be loaded dynamically
let RecaptchaPlugin: RecaptchaPluginConstructor | null = null;
let AdblockerPlugin: AdblockerPluginConstructor | null = null;

@Injectable()
export class StealthService {
  private readonly logger = new Logger(StealthService.name);
  private pluginsApplied = false;

  async applyStealthPlugins(): Promise<void> {
    if (this.pluginsApplied) {
      this.logger.debug('Stealth plugins already applied, skipping');
      return;
    }

    try {
      // 1. Stealth Plugin
      await this.loadStealthPlugin();

      // 2. Adblocker Plugin
      await this.loadAdblockerPlugin();

      // 3. reCAPTCHA Plugin
      await this.loadRecaptchaPlugin();

      this.pluginsApplied = true;
      this.logger.log('✅ All stealth plugins applied successfully');
    } catch (error) {
      this.logger.error('❌ Failed to apply stealth plugins:', error);
      throw error;
    }
  }

  private async loadStealthPlugin(): Promise<void> {
    this.logger.debug('Loading stealth plugin...');
    const StealthPluginModule = await import('puppeteer-extra-plugin-stealth');

    const StealthPluginFn = (StealthPluginModule.default ||
      StealthPluginModule) as StealthPluginConstructor;

    const stealthPlugin = StealthPluginFn() as ReturnType<
      typeof StealthPluginModule.default
    >;
    puppeteer.use(stealthPlugin);
    this.logger.log('✅ Stealth plugin configured');
  }

  private async loadAdblockerPlugin(): Promise<void> {
    try {
      this.logger.debug('Loading adblocker plugin...');
      const AdblockerPluginModule = await import(
        'puppeteer-extra-plugin-adblocker'
      );
      AdblockerPlugin = (AdblockerPluginModule.default ||
        AdblockerPluginModule) as AdblockerPluginConstructor;

      const adblockerPlugin = AdblockerPlugin({
        blockTrackers: true,
      }) as ReturnType<typeof AdblockerPluginModule.default>;

      puppeteer.use(adblockerPlugin);
      this.logger.log('✅ Adblocker plugin configured');
    } catch (error) {
      this.logger.warn(
        'Failed to load adblocker plugin (non-critical):',
        error,
      );
    }
  }

  private async loadRecaptchaPlugin(): Promise<void> {
    const captchaApiKey = process.env.CAPTCHA_API_KEY;
    if (!captchaApiKey) {
      this.logger.debug('No CAPTCHA API key configured, skipping');
      return;
    }

    try {
      this.logger.debug('Loading reCAPTCHA plugin...');
      const RecaptchaPluginModule = await import(
        'puppeteer-extra-plugin-recaptcha'
      );

      RecaptchaPlugin = (RecaptchaPluginModule.default ||
        RecaptchaPluginModule) as RecaptchaPluginConstructor;

      const recaptchaPlugin = RecaptchaPlugin({
        provider: {
          id: '2captcha',
          token: captchaApiKey,
        },
        visualFeedback: true,
      }) as ReturnType<typeof RecaptchaPluginModule.default>;

      puppeteer.use(recaptchaPlugin);
      this.logger.log('✅ reCAPTCHA plugin configured with 2captcha');
    } catch (error) {
      this.logger.warn(
        'Failed to load reCAPTCHA plugin (non-critical):',
        error,
      );
    }
  }

  async overrideNavigatorProperties(page: Page): Promise<void> {
    await page.evaluateOnNewDocument((): void => {
      // Remove webdriver property
      Object.defineProperty(navigator, 'webdriver', {
        get: (): boolean => false,
      });

      // Mock plugins
      Object.defineProperty(navigator, 'plugins', {
        get: (): number[] => [1, 2, 3, 4, 5],
      });

      // Mock languages
      Object.defineProperty(navigator, 'languages', {
        get: (): string[] => ['ru-RU', 'ru', 'en-US', 'en'],
      });

      // Chrome runtime
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
      (window as any).chrome = {
        runtime: {},
      };

      // Permissions override
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const originalQuery = window.navigator.permissions.query.bind(
        window.navigator.permissions,
      );
      window.navigator.permissions.query = function (
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        parameters: any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ): Promise<any> {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if (parameters.name === 'notifications') {
          return Promise.resolve({
            state: Notification.permission,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } as any);
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
        return originalQuery(parameters);
      };
    });

    this.logger.debug('Navigator properties overridden for stealth');
  }

  getRecaptchaPlugin(): RecaptchaPluginConstructor | null {
    return RecaptchaPlugin;
  }
}
