import { readFileSync, writeFileSync } from 'fs';

import { Injectable, Logger } from '@nestjs/common';
import type { Page, Cookie } from 'puppeteer';

interface SessionData {
  cookies: Cookie[];
  localStorage: Record<string, string>;
}

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);
  private readonly sessionFile = '/tmp/list-am-session.json';

  async loadSession(page: Page): Promise<void> {
    try {
      const sessionData: SessionData = JSON.parse(
        readFileSync(this.sessionFile, 'utf-8'),
      ) as SessionData;

      // Set cookies
      if (sessionData.cookies && sessionData.cookies.length > 0) {
        await page.setCookie(...sessionData.cookies);
        this.logger.debug(
          `Loaded ${sessionData.cookies.length} cookies from session`,
        );
      }

      // Set localStorage
      if (sessionData.localStorage) {
        await page.evaluateOnNewDocument((data): void => {
          for (const [key, value] of Object.entries(data)) {
            localStorage.setItem(key, value);
          }
        }, sessionData.localStorage);
        this.logger.debug('Loaded localStorage from session');
      }
    } catch (_error) {
      this.logger.debug('No session data found, starting fresh');
    }
  }

  async saveSession(page: Page): Promise<void> {
    try {
      const cookies = await page.cookies();
      const localStorage = await page.evaluate((): Record<string, string> => {
        const data: Record<string, string> = {};
        for (let i = 0; i < window.localStorage.length; i++) {
          const key = window.localStorage.key(i);
          if (key) {
            const value = window.localStorage.getItem(key);
            if (value) {
              data[key] = value;
            }
          }
        }
        return data;
      });

      const sessionData: SessionData = { cookies, localStorage };
      writeFileSync(this.sessionFile, JSON.stringify(sessionData, null, 2));
      this.logger.debug('Session data saved for reuse');
    } catch (error) {
      this.logger.warn('Failed to save session data:', error);
    }
  }
}
