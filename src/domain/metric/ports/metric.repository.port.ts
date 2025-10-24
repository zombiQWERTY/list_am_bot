import {
  MetricEntity,
  MetricType,
} from '@list-am-bot/domain/metric/metric.entity';

export const MetricRepositoryPort = 'IMetricRepository';

export interface IMetricRepository {
  create(
    type: MetricType,
    value: number,
    metadata?: Record<string, unknown>,
  ): Promise<MetricEntity>;

  findByType(type: MetricType, limit?: number): Promise<MetricEntity[]>;

  findRecent(limit: number): Promise<MetricEntity[]>;

  getAverageByType(type: MetricType, since?: Date): Promise<number>;
}
