import { InlineKeyboardMarkup, InlineKeyboardButton } from 'telegraf/types';

export interface ListingKeyboardOptions {
  url: string;
  subscriptionId?: number;
  openButtonText?: string;
  includeUnsubscribe?: boolean;
}

/**
 * Factory for creating listing-related keyboards
 */
export class ListingKeyboard {
  static create(options: ListingKeyboardOptions): InlineKeyboardMarkup {
    const buttons: InlineKeyboardButton[][] = [
      [
        {
          text: options.openButtonText || '🔗 Открыть',
          url: options.url,
        },
      ],
    ];

    if (options.includeUnsubscribe && options.subscriptionId) {
      buttons.push([
        {
          text: '🗑 Отписаться от этого запроса',
          callback_data: `unsubscribe:${options.subscriptionId}`,
        },
      ]);
    }

    return {
      inline_keyboard: buttons,
    };
  }
}
