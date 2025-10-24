import { Injectable, Logger, UseFilters } from '@nestjs/common';
import { Wizard, WizardStep, On, Ctx } from 'nestjs-telegraf';
import { Scenes } from 'telegraf';
import { Message } from 'telegraf/types';

import { ScrapeWorkerService } from '@list-am-bot/application/scheduler/scrape-worker.service';
import { SubscriptionService } from '@list-am-bot/application/subscription/subscription.service';
import { UserService } from '@list-am-bot/application/user/user.service';
import {
  DuplicateSubscriptionException,
  InvalidQueryException,
} from '@list-am-bot/common/exceptions/bot.exceptions';
import { TelegrafExceptionFilter } from '@list-am-bot/common/filters/telegraf-exception.filter';
import { BotContext } from '@list-am-bot/context/context.interface';
import { BotKeyboards } from '@list-am-bot/interfaces/bot/keyboards/bot.keyboards';
import { BotMessages } from '@list-am-bot/interfaces/bot/messages/bot.messages';

export const ADD_SUBSCRIPTION_SCENE = 'ADD_SUBSCRIPTION_SCENE';

type WizardContext = Scenes.WizardContext & BotContext;

@Injectable()
@Wizard(ADD_SUBSCRIPTION_SCENE)
@UseFilters(TelegrafExceptionFilter)
export class AddSubscriptionScene {
  private readonly logger = new Logger(AddSubscriptionScene.name);

  constructor(
    private readonly userService: UserService,
    private readonly subscriptionService: SubscriptionService,
    private readonly scrapeWorkerService: ScrapeWorkerService,
    private readonly keyboards: BotKeyboards,
    private readonly messages: BotMessages,
  ) {}

  @WizardStep(1)
  async promptForQuery(@Ctx() ctx: WizardContext): Promise<void> {
    await this.sendQueryPrompt(ctx);
    ctx.wizard.next();
  }

  @WizardStep(2)
  @On('text')
  async onQueryInput(@Ctx() ctx: WizardContext): Promise<void> {
    if (!ctx.from || !ctx.message || !('text' in ctx.message)) {
      await this.leaveScene(ctx);
      return;
    }

    const text = (ctx.message as Message.TextMessage).text;

    if (this.isCancelCommand(text)) {
      await this.handleCancel(ctx);
      return;
    }

    const user = await this.userService.findByTelegramUserId(ctx.from.id);
    if (!user) {
      await this.handleUserNotFound(ctx);
      return;
    }

    try {
      const subscription = await this.subscriptionService.create(user.id, text);
      await this.handleSubscriptionCreated(
        ctx,
        subscription.id,
        subscription.query,
      );
    } catch (error) {
      await this.handleSubscriptionError(ctx, error, text);
    }
  }

  private async sendQueryPrompt(ctx: WizardContext): Promise<void> {
    await ctx.reply(this.messages.enterQuery(), {
      parse_mode: 'HTML',
      reply_markup: this.keyboards.cancelButton(),
    });
  }

  private isCancelCommand(text: string): boolean {
    return text === '/cancel' || text.toLowerCase() === 'отмена';
  }

  private async handleCancel(ctx: WizardContext): Promise<void> {
    await this.leaveScene(ctx);
    await ctx.reply(this.messages.canceled(), {
      reply_markup: {
        remove_keyboard: true,
      },
    });
    await ctx.reply(this.messages.menu(), {
      reply_markup: this.keyboards.mainMenu(),
    });
  }

  private async handleUserNotFound(ctx: WizardContext): Promise<void> {
    await this.leaveScene(ctx);
    await ctx.reply(this.messages.userNotFound(), {
      reply_markup: {
        remove_keyboard: true,
      },
    });
  }

  private async handleSubscriptionCreated(
    ctx: WizardContext,
    subscriptionId: number,
    query: string,
  ): Promise<void> {
    this.scrapeWorkerService
      .initializeSubscription(subscriptionId, query)
      .catch((error): void => {
        this.logger.error(
          `Failed to initialize subscription ${subscriptionId}:`,
          error,
        );
      });

    await this.leaveScene(ctx);
    await ctx.reply(this.messages.subscriptionAdded(query), {
      reply_markup: {
        remove_keyboard: true,
      },
    });
    await ctx.reply(this.messages.menu(), {
      reply_markup: this.keyboards.mainMenu(),
    });
  }

  private async handleSubscriptionError(
    ctx: WizardContext,
    error: unknown,
    query: string,
  ): Promise<void> {
    if (error instanceof DuplicateSubscriptionException) {
      await ctx.reply(this.messages.duplicateSubscription(query), {
        reply_markup: {
          remove_keyboard: true,
        },
      });
    } else if (error instanceof InvalidQueryException) {
      await ctx.reply(
        this.messages.invalidQuery(error.message || 'Неверный формат запроса'),
        {
          reply_markup: {
            remove_keyboard: true,
          },
        },
      );
    } else {
      await ctx.reply(this.messages.error(), {
        reply_markup: {
          remove_keyboard: true,
        },
      });
    }
  }

  private async leaveScene(ctx: WizardContext): Promise<void> {
    await ctx.scene.leave();
  }
}
