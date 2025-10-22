import { Inject, Injectable } from '@nestjs/common';
import { InjectBot } from 'nestjs-telegraf';
import { Context, Telegraf } from 'telegraf';
import { InlineKeyboardMarkup } from 'telegraf/types';

import { NotificationPayload } from '@list-am-bot/common/types/listing.types';
import {
  DeliveryRepositoryPort,
  IDeliveryRepository,
} from '@list-am-bot/domain/delivery/ports/delivery.repository.port';

@Injectable()
export class NotificationService {
  constructor(
    @InjectBot()
    private readonly bot: Telegraf<Context>,
    @Inject(DeliveryRepositoryPort)
    private readonly deliveryRepository: IDeliveryRepository,
  ) {}

  async sendListingNotification(payload: NotificationPayload): Promise<void> {
    const alreadySent = await this.deliveryRepository.exists(
      payload.userTelegramId,
      payload.listing.id,
    );

    if (alreadySent) {
      return;
    }

    try {
      const message = this.formatListingMessage(payload);
      const keyboard = this.createListingKeyboard(payload);

      const sentMessage = await this.bot.telegram.sendMessage(
        payload.userTelegramId,
        message,
        {
          parse_mode: 'HTML',
          reply_markup: keyboard,
        },
      );

      await this.deliveryRepository.create(
        payload.userTelegramId,
        payload.subscriptionId,
        payload.listing.id,
        sentMessage.message_id.toString(),
      );
    } catch (error: unknown) {
      if (
        error &&
        typeof error === 'object' &&
        'response' in error &&
        error.response &&
        typeof error.response === 'object' &&
        'error_code' in error.response &&
        error.response.error_code === 403
      ) {
        // eslint-disable-next-line no-console
        console.warn(
          `User ${payload.userTelegramId} blocked the bot. Skipping notification.`,
        );
        return;
      }

      throw error;
    }
  }

  private formatListingMessage(payload: NotificationPayload): string {
    const { listing, query } = payload;

    const parts: string[] = [
      `🔔 <b>Новое объявление</b> по запросу: "${this.escapeHtml(query)}"`,
      '',
      `<b>${this.escapeHtml(listing.title)}</b>`,
    ];

    if (listing.priceText) {
      parts.push(`💰 Цена: ${this.escapeHtml(listing.priceText)}`);
    }

    if (listing.locationText) {
      parts.push(`📍 Локация: ${this.escapeHtml(listing.locationText)}`);
    }

    if (listing.postedAtText) {
      parts.push(`🕐 Время: ${this.escapeHtml(listing.postedAtText)}`);
    }

    parts.push('');
    parts.push(`🔗 ${listing.url}`);

    return parts.join('\n');
  }

  private createListingKeyboard(
    payload: NotificationPayload,
  ): InlineKeyboardMarkup {
    return {
      inline_keyboard: [
        [
          {
            text: '🔗 Открыть',
            url: payload.listing.url,
          },
        ],
        [
          {
            text: '🗑 Отписаться от этого запроса',
            callback_data: `unsubscribe:${payload.subscriptionId}`,
          },
        ],
      ],
    };
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
