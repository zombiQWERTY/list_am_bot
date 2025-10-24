import { Injectable, Logger, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectBot } from 'nestjs-telegraf';
import { Context, Telegraf } from 'telegraf';

import { MetricsService } from '@list-am-bot/application/monitoring/metrics.service';
import { LIST_AM_BOT } from '@list-am-bot/constants';
import { MetricType } from '@list-am-bot/domain/metric/metric.entity';
import {
  MetricRepositoryPort,
  IMetricRepository,
} from '@list-am-bot/domain/metric/ports/metric.repository.port';

interface MetricsSummary {
  period: string;
  avgScrapeDuration: number;
  notificationSuccessRate: number;
  totalNotifications: number;
  avgQueueSize: number;
  avgActiveSubscriptions: number;
}

@Injectable()
export class MetricsReportService {
  private readonly logger = new Logger(MetricsReportService.name);
  private readonly adminUserId: number | null;

  constructor(
    @InjectBot(LIST_AM_BOT)
    private readonly bot: Telegraf<Context>,
    private readonly metricsService: MetricsService,
    @Inject(MetricRepositoryPort)
    private readonly metricRepository: IMetricRepository,
    private readonly configService: ConfigService,
  ) {
    this.adminUserId =
      this.configService.get<number>('bot.botIncidentsUserId') ?? null;

    if (!this.adminUserId) {
      this.logger.warn(
        'BOT_INCIDENTS_USER_ID not configured. Daily metrics reports will not be sent.',
      );
    }
  }

  async sendDailyReport(): Promise<void> {
    if (!this.adminUserId) {
      this.logger.debug('Admin user ID not configured, skipping daily report');
      return;
    }

    try {
      this.logger.debug('Generating daily metrics report...');

      const now = new Date();
      const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const [dailySummary, weeklySummary, monthlySummary] = await Promise.all([
        this.getMetricsSummary(dayAgo),
        this.getMetricsSummary(weekAgo),
        this.getMetricsSummary(monthAgo),
      ]);

      const report = this.formatReport(
        dailySummary,
        weeklySummary,
        monthlySummary,
      );

      await this.bot.telegram.sendMessage(this.adminUserId, report, {
        parse_mode: 'HTML',
      });

      this.logger.debug('Daily metrics report sent successfully');
    } catch (error) {
      this.logger.error(
        `Failed to send daily metrics report: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  private async getMetricsSummary(since: Date): Promise<MetricsSummary> {
    const [
      avgScrapeDuration,
      successRate,
      successMetrics,
      failureMetrics,
      queueMetrics,
      subscriptionMetrics,
    ] = await Promise.all([
      this.metricRepository.getAverageByType(MetricType.SCRAPE_DURATION, since),
      this.metricsService.getNotificationSuccessRate(since),
      this.metricRepository.findByType(MetricType.NOTIFICATION_SUCCESS, 10000),
      this.metricRepository.findByType(MetricType.NOTIFICATION_FAILURE, 10000),
      this.metricRepository.findByType(MetricType.QUEUE_SIZE, 10000),
      this.metricRepository.findByType(MetricType.ACTIVE_SUBSCRIPTIONS, 10000),
    ]);

    const filteredSuccess = successMetrics.filter(
      (m): boolean => m.createdAt >= since,
    );
    const filteredFailure = failureMetrics.filter(
      (m): boolean => m.createdAt >= since,
    );
    const totalNotifications = filteredSuccess.length + filteredFailure.length;

    const filteredQueue = queueMetrics.filter(
      (m): boolean => m.createdAt >= since,
    );
    const avgQueueSize =
      filteredQueue.length > 0
        ? filteredQueue.reduce((sum, m): number => sum + m.value, 0) /
          filteredQueue.length
        : 0;

    const filteredSubscriptions = subscriptionMetrics.filter(
      (m): boolean => m.createdAt >= since,
    );
    const avgActiveSubscriptions =
      filteredSubscriptions.length > 0
        ? filteredSubscriptions.reduce((sum, m): number => sum + m.value, 0) /
          filteredSubscriptions.length
        : 0;

    const daysAgo = Math.floor(
      (Date.now() - since.getTime()) / (24 * 60 * 60 * 1000),
    );
    let period: string;
    if (daysAgo === 1) {
      period = '24 hours';
    } else if (daysAgo === 7) {
      period = '7 days';
    } else if (daysAgo >= 28 && daysAgo <= 31) {
      period = '30 days';
    } else {
      period = `${daysAgo} days`;
    }

    return {
      period,
      avgScrapeDuration: Math.round(avgScrapeDuration),
      notificationSuccessRate: Math.round(successRate * 10) / 10,
      totalNotifications,
      avgQueueSize: Math.round(avgQueueSize * 10) / 10,
      avgActiveSubscriptions: Math.round(avgActiveSubscriptions),
    };
  }

  private formatReport(
    daily: MetricsSummary,
    weekly: MetricsSummary,
    monthly: MetricsSummary,
  ): string {
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    return `
📊 <b>List.am Bot - Metrics Report</b>
📅 ${dateStr}

━━━━━━━━━━━━━━━━━━━━━━━━
<b>📆 Last 24 Hours</b>
━━━━━━━━━━━━━━━━━━━━━━━━

⏱ <b>Avg Scrape Duration:</b> ${daily.avgScrapeDuration}ms
📬 <b>Notifications:</b> ${daily.totalNotifications} (${daily.notificationSuccessRate}% success)
📋 <b>Avg Queue Size:</b> ${daily.avgQueueSize}
📝 <b>Avg Active Subs:</b> ${daily.avgActiveSubscriptions}

━━━━━━━━━━━━━━━━━━━━━━━━
<b>📅 Last 7 Days</b>
━━━━━━━━━━━━━━━━━━━━━━━━

⏱ <b>Avg Scrape Duration:</b> ${weekly.avgScrapeDuration}ms
📬 <b>Notifications:</b> ${weekly.totalNotifications} (${weekly.notificationSuccessRate}% success)
📋 <b>Avg Queue Size:</b> ${weekly.avgQueueSize}
📝 <b>Avg Active Subs:</b> ${weekly.avgActiveSubscriptions}

━━━━━━━━━━━━━━━━━━━━━━━━
<b>📊 Last 30 Days</b>
━━━━━━━━━━━━━━━━━━━━━━━━

⏱ <b>Avg Scrape Duration:</b> ${monthly.avgScrapeDuration}ms
📬 <b>Notifications:</b> ${monthly.totalNotifications} (${monthly.notificationSuccessRate}% success)
📋 <b>Avg Queue Size:</b> ${monthly.avgQueueSize}
📝 <b>Avg Active Subs:</b> ${monthly.avgActiveSubscriptions}

━━━━━━━━━━━━━━━━━━━━━━━━
🤖 <i>Automated daily report</i>
`.trim();
  }
}
