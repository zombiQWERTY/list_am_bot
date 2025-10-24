import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectBot } from 'nestjs-telegraf';
import { Context, Telegraf } from 'telegraf';

import { MetricsService } from '@list-am-bot/application/monitoring/metrics.service';
import { UserService } from '@list-am-bot/application/user/user.service';
import { ListingMessageFormatter } from '@list-am-bot/common/formatters/listing-message.formatter';
import { ListingKeyboard } from '@list-am-bot/common/keyboards/listing.keyboard';
import { NotificationPayload } from '@list-am-bot/common/types/listing.types';
import { RateLimiter } from '@list-am-bot/common/utils/rate-limiter.util';
import {
  isTelegramBotBlocked,
  isTelegramError,
} from '@list-am-bot/common/utils/telegram-error.guard';
import { LIST_AM_BOT } from '@list-am-bot/constants';
import {
  DeliveryRepositoryPort,
  IDeliveryRepository,
} from '@list-am-bot/domain/delivery/ports/delivery.repository.port';
import { UserEntity } from '@list-am-bot/domain/user/user.entity';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private readonly telegramRateLimiter: RateLimiter;

  constructor(
    @InjectBot(LIST_AM_BOT)
    private readonly bot: Telegraf<Context>,
    @Inject(DeliveryRepositoryPort)
    private readonly deliveryRepository: IDeliveryRepository,
    private readonly userService: UserService,
    private readonly metricsService: MetricsService,
  ) {
    // Telegram API limit: 30 messages per second globally
    // Set to 25/sec for safety margin
    this.telegramRateLimiter = new RateLimiter(25, 25);
  }

  async sendListingNotification(payload: NotificationPayload): Promise<void> {
    this.logger.debug(
      `Attempting to send notification for listing ${payload.listing.id} to user ${payload.userTelegramId}`,
    );

    const user = await this.findOrCreateUser(payload.userTelegramId);

    const alreadySent = await this.deliveryRepository.exists(
      user.id,
      payload.listing.id,
    );

    if (alreadySent) {
      this.logger.debug(
        `Notification for listing ${payload.listing.id} already sent to user ${payload.userTelegramId}, skipping`,
      );
      return;
    }

    await this.sendTelegramNotification(user, payload);
  }

  private async findOrCreateUser(telegramUserId: number): Promise<UserEntity> {
    const existingUser =
      await this.userService.findByTelegramUserId(telegramUserId);

    if (existingUser) {
      return existingUser;
    }

    this.logger.warn(
      `User with Telegram ID ${telegramUserId} not found in database. Creating user...`,
    );

    return this.userService.findOrCreate(telegramUserId);
  }

  private async sendTelegramNotification(
    user: UserEntity,
    payload: NotificationPayload,
  ): Promise<void> {
    try {
      const message = ListingMessageFormatter.format(payload.listing, {
        includeQuery: true,
        query: payload.query,
      });

      const keyboard = ListingKeyboard.create({
        url: payload.listing.url,
        subscriptionId: payload.subscriptionId,
        includeUnsubscribe: true,
      });

      this.logger.debug(
        `Sending Telegram message to ${payload.userTelegramId}...`,
      );

      await this.telegramRateLimiter.acquire();

      const sentMessage = await this.bot.telegram.sendMessage(
        payload.userTelegramId,
        message,
        {
          parse_mode: 'HTML',
          reply_markup: keyboard,
        },
      );

      await this.deliveryRepository.create(
        user.id,
        payload.subscriptionId,
        payload.listing.id,
        sentMessage.message_id.toString(),
      );

      await this.metricsService.recordNotificationSuccess(
        payload.userTelegramId,
        payload.listing.id,
      );

      this.logger.debug(
        `✅ Notification sent for listing ${payload.listing.id} to user ${payload.userTelegramId}`,
      );
    } catch (error: unknown) {
      await this.metricsService.recordNotificationFailure(
        payload.userTelegramId,
        payload.listing.id,
        error instanceof Error ? error.message : 'Unknown error',
      );
      this.handleTelegramError(error, payload.userTelegramId);
    }
  }

  private handleTelegramError(error: unknown, telegramUserId: number): void {
    if (isTelegramBotBlocked(error)) {
      this.logger.debug(
        `User ${telegramUserId} blocked the bot. Skipping notification.`,
      );
      return;
    }

    if (isTelegramError(error)) {
      this.logger.error(
        `Telegram API error ${error.response.error_code}: ${error.response.description || 'Unknown error'}`,
      );
    } else {
      this.logger.error(
        `Failed to send notification to ${telegramUserId}:`,
        error,
      );
    }

    throw error;
  }
}
