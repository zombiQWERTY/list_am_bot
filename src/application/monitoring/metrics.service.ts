import { Injectable, Inject, Logger } from '@nestjs/common';

import { MetricType } from '@list-am-bot/domain/metric/metric.entity';
import {
  MetricRepositoryPort,
  IMetricRepository,
} from '@list-am-bot/domain/metric/ports/metric.repository.port';

@Injectable()
export class MetricsService {
  private readonly logger = new Logger(MetricsService.name);

  constructor(
    @Inject(MetricRepositoryPort)
    private readonly metricRepository: IMetricRepository,
  ) {}

  async recordScrapeDuration(durationMs: number, query: string): Promise<void> {
    try {
      await this.metricRepository.create(
        MetricType.SCRAPE_DURATION,
        durationMs,
        { query },
      );
    } catch (error) {
      this.logger.error(
        `Failed to record scrape duration: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async recordNotificationSuccess(
    userId: number,
    listingId: string,
  ): Promise<void> {
    try {
      await this.metricRepository.create(MetricType.NOTIFICATION_SUCCESS, 1, {
        userId,
        listingId,
      });
    } catch (error) {
      this.logger.error(
        `Failed to record notification success: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async recordNotificationFailure(
    userId: number,
    listingId: string,
    reason: string,
  ): Promise<void> {
    try {
      await this.metricRepository.create(MetricType.NOTIFICATION_FAILURE, 1, {
        userId,
        listingId,
        reason,
      });
    } catch (error) {
      this.logger.error(
        `Failed to record notification failure: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async recordQueueSize(size: number): Promise<void> {
    try {
      await this.metricRepository.create(MetricType.QUEUE_SIZE, size);
    } catch (error) {
      this.logger.error(
        `Failed to record queue size: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async recordActiveSubscriptions(count: number): Promise<void> {
    try {
      await this.metricRepository.create(
        MetricType.ACTIVE_SUBSCRIPTIONS,
        count,
      );
    } catch (error) {
      this.logger.error(
        `Failed to record active subscriptions: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async getAverageScrapeDuration(since?: Date): Promise<number> {
    return this.metricRepository.getAverageByType(
      MetricType.SCRAPE_DURATION,
      since,
    );
  }

  async getNotificationSuccessRate(since?: Date): Promise<number> {
    const [successMetrics, failureMetrics] = await Promise.all([
      this.metricRepository.findByType(MetricType.NOTIFICATION_SUCCESS, 1000),
      this.metricRepository.findByType(MetricType.NOTIFICATION_FAILURE, 1000),
    ]);

    const filteredSuccess = since
      ? successMetrics.filter((m): boolean => m.createdAt >= since)
      : successMetrics;

    const filteredFailure = since
      ? failureMetrics.filter((m): boolean => m.createdAt >= since)
      : failureMetrics;

    const total = filteredSuccess.length + filteredFailure.length;
    return total > 0 ? (filteredSuccess.length / total) * 100 : 0;
  }
}
