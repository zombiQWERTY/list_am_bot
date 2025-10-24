import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import { ScrapeWorkerService } from '@list-am-bot/application/scheduler/scrape-worker.service';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(private readonly scrapeWorker: ScrapeWorkerService) {
    this.logger.debug(`Scheduler initialized with pattern: 0 * * * *`);
  }

  @Cron('0 * * * *')
  handleCron(): void {
    this.logger.debug('Cron job triggered');
    this.scrapeWorker.runCycle();
  }
}
