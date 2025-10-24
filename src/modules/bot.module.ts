import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';

import { NotificationService } from '@list-am-bot/application/notification/notification.service';
import { TelegrafExceptionFilter } from '@list-am-bot/common/filters/telegraf-exception.filter';
import { TypeOrmDatabaseModule } from '@list-am-bot/infrastructure/database/typeorm/typeorm-database.module';
import { MenuActions } from '@list-am-bot/interfaces/bot/actions/menu.actions';
import { BotUpdate } from '@list-am-bot/interfaces/bot/bot.update';
import { BotKeyboards } from '@list-am-bot/interfaces/bot/keyboards/bot.keyboards';
import { BotMessages } from '@list-am-bot/interfaces/bot/messages/bot.messages';
import { AddSubscriptionScene } from '@list-am-bot/interfaces/bot/scenes/add-subscription.scene';
import { MonitoringModule } from '@list-am-bot/modules/monitoring.module';
import { ScraperModule } from '@list-am-bot/modules/scraper.module';
import { SubscriptionModule } from '@list-am-bot/modules/subscription.module';
import { UserModule } from '@list-am-bot/modules/user.module';
import { WorkerModule } from '@list-am-bot/modules/worker.module';

@Module({
  imports: [
    TypeOrmDatabaseModule,
    UserModule,
    SubscriptionModule,
    ScraperModule,
    WorkerModule,
    MonitoringModule,
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
