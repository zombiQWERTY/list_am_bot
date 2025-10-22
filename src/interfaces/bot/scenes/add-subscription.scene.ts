import { Injectable, Logger } from '@nestjs/common';
import { Scene, SceneEnter, On, Ctx } from 'nestjs-telegraf';
import { Scenes } from 'telegraf';
import { Message } from 'telegraf/types';

import { ScrapeWorkerService } from '@list-am-bot/application/scheduler/scrape-worker.service';
import { SubscriptionService } from '@list-am-bot/application/subscription/subscription.service';
import { UserService } from '@list-am-bot/application/user/user.service';
import {
  DuplicateSubscriptionException,
  InvalidQueryException,
} from '@list-am-bot/common/exceptions/bot.exceptions';
import { BotKeyboards } from '@list-am-bot/interfaces/bot/keyboards/bot.keyboards';
import { BotMessages } from '@list-am-bot/interfaces/bot/messages/bot.messages';

export const ADD_SUBSCRIPTION_SCENE = 'ADD_SUBSCRIPTION_SCENE';

type SceneContext = Scenes.SceneContext;

@Injectable()
@Scene(ADD_SUBSCRIPTION_SCENE)
export class AddSubscriptionScene {
  private readonly logger = new Logger(AddSubscriptionScene.name);

  constructor(
    private readonly userService: UserService,
    private readonly subscriptionService: SubscriptionService,
    private readonly scrapeWorkerService: ScrapeWorkerService,
    private readonly keyboards: BotKeyboards,
    private readonly messages: BotMessages,
  ) {}

  @SceneEnter()
  async onEnter(@Ctx() ctx: SceneContext): Promise<void> {
    await ctx.reply(this.messages.enterQuery(), {
      parse_mode: 'HTML',
      reply_markup: this.keyboards.cancelButton(),
    });
  }

  @On('text')
  async onText(@Ctx() ctx: SceneContext): Promise<void> {
    if (!ctx.from || !ctx.message || !('text' in ctx.message)) {
      return;
    }

    const text = (ctx.message as Message.TextMessage).text;

    if (text === '/cancel' || text.toLowerCase() === 'отмена') {
      await ctx.scene.leave();
      await ctx.reply(this.messages.canceled(), {
        reply_markup: this.keyboards.mainMenu(),
      });
      return;
    }

    const userId = ctx.from.id;
    const user = await this.userService.findByTelegramUserId(userId);

    if (!user) {
      await ctx.scene.leave();
      await ctx.reply(this.messages.userNotFound());
      return;
    }

    try {
      const subscription = await this.subscriptionService.create(user.id, text);

      // Initialize subscription in background (mark existing listings as seen)
      // Don't await - let it run asynchronously
      this.scrapeWorkerService
        .initializeSubscription(subscription.id, subscription.query)
        .catch((error): void => {
          this.logger.error(
            `Failed to initialize subscription ${subscription.id}:`,
            error,
          );
        });

      await ctx.scene.leave();
      await ctx.reply(this.messages.subscriptionAdded(subscription.query), {
        reply_markup: this.keyboards.mainMenu(),
      });
    } catch (error) {
      if (error instanceof DuplicateSubscriptionException) {
        await ctx.reply(this.messages.duplicateSubscription(text));
      } else if (error instanceof InvalidQueryException) {
        await ctx.reply(
          this.messages.invalidQuery(
            error.message || 'Неверный формат запроса',
          ),
        );
      } else {
        await ctx.reply(this.messages.error());
      }
    }
  }
}
