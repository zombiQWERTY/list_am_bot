import { Module } from '@nestjs/common';

import { TypeOrmDatabaseModule } from '@list-am-bot/infrastructure/database/typeorm/typeorm-database.module';
import { BrowserService } from '@list-am-bot/infrastructure/scraper/browser/browser.service';
import { CaptchaService } from '@list-am-bot/infrastructure/scraper/browser/captcha.service';
import { CloudflareChallengeService } from '@list-am-bot/infrastructure/scraper/browser/cloudflare-challenge.service';
import { HumanBehaviorService } from '@list-am-bot/infrastructure/scraper/browser/human-behavior.service';
import { SessionService } from '@list-am-bot/infrastructure/scraper/browser/session.service';
import { StealthService } from '@list-am-bot/infrastructure/scraper/browser/stealth.service';
import { ParserService } from '@list-am-bot/infrastructure/scraper/parser.service';
import { ScraperService } from '@list-am-bot/infrastructure/scraper/scraper.service';
import { ErrorClassifierService } from '@list-am-bot/infrastructure/scraper/proxy/error-classifier.service';
import { IpCheckerService } from '@list-am-bot/infrastructure/scraper/proxy/ip-checker.service';
import { ProxyManagerService } from '@list-am-bot/infrastructure/scraper/proxy/proxy-manager.service';

@Module({
  imports: [TypeOrmDatabaseModule],
  providers: [
    // Browser services (refactored)
    BrowserService,
    StealthService,
    SessionService,
    HumanBehaviorService,
    CaptchaService,
    CloudflareChallengeService,
    // Proxy services
    ProxyManagerService,
    IpCheckerService,
    ErrorClassifierService,
    // Scraper services
    ParserService,
    ScraperService,
  ],
  exports: [ScraperService],
})
export class ScraperModule {}
