import { Module } from '@nestjs/common';

import { SubscriptionService } from '@list-am-bot/application/subscription/subscription.service';
import { TypeOrmDatabaseModule } from '@list-am-bot/infrastructure/database/typeorm/typeorm-database.module';

@Module({
  imports: [TypeOrmDatabaseModule],
  providers: [SubscriptionService],
  exports: [SubscriptionService],
})
export class SubscriptionModule {}
