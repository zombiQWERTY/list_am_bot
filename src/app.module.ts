import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { appConfigFactory } from '@list-am-bot/common/config/app.config';
import { botConfig } from '@list-am-bot/common/config/bot.config';
import { TypeOrmDatabaseModule } from '@list-am-bot/infrastructure/database/typeorm/typeorm-database.module';
import { BotModule } from '@list-am-bot/modules/bot.module';
import { SchedulerAppModule } from '@list-am-bot/modules/scheduler.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [appConfigFactory, botConfig],
    }),
    TypeOrmDatabaseModule,
    BotModule,
    SchedulerAppModule,
  ],
})
export class AppModule {}
