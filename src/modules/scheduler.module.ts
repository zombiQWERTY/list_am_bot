import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

import { ScrapeWorkerService } from '@list-am-bot/application/scheduler/scrape-worker.service';
import { SchedulerService } from '@list-am-bot/infrastructure/scheduler/scheduler.service';
import { BotModule } from '@list-am-bot/modules/bot.module';
import { ScraperModule } from '@list-am-bot/modules/scraper.module';
import { SubscriptionModule } from '@list-am-bot/modules/subscription.module';
import { UserModule } from '@list-am-bot/modules/user.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    UserModule,
    SubscriptionModule,
    ScraperModule,
    BotModule,
  ],
  providers: [ScrapeWorkerService, SchedulerService],
  exports: [ScrapeWorkerService],
})
export class SchedulerAppModule {}
