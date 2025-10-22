import { existsSync } from 'fs';

import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import type { Page } from 'puppeteer';
import puppeteer from 'puppeteer-extra';

import { delay } from '@list-am-bot/common/utils/delay.util';
import {
  buildBrowserLaunchOptions,
  CHROMIUM_PATH,
  type BrowserInstance,
} from '@list-am-bot/infrastructure/scraper/browser/browser.config';
import { CaptchaService } from '@list-am-bot/infrastructure/scraper/browser/captcha.service';
import { CloudflareChallengeService } from '@list-am-bot/infrastructure/scraper/browser/cloudflare-challenge.service';
import { HumanBehaviorService } from '@list-am-bot/infrastructure/scraper/browser/human-behavior.service';
import { SessionService } from '@list-am-bot/infrastructure/scraper/browser/session.service';
import { StealthService } from '@list-am-bot/infrastructure/scraper/browser/stealth.service';
import { ErrorClassifierService } from '@list-am-bot/infrastructure/scraper/proxy/error-classifier.service';
import { IpCheckerService } from '@list-am-bot/infrastructure/scraper/proxy/ip-checker.service';
import { ProxyManagerService } from '@list-am-bot/infrastructure/scraper/proxy/proxy-manager.service';
import {
  calculateBackoffDelay,
  PROXY_CONFIG,
} from '@list-am-bot/infrastructure/scraper/proxy/proxy.config';
import type { ProxyDescriptor } from '@list-am-bot/infrastructure/scraper/proxy/proxy.types';
import {
  ErrorType,
  SessionType,
} from '@list-am-bot/infrastructure/scraper/proxy/proxy.types';

@Injectable()
export class BrowserService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(BrowserService.name);
  private browserInstance: BrowserInstance | null = null;
  private isInitializing = false;
  private currentProxy: ProxyDescriptor | null = null;
  private currentSessionId: string | null = null;

  constructor(
    private readonly stealthService: StealthService,
    private readonly sessionService: SessionService,
    private readonly humanBehaviorService: HumanBehaviorService,
    private readonly captchaService: CaptchaService,
    private readonly cloudflareService: CloudflareChallengeService,
    private readonly proxyManager: ProxyManagerService,
    private readonly ipChecker: IpCheckerService,
    private readonly errorClassifier: ErrorClassifierService,
  ) {}

  async onModuleInit(): Promise<void> {
    // Browser will be initialized on first use
  }

  async onModuleDestroy(): Promise<void> {
    // Release current session if any
    if (this.currentSessionId) {
      this.proxyManager.releaseStickyProxy(this.currentSessionId);
      this.currentSessionId = null;
    }

    await this.closeBrowser();
  }

  async fetchHtml(
    url: string,
    sessionType: SessionType = SessionType.READ_ONLY,
  ): Promise<string> {
    const maxRetries = PROXY_CONFIG.retry.maxAttempts;
    let lastError: Error | null = null;

    this.logger.debug(`Fetching URL: ${url} (session type: ${sessionType})`);

    // Generate session ID for sticky proxy
    const sessionId = `session-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    this.currentSessionId = sessionId;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          this.logger.warn(`Retry attempt ${attempt + 1}/${maxRetries}`);
          const backoffDelay = calculateBackoffDelay(attempt - 1);
          await delay(backoffDelay);
        }

        // Get sticky proxy for this session
        const proxy = await this.proxyManager.getStickyProxy(
          sessionId,
          sessionType,
        );

        // Check if we need to rotate proxy or recreate browser
        if (!this.currentProxy || this.currentProxy.id !== proxy.id) {
          await this.closeBrowser();
          this.currentProxy = proxy;
        }

        this.proxyManager.incrementProxyQueue(proxy.id);

        try {
          const instance = await this.getBrowserInstance(proxy);
          const { page } = instance;

          // Try to verify proxy IP (non-critical)
          try {
            const actualIp = await this.ipChecker.verifyProxyIp(page);
            this.proxyManager.updateSessionIp(sessionId, actualIp);
          } catch (ipError: unknown) {
            const errorMessage =
              ipError instanceof Error ? ipError.message : String(ipError);
            this.logger.warn(
              `⚠️  Could not verify proxy IP (non-critical): ${errorMessage}`,
            );
            // Continue anyway - IP verification is optional
          }

          // Setup page with human-like behavior
          await this.humanBehaviorService.setupPageForHuman(page);

          // Load saved session
          await this.sessionService.loadSession(page);

          // Navigate to URL
          await this.navigateToUrl(page, url);

          // Give page time to fully load before checking for Cloudflare
          this.logger.debug('Waiting for page stabilization (5s)...');
          await delay(5000);

          // Handle Cloudflare challenge if present (single comprehensive check)
          await this.cloudflareService.handleChallenge(page);

          // Simulate human behavior after challenge
          await this.humanBehaviorService.simulateBehavior(page);

          // Check for CAPTCHA
          const recaptchaPlugin = this.stealthService.getRecaptchaPlugin();
          await this.captchaService.detectAndHandleCaptcha(
            page,
            recaptchaPlugin,
          );

          // Wait for page to fully render
          this.logger.debug('Waiting for page to fully render (3s)...');
          await delay(3000);

          // Take debug screenshot
          await this.takeDebugScreenshot(page);

          // Get HTML content
          const html = await page.content();
          const finalTitle = await page.title();
          this.logger.debug(`HTML fetched: ${html.length} bytes`);
          this.logger.debug(`Final title: "${finalTitle}"`);

          // Verify challenge is resolved (soft check)
          const challengeResolved =
            await this.cloudflareService.verifyChallengeResolved(page);

          if (!challengeResolved) {
            // If challenge not resolved but we got HTML, try to continue
            if (html.length < 5000) {
              // Likely still on challenge page, throw error
              throw new Error('Cloudflare challenge not resolved');
            }
            // Otherwise, we might have content, log warning and continue
            this.logger.warn(
              '⚠️  Challenge verification uncertain, but have content - proceeding',
            );
          }

          // Save session for next time
          await this.sessionService.saveSession(page);

          // Check if session should rotate
          if (this.proxyManager.shouldRotateSession(sessionId)) {
            this.logger.log(
              'Session rotation scheduled, performing handoff...',
            );
            await this.proxyManager.performGracefulHandoff(
              sessionId,
              sessionType,
            );
          }

          return html;
        } finally {
          this.proxyManager.decrementProxyQueue(proxy.id);
        }
      } catch (error: unknown) {
        const err = error instanceof Error ? error : new Error(String(error));
        lastError = err;
        const errorInfo = this.errorClassifier.classifyError(err);

        this.logger.error(
          `Attempt ${attempt + 1} failed: ${this.errorClassifier.normalizeError(err)}`,
        );

        // Handle error based on classification
        if (errorInfo.type === ErrorType.PROXY_RELATED && this.currentProxy) {
          this.proxyManager.markUnhealthy(
            this.currentProxy.id,
            errorInfo.originalError.message,
          );
          // Force new proxy on next attempt
          await this.closeBrowser();
          this.currentProxy = null;
        } else if (errorInfo.type === ErrorType.FATAL) {
          this.logger.error('Fatal error detected, not retrying');
          break;
        }

        // Close and recreate browser on error
        await this.closeBrowser();

        if (attempt === maxRetries - 1) {
          break;
        }
      }
    }

    // Cleanup session
    if (this.currentSessionId) {
      this.proxyManager.releaseStickyProxy(this.currentSessionId);
      this.currentSessionId = null;
    }

    throw new Error(
      `Failed to fetch ${url} after ${maxRetries} attempts: ${lastError?.message}`,
    );
  }

  private async navigateToUrl(page: Page, url: string): Promise<void> {
    this.logger.debug(`Navigating to ${url}...`);
    try {
      await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });
      this.logger.debug('Navigation successful');
    } catch (_error) {
      this.logger.warn('Trying with "load" strategy');
      await page.goto(url, {
        waitUntil: 'load',
        timeout: 30000,
      });
    }

    const finalUrl = page.url();
    this.logger.debug(`Final URL: ${finalUrl}`);
  }

  private async takeDebugScreenshot(page: Page): Promise<void> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const screenshotPath = `/tmp/list-am-${timestamp}.png` as const;
      await page.screenshot({ path: screenshotPath, fullPage: true });
      this.logger.debug(`Screenshot saved: ${screenshotPath}`);
    } catch (error) {
      this.logger.warn('Failed to take screenshot:', error);
    }
  }

  private async getBrowserInstance(
    proxy: ProxyDescriptor,
  ): Promise<BrowserInstance> {
    if (this.browserInstance) {
      return this.browserInstance;
    }

    // Prevent concurrent initializations
    while (this.isInitializing) {
      await delay(100);
    }

    if (this.browserInstance) {
      return this.browserInstance;
    }

    this.isInitializing = true;

    try {
      // Apply stealth plugins
      await this.stealthService.applyStealthPlugins();

      this.logger.log(`Initializing browser at: ${CHROMIUM_PATH}`);

      if (!existsSync(CHROMIUM_PATH)) {
        throw new Error(`Chromium not found at: ${CHROMIUM_PATH}`);
      }

      this.logger.log(
        `🌐 Using residential proxy: ${proxy.id} (${proxy.host}:${proxy.port})`,
      );

      // Build launch options with proxy URL
      const launchOptions = buildBrowserLaunchOptions(proxy.proxyUrl);
      const browser = await puppeteer.launch(launchOptions);
      const page = await browser.newPage();

      // Authenticate with proxy (basic auth)
      // This handles both HTTP auth and proxy auth
      await page.authenticate({
        username: proxy.username,
        password: proxy.password,
      });

      this.logger.debug(
        `Proxy authentication set: ${proxy.username.substring(0, 10)}...`,
      );

      // Set realistic viewport
      await page.setViewport({
        width: 1366,
        height: 768,
      });

      // Set user agent
      const userAgent =
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
      await page.setUserAgent(userAgent);

      // Set default navigation timeout
      page.setDefaultNavigationTimeout(30000);

      // Override navigator properties for stealth
      await this.stealthService.overrideNavigatorProperties(page);

      this.browserInstance = { browser, page };
      this.logger.log('✅ Browser instance created successfully');

      return this.browserInstance;
    } catch (error) {
      this.logger.error('Failed to initialize browser:', error);
      throw error;
    } finally {
      this.isInitializing = false;
    }
  }

  private async closeBrowser(): Promise<void> {
    if (this.browserInstance) {
      try {
        this.logger.debug('Closing browser...');
        await this.browserInstance.browser.close();
        this.logger.debug('Browser closed');
      } catch (error) {
        this.logger.error('Error closing browser:', error);
      } finally {
        this.browserInstance = null;
      }
    }
  }
}
