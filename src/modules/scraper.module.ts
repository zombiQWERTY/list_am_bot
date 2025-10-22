import { Module } from '@nestjs/common';

import { TypeOrmDatabaseModule } from '@list-am-bot/infrastructure/database/typeorm/typeorm-database.module';
import { FlaresolvrrService } from '@list-am-bot/infrastructure/scraper/flaresolverr/flaresolverr.service';
import { ParserService } from '@list-am-bot/infrastructure/scraper/parser.service';
import { ProxyManagerService } from '@list-am-bot/infrastructure/scraper/proxy/proxy-manager.service';
import { ScraperService } from '@list-am-bot/infrastructure/scraper/scraper.service';

@Module({
  imports: [TypeOrmDatabaseModule],
  providers: [
    // Cloudflare bypass via FlareSolverr
    FlaresolvrrService,
    // Proxy management
    ProxyManagerService,
    // HTML parsing
    ParserService,
    // Main scraper service
    ScraperService,
  ],
  exports: [ScraperService],
})
export class ScraperModule {}
