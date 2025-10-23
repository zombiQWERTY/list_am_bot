import { Injectable, UseFilters } from '@nestjs/common';
import { Action, Ctx, Update } from 'nestjs-telegraf';

import { SubscriptionService } from '@list-am-bot/application/subscription/subscription.service';
import { UserService } from '@list-am-bot/application/user/user.service';
import { TelegrafExceptionFilter } from '@list-am-bot/common/filters/telegraf-exception.filter';
import { BotContext } from '@list-am-bot/context/context.interface';
import { BotKeyboards } from '@list-am-bot/interfaces/bot/keyboards/bot.keyboards';
import { BotMessages } from '@list-am-bot/interfaces/bot/messages/bot.messages';
import { ADD_SUBSCRIPTION_SCENE } from '@list-am-bot/interfaces/bot/scenes/add-subscription.scene';

@Update()
@Injectable()
@UseFilters(TelegrafExceptionFilter)
export class MenuActions {
  constructor(
    private readonly userService: UserService,
    private readonly subscriptionService: SubscriptionService,
    private readonly keyboards: BotKeyboards,
    private readonly messages: BotMessages,
  ) {}

  @Action('menu:list')
  async showList(@Ctx() ctx: BotContext): Promise<void> {
    if (!ctx.from) return;

    const userId = ctx.from.id;
    const user = await this.userService.findByTelegramUserId(userId);

    if (!user) {
      await ctx.answerCbQuery();
      await ctx.reply(this.messages.userNotFound());
      return;
    }

    const subscriptions = await this.subscriptionService.findActiveByUserId(
      user.id,
    );

    if (subscriptions.length === 0) {
      await ctx.answerCbQuery();
      await ctx.editMessageText(this.messages.noSubscriptions(), {
        reply_markup: this.keyboards.mainMenu(),
      });
      return;
    }

    const keyboard = this.keyboards.subscriptionList(subscriptions);
    await ctx.answerCbQuery();
    await ctx.editMessageText(
      this.messages.subscriptionsList(subscriptions.length),
      { reply_markup: keyboard },
    );
  }

  @Action('menu:add')
  async addSubscription(@Ctx() ctx: BotContext): Promise<void> {
    await ctx.answerCbQuery();
    await ctx.scene.enter(ADD_SUBSCRIPTION_SCENE);
  }

  @Action('menu:clear')
  async confirmClear(@Ctx() ctx: BotContext): Promise<void> {
    await ctx.answerCbQuery();
    await ctx.editMessageText(this.messages.confirmClear(), {
      reply_markup: this.keyboards.confirmClear(),
    });
  }

  @Action('clear:yes')
  async clearAll(@Ctx() ctx: BotContext): Promise<void> {
    if (!ctx.from) return;

    const userId = ctx.from.id;
    const user = await this.userService.findByTelegramUserId(userId);

    if (!user) {
      await ctx.answerCbQuery();
      await ctx.reply(this.messages.userNotFound());
      return;
    }

    await this.subscriptionService.deleteAll(user.id);
    await ctx.answerCbQuery('✅ Все подписки удалены');
    await ctx.editMessageText(this.messages.allCleared(), {
      reply_markup: this.keyboards.mainMenu(),
    });
  }

  @Action('clear:no')
  async cancelClear(@Ctx() ctx: BotContext): Promise<void> {
    await ctx.answerCbQuery();
    await ctx.editMessageText(this.messages.menu(), {
      reply_markup: this.keyboards.mainMenu(),
    });
  }

  @Action('menu:pause')
  async pauseNotifications(@Ctx() ctx: BotContext): Promise<void> {
    if (!ctx.from) return;

    const userId = ctx.from.id;
    const user = await this.userService.findByTelegramUserId(userId);

    if (!user) {
      await ctx.answerCbQuery();
      await ctx.reply(this.messages.userNotFound());
      return;
    }

    await this.userService.pauseNotifications(user.id);
    await ctx.answerCbQuery('⏸ Рассылка приостановлена');
    await ctx.editMessageText(this.messages.menu(), {
      reply_markup: this.keyboards.mainMenu(true),
    });
  }

  @Action('menu:resume')
  async resumeNotifications(@Ctx() ctx: BotContext): Promise<void> {
    if (!ctx.from) return;

    const userId = ctx.from.id;
    const user = await this.userService.findByTelegramUserId(userId);

    if (!user) {
      await ctx.answerCbQuery();
      await ctx.reply(this.messages.userNotFound());
      return;
    }

    await this.userService.resumeNotifications(user.id);
    await ctx.answerCbQuery('▶️ Рассылка возобновлена');
    await ctx.editMessageText(this.messages.menu(), {
      reply_markup: this.keyboards.mainMenu(false),
    });
  }

  @Action('menu:back')
  async backToMenu(@Ctx() ctx: BotContext): Promise<void> {
    await ctx.answerCbQuery();
    await ctx.editMessageText(this.messages.menu(), {
      reply_markup: this.keyboards.mainMenu(),
    });
  }

  @Action(/^delete:(\d+)$/)
  async deleteSubscription(@Ctx() ctx: BotContext): Promise<void> {
    if (!ctx.callbackQuery || !('data' in ctx.callbackQuery)) {
      return;
    }

    const callbackData = ctx.callbackQuery.data;
    const match = callbackData.match(/^delete:(\d+)$/);

    if (!match?.[1]) {
      await ctx.answerCbQuery('❌ Неверный формат');
      return;
    }

    const subscriptionId = parseInt(match[1], 10);

    try {
      await this.subscriptionService.delete(subscriptionId);
      await ctx.answerCbQuery('✅ Подписка удалена');
      await this.showList(ctx);
    } catch {
      await ctx.answerCbQuery('❌ Ошибка при удалении');
    }
  }
}
