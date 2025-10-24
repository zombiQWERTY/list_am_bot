import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { MetricsReportService } from '@list-am-bot/application/monitoring/metrics-report.service';

@Injectable()
export class MetricsReportSchedulerService {
  private readonly logger = new Logger(MetricsReportSchedulerService.name);

  constructor(private readonly metricsReportService: MetricsReportService) {}

  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async handleDailyReport(): Promise<void> {
    this.logger.debug('Executing daily metrics report cron job...');

    try {
      await this.metricsReportService.sendDailyReport();
      this.logger.debug('Daily metrics report cron job completed');
    } catch (error) {
      this.logger.error(
        `Daily metrics report cron job failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}
