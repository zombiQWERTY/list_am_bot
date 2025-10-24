import { Logger, Module } from '@nestjs/common';
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
import { postgresConfig } from '@list-am-bot/common/config/database.config';
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
      inject: [botConfig.KEY, appConfig.KEY],
      useFactory: (
        botCfg: BotSchemaType,
        appCfg: AppSchemaType,
      ): TelegrafModuleOptions => {
        const logger = new Logger('TelegrafModule');
        const webhookPath = botCfg.botWebhookUrl || '/api/webhook';
        const isProduction = appCfg.node_env === 'production';
        const hasWebhook = isProduction && botCfg.botDomain;

        logger.log(`🤖 Bot configuration:`);
        logger.log(`  - Environment: ${appCfg.node_env}`);
        logger.log(`  - Mode: ${hasWebhook ? 'WEBHOOK' : 'POLLING'}`);

        if (hasWebhook) {
          logger.log(`  - Domain: ${botCfg.botDomain}`);
          logger.log(`  - Webhook path: ${webhookPath}`);
          logger.log(`  - Full webhook URL: ${botCfg.botDomain}${webhookPath}`);
        }

        return {
          token: botCfg.botToken,
          middlewares: [getSessionMiddleware()],
          include: [BotModule],
          launchOptions: {
            allowedUpdates: ['message', 'callback_query'],
            dropPendingUpdates: true,
            webhook: hasWebhook
              ? {
                  domain: botCfg.botDomain,
                  path: webhookPath,
                }
              : undefined,
          },
        };
      },
    }),
    TypeOrmDatabaseModule,
    BotModule,
    MonitoringModule,
    SchedulerAppModule,
  ],
})
export class AppModule {}
