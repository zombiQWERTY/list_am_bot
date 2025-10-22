import { FactoryProvider } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';

import { SeenListingEntityDto } from '@list-am-bot/infrastructure/database/typeorm/entity-dtos/seen-listing.entity.dto';

export const SeenListingProviderToken = Symbol('SeenListingProvider');

export const seenListingProvider: FactoryProvider<
  Repository<SeenListingEntityDto>
> = {
  provide: SeenListingProviderToken,
  useFactory: (dataSource: DataSource): Repository<SeenListingEntityDto> =>
    dataSource.getRepository(SeenListingEntityDto),
  inject: [DataSource],
};
