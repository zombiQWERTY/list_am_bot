import { Injectable } from '@nestjs/common';
import { Update, Start, Help, Command, On, Ctx, Action } from 'nestjs-telegraf';
import { Context } from 'telegraf';

import { SubscriptionService } from '@list-am-bot/application/subscription/subscription.service';
import { UserService } from '@list-am-bot/application/user/user.service';
import { BotKeyboards } from '@list-am-bot/interfaces/bot/keyboards/bot.keyboards';
import { BotMessages } from '@list-am-bot/interfaces/bot/messages/bot.messages';

@Update()
@Injectable()
export class BotUpdate {
  constructor(
    private readonly userService: UserService,
    private readonly subscriptionService: SubscriptionService,
    private readonly keyboards: BotKeyboards,
    private readonly messages: BotMessages,
  ) {}

  @Start()
  async onStart(@Ctx() ctx: Context): Promise<void> {
    if (!ctx.from) return;

    const userId = ctx.from.id;
    const username = ctx.from.username;

    await this.userService.findOrCreate(userId, username);

    await ctx.reply(this.messages.welcome(), {
      reply_markup: this.keyboards.mainMenu(),
    });
  }

  @Help()
  async onHelp(@Ctx() ctx: Context): Promise<void> {
    await ctx.reply(this.messages.help());
  }

  @Command('menu')
  async onMenu(@Ctx() ctx: Context): Promise<void> {
    await ctx.reply(this.messages.menu(), {
      reply_markup: this.keyboards.mainMenu(),
    });
  }

  @Command('status')
  async onStatus(@Ctx() ctx: Context): Promise<void> {
    if (!ctx.from) return;

    const userId = ctx.from.id;
    const user = await this.userService.findByTelegramUserId(userId);

    if (!user) {
      await ctx.reply(this.messages.userNotFound());
      return;
    }

    const count = await this.subscriptionService.count(user.id);
    const status = this.messages.status(count, user.isPaused);

    await ctx.reply(status);
  }

  @Action(/^unsubscribe:(\d+)$/)
  async onUnsubscribe(@Ctx() ctx: Context): Promise<void> {
    if (!ctx.callbackQuery || !('data' in ctx.callbackQuery)) {
      return;
    }

    const callbackData = ctx.callbackQuery.data;
    const match = callbackData.match(/^unsubscribe:(\d+)$/);

    if (!match?.[1]) {
      await ctx.answerCbQuery('❌ Неверный формат');
      return;
    }

    const subscriptionId = parseInt(match[1], 10);

    try {
      await this.subscriptionService.delete(subscriptionId);
      await ctx.answerCbQuery('✅ Подписка удалена');
      await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
    } catch {
      await ctx.answerCbQuery('❌ Ошибка при удалении подписки');
    }
  }

  @On('text')
  async onText(@Ctx() ctx: Context): Promise<void> {
    await ctx.reply(this.messages.unknownCommand(), {
      reply_markup: this.keyboards.mainMenu(),
    });
  }
}
