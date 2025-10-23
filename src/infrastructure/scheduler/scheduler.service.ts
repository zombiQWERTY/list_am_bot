import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';

import { ScrapeWorkerService } from '@list-am-bot/application/scheduler/scrape-worker.service';

@Injectable()
export class SchedulerService {
  constructor(
    private readonly scrapeWorker: ScrapeWorkerService,
    private readonly configService: ConfigService,
  ) {
    // eslint-disable-next-line no-console
    console.log(
      `Scheduler initialized with pattern: ${this.configService.get<string>('cronSchedule', '0 * * * *')}`,
    );
  }

  @Cron('0 * * * *')
  handleCron(): void {
    // eslint-disable-next-line no-console
    console.log('Cron job triggered');
    this.scrapeWorker.runCycle();
  }
}
