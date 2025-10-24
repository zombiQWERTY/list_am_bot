import { FactoryProvider } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';

import { MetricEntityDto } from '@list-am-bot/infrastructure/database/typeorm/entity-dtos/metric.entity.dto';

export const MetricProviderToken = Symbol('MetricProvider');

export const metricProvider: FactoryProvider<Repository<MetricEntityDto>> = {
  provide: MetricProviderToken,
  useFactory: (dataSource: DataSource): Repository<MetricEntityDto> =>
    dataSource.getRepository(MetricEntityDto),
  inject: [DataSource],
};
