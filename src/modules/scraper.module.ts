import { Module } from '@nestjs/common';

import { TypeOrmDatabaseModule } from '@list-am-bot/infrastructure/database/typeorm/typeorm-database.module';
import { FlaresolvrrService } from '@list-am-bot/infrastructure/scraper/flaresolverr.service';
import { ParserService } from '@list-am-bot/infrastructure/scraper/parser.service';
import { ScraperService } from '@list-am-bot/infrastructure/scraper/scraper.service';

@Module({
  imports: [TypeOrmDatabaseModule],
  providers: [FlaresolvrrService, ParserService, ScraperService],
  exports: [ScraperService],
})
export class ScraperModule {}
