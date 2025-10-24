export enum MetricType {
  SCRAPE_DURATION = 'scrape_duration',
  NOTIFICATION_SUCCESS = 'notification_success',
  NOTIFICATION_FAILURE = 'notification_failure',
  QUEUE_SIZE = 'queue_size',
  ACTIVE_SUBSCRIPTIONS = 'active_subscriptions',
}

export class MetricEntity {
  id: number;
  type: MetricType;
  value: number;
  metadata?: Record<string, unknown>;
  createdAt: Date;

  constructor(data: MetricEntity) {
    Object.assign(this, data);
  }
}
