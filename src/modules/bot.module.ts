import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { TelegrafModule, TelegrafModuleOptions } from 'nestjs-telegraf';

import { NotificationService } from '@list-am-bot/application/notification/notification.service';
import { TelegrafExceptionFilter } from '@list-am-bot/common/filters/telegraf-exception.filter';
import { createSessionMiddleware } from '@list-am-bot/common/middleware/session.middleware';
import { TypeOrmDatabaseModule } from '@list-am-bot/infrastructure/database/typeorm/typeorm-database.module';
import { MenuActions } from '@list-am-bot/interfaces/bot/actions/menu.actions';
import { BotUpdate } from '@list-am-bot/interfaces/bot/bot.update';
import { BotKeyboards } from '@list-am-bot/interfaces/bot/keyboards/bot.keyboards';
import { BotMessages } from '@list-am-bot/interfaces/bot/messages/bot.messages';
import { AddSubscriptionScene } from '@list-am-bot/interfaces/bot/scenes/add-subscription.scene';
import { ScraperModule } from '@list-am-bot/modules/scraper.module';
import { SubscriptionModule } from '@list-am-bot/modules/subscription.module';
import { UserModule } from '@list-am-bot/modules/user.module';
import { WorkerModule } from '@list-am-bot/modules/worker.module';

@Module({
  imports: [
    TelegrafModule.forRootAsync({
      useFactory: (configService: ConfigService): TelegrafModuleOptions => {
        const postgresUrl = configService.get<string>('CORE_POSTGRES_URL', '');

        return {
          token: configService.get<string>('botToken') || '',
          middlewares: [
            createSessionMiddleware({
              postgresUrl,
              tableName: 'telegraf_sessions',
            }),
          ],
          launchOptions: {
            dropPendingUpdates: true,
          },
        };
      },
      inject: [ConfigService],
    }),
    UserModule,
    SubscriptionModule,
    ScraperModule,
    WorkerModule,
    TypeOrmDatabaseModule,
  ],
  providers: [
    BotUpdate,
    AddSubscriptionScene,
    MenuActions,
    BotKeyboards,
    BotMessages,
    NotificationService,
    {
      provide: APP_FILTER,
      useClass: TelegrafExceptionFilter,
    },
  ],
  exports: [NotificationService],
})
export class BotModule {}
