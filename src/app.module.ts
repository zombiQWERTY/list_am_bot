import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TelegrafModule, TelegrafModuleOptions } from 'nestjs-telegraf';

import {
  appConfig,
  AppSchemaType,
} from '@list-am-bot/common/config/app.config';
import {
  botConfig,
  BotSchemaType,
} from '@list-am-bot/common/config/bot.config';
import {
  DatabaseSchemaType,
  postgresConfig,
} from '@list-am-bot/common/config/database.config';
import scraperConfig from '@list-am-bot/common/config/scraper.config';
import { getSessionMiddleware } from '@list-am-bot/common/middleware/session.middleware';
import { LIST_AM_BOT } from '@list-am-bot/constants';
import { TypeOrmDatabaseModule } from '@list-am-bot/infrastructure/database/typeorm/typeorm-database.module';
import { BotModule } from '@list-am-bot/modules/bot.module';
import { MonitoringModule } from '@list-am-bot/modules/monitoring.module';
import { SchedulerAppModule } from '@list-am-bot/modules/scheduler.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [appConfig, botConfig, postgresConfig, scraperConfig],
    }),
    TelegrafModule.forRootAsync({
      botName: LIST_AM_BOT,
      inject: [botConfig.KEY, appConfig.KEY, postgresConfig.KEY],
      useFactory: (
        botCfg: BotSchemaType,
        appCfg: AppSchemaType,
        dbConfig: DatabaseSchemaType,
      ): TelegrafModuleOptions => ({
        token: botCfg.botToken,
        middlewares: [getSessionMiddleware(dbConfig)],
        include: [BotModule],
        launchOptions: {
          allowedUpdates: ['message', 'callback_query'],
          dropPendingUpdates: true,
          webhook:
            appCfg.node_env === 'production' && botCfg.botDomain
              ? {
                  domain: botCfg.botDomain,
                  path: botCfg.botWebhookUrl || '/telegram-webhook',
                }
              : undefined,
        },
      }),
    }),
    TypeOrmDatabaseModule,
    BotModule,
    MonitoringModule,
    SchedulerAppModule,
  ],
})
export class AppModule {}
