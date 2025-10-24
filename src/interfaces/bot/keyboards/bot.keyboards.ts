import { Injectable } from '@nestjs/common';
import {
  InlineKeyboardMarkup,
  InlineKeyboardButton,
  ReplyKeyboardMarkup,
} from 'telegraf/types';

import {
  SubscriptionEntity,
  SubscriptionType,
} from '@list-am-bot/domain/subscription/subscription.entity';

@Injectable()
export class BotKeyboards {
  mainMenu(isPaused = false): InlineKeyboardMarkup {
    const buttons: InlineKeyboardButton[][] = [
      [{ text: '📋 Список отслеживаемых', callback_data: 'menu:list' }],
      [{ text: '➕ Добавить текстом', callback_data: 'menu:add' }],
      [{ text: '🔗 Добавить по URL', callback_data: 'menu:add_url' }],
      [{ text: '🗑 Очистить список', callback_data: 'menu:clear' }],
    ];

    if (isPaused) {
      buttons.push([
        { text: '▶️ Начать рассылку', callback_data: 'menu:resume' },
      ]);
    } else {
      buttons.push([
        { text: '⏸ Остановить рассылку', callback_data: 'menu:pause' },
      ]);
    }

    return { inline_keyboard: buttons };
  }

  subscriptionList(subscriptions: SubscriptionEntity[]): InlineKeyboardMarkup {
    const buttons: InlineKeyboardButton[][] = subscriptions.map(
      (sub, index): InlineKeyboardButton[] => {
        let displayText: string;

        if (sub.type === SubscriptionType.URL && sub.name) {
          displayText = `${index + 1}. 🔗 ${sub.name.substring(0, 35)}${sub.name.length > 35 ? '...' : ''}`;
        } else {
          displayText = `${index + 1}. ${sub.query.substring(0, 40)}${sub.query.length > 40 ? '...' : ''}`;
        }

        return [
          {
            text: displayText,
            callback_data: `sub:${sub.id}`,
          },
          {
            text: '🗑',
            callback_data: `delete:${sub.id}`,
          },
        ];
      },
    );

    buttons.push([{ text: '« Назад в меню', callback_data: 'menu:back' }]);

    return { inline_keyboard: buttons };
  }

  confirmClear(): InlineKeyboardMarkup {
    return {
      inline_keyboard: [
        [
          { text: '✅ Да, удалить все', callback_data: 'clear:yes' },
          { text: '❌ Нет, отмена', callback_data: 'clear:no' },
        ],
      ],
    };
  }

  cancelButton(): ReplyKeyboardMarkup {
    return {
      keyboard: [[{ text: 'Отмена' }]],
      resize_keyboard: true,
      one_time_keyboard: true,
    };
  }
}
