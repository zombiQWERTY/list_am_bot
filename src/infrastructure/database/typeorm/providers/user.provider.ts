import { FactoryProvider } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';

import { UserEntityDto } from '@list-am-bot/infrastructure/database/typeorm/entity-dtos/user.entity.dto';

export const UserProviderToken = Symbol('UserProvider');

export const userProvider: FactoryProvider<Repository<UserEntityDto>> = {
  provide: UserProviderToken,
  useFactory: (dataSource: DataSource): Repository<UserEntityDto> =>
    dataSource.getRepository(UserEntityDto),
  inject: [DataSource],
};
