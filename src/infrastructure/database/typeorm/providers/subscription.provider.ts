import { FactoryProvider } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';

import { SubscriptionEntityDto } from '@list-am-bot/infrastructure/database/typeorm/entity-dtos/subscription.entity.dto';

export const SubscriptionProviderToken = Symbol('SubscriptionProvider');

export const subscriptionProvider: FactoryProvider<
  Repository<SubscriptionEntityDto>
> = {
  provide: SubscriptionProviderToken,
  useFactory: (dataSource: DataSource): Repository<SubscriptionEntityDto> =>
    dataSource.getRepository(SubscriptionEntityDto),
  inject: [DataSource],
};
