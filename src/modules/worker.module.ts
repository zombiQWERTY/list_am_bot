import { Module } from '@nestjs/common';

import { NotificationService } from '@list-am-bot/application/notification/notification.service';
import { ScrapeQueueService } from '@list-am-bot/application/scheduler/scrape-queue.service';
import { ScrapeWorkerService } from '@list-am-bot/application/scheduler/scrape-worker.service';
import { TypeOrmDatabaseModule } from '@list-am-bot/infrastructure/database/typeorm/typeorm-database.module';
import { MonitoringModule } from '@list-am-bot/modules/monitoring.module';
import { ScraperModule } from '@list-am-bot/modules/scraper.module';
import { SubscriptionModule } from '@list-am-bot/modules/subscription.module';
import { UserModule } from '@list-am-bot/modules/user.module';

@Module({
  imports: [
    UserModule,
    SubscriptionModule,
    ScraperModule,
    TypeOrmDatabaseModule,
    MonitoringModule,
  ],
  providers: [ScrapeQueueService, ScrapeWorkerService, NotificationService],
  exports: [ScrapeWorkerService, ScrapeQueueService],
})
export class WorkerModule {}
