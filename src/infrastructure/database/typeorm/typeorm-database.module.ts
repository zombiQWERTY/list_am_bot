import { Module } from '@nestjs/common';
import { TypeOrmModule as NestTypeOrmModule } from '@nestjs/typeorm';

import { DeliveryRepositoryPort } from '@list-am-bot/domain/delivery/ports/delivery.repository.port';
import { SeenListingRepositoryPort } from '@list-am-bot/domain/seen-listing/ports/seen-listing.repository.port';
import { SubscriptionRepositoryPort } from '@list-am-bot/domain/subscription/ports/subscription.repository.port';
import { UserRepositoryPort } from '@list-am-bot/domain/user/ports/user.repository.port';
import { databaseProvider } from '@list-am-bot/infrastructure/database/database.provider';
import { DeliveryEntityDto } from '@list-am-bot/infrastructure/database/typeorm/entity-dtos/delivery.entity.dto';
import { SeenListingEntityDto } from '@list-am-bot/infrastructure/database/typeorm/entity-dtos/seen-listing.entity.dto';
import { SubscriptionEntityDto } from '@list-am-bot/infrastructure/database/typeorm/entity-dtos/subscription.entity.dto';
import { UserEntityDto } from '@list-am-bot/infrastructure/database/typeorm/entity-dtos/user.entity.dto';
import { deliveryProvider } from '@list-am-bot/infrastructure/database/typeorm/providers/delivery.provider';
import { seenListingProvider } from '@list-am-bot/infrastructure/database/typeorm/providers/seen-listing.provider';
import { subscriptionProvider } from '@list-am-bot/infrastructure/database/typeorm/providers/subscription.provider';
import { userProvider } from '@list-am-bot/infrastructure/database/typeorm/providers/user.provider';
import { DeliveryRepository } from '@list-am-bot/infrastructure/database/typeorm/repositories/delivery.repository';
import { SeenListingRepository } from '@list-am-bot/infrastructure/database/typeorm/repositories/seen-listing.repository';
import { SubscriptionRepository } from '@list-am-bot/infrastructure/database/typeorm/repositories/subscription.repository';
import { UserRepository } from '@list-am-bot/infrastructure/database/typeorm/repositories/user.repository';

const customProviders = [
  userProvider,
  subscriptionProvider,
  seenListingProvider,
  deliveryProvider,
  {
    provide: UserRepositoryPort,
    useClass: UserRepository,
  },
  {
    provide: SubscriptionRepositoryPort,
    useClass: SubscriptionRepository,
  },
  {
    provide: SeenListingRepositoryPort,
    useClass: SeenListingRepository,
  },
  {
    provide: DeliveryRepositoryPort,
    useClass: DeliveryRepository,
  },
];

@Module({
  imports: [
    NestTypeOrmModule.forRootAsync(databaseProvider),
    NestTypeOrmModule.forFeature([
      UserEntityDto,
      SubscriptionEntityDto,
      SeenListingEntityDto,
      DeliveryEntityDto,
    ]),
  ],
  providers: [...customProviders],
  exports: [...customProviders],
})
export class TypeOrmDatabaseModule {}
