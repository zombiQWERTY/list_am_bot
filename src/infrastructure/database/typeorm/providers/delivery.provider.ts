import { FactoryProvider } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';

import { DeliveryEntityDto } from '@list-am-bot/infrastructure/database/typeorm/entity-dtos/delivery.entity.dto';

export const DeliveryProviderToken = Symbol('DeliveryProvider');

export const deliveryProvider: FactoryProvider<Repository<DeliveryEntityDto>> =
  {
    provide: DeliveryProviderToken,
    useFactory: (dataSource: DataSource): Repository<DeliveryEntityDto> =>
      dataSource.getRepository(DeliveryEntityDto),
    inject: [DataSource],
  };
