import { Injectable, Logger, UseFilters } from '@nestjs/common';
import { Wizard, WizardStep, On, Ctx } from 'nestjs-telegraf';
import { Scenes } from 'telegraf';
import { Message } from 'telegraf/types';

import { SubscriptionService } from '@list-am-bot/application/subscription/subscription.service';
import { UserService } from '@list-am-bot/application/user/user.service';
import {
  DuplicateSubscriptionException,
  InvalidQueryException,
} from '@list-am-bot/common/exceptions/bot.exceptions';
import { TelegrafExceptionFilter } from '@list-am-bot/common/filters/telegraf-exception.filter';
import { ListAmUrlUtil } from '@list-am-bot/common/utils/list-am-url.util';
import { BotContext } from '@list-am-bot/context/context.interface';
import { BotKeyboards } from '@list-am-bot/interfaces/bot/keyboards/bot.keyboards';
import { BotMessages } from '@list-am-bot/interfaces/bot/messages/bot.messages';

export const ADD_URL_SUBSCRIPTION_SCENE = 'ADD_URL_SUBSCRIPTION_SCENE';

type WizardContext = Scenes.WizardContext & BotContext;

interface SceneSession {
  url?: string;
}

@Injectable()
@Wizard(ADD_URL_SUBSCRIPTION_SCENE)
@UseFilters(TelegrafExceptionFilter)
export class AddUrlSubscriptionScene {
  private readonly logger = new Logger(AddUrlSubscriptionScene.name);

  constructor(
    private readonly userService: UserService,
    private readonly subscriptionService: SubscriptionService,
    private readonly keyboards: BotKeyboards,
    private readonly messages: BotMessages,
  ) {}

  @WizardStep(1)
  async promptForUrl(@Ctx() ctx: WizardContext): Promise<void> {
    await ctx.reply(this.messages.enterUrl(), {
      parse_mode: 'HTML',
      reply_markup: this.keyboards.cancelButton(),
    });
    ctx.wizard.next();
  }

  @WizardStep(2)
  @On('text')
  async onUrlInput(@Ctx() ctx: WizardContext): Promise<void> {
    if (!ctx.from || !ctx.message || !('text' in ctx.message)) {
      await this.leaveScene(ctx);
      return;
    }

    const text = (ctx.message as Message.TextMessage).text;

    if (this.isCancelCommand(text)) {
      await this.handleCancel(ctx);
      return;
    }

    if (!ListAmUrlUtil.isValidListAmUrl(text)) {
      await ctx.reply(this.messages.invalidUrl(), {
        parse_mode: 'HTML',
        reply_markup: this.keyboards.cancelButton(),
      });
      return;
    }

    const session = ctx.wizard.state as SceneSession;
    session.url = ListAmUrlUtil.normalizeUrl(text);

    await ctx.reply(this.messages.enterSubscriptionName(), {
      parse_mode: 'HTML',
      reply_markup: this.keyboards.cancelButton(),
    });
    ctx.wizard.next();
  }

  @WizardStep(3)
  @On('text')
  async onNameInput(@Ctx() ctx: WizardContext): Promise<void> {
    if (!ctx.from || !ctx.message || !('text' in ctx.message)) {
      await this.leaveScene(ctx);
      return;
    }

    const text = (ctx.message as Message.TextMessage).text;

    if (this.isCancelCommand(text)) {
      await this.handleCancel(ctx);
      return;
    }

    if (!ListAmUrlUtil.isValidSubscriptionName(text)) {
      await ctx.reply(this.messages.invalidSubscriptionName(), {
        parse_mode: 'HTML',
        reply_markup: this.keyboards.cancelButton(),
      });
      return;
    }

    const user = await this.userService.findByTelegramUserId(ctx.from.id);
    if (!user) {
      await this.handleUserNotFound(ctx);
      return;
    }

    const session = ctx.wizard.state as SceneSession;
    const url = session.url;

    if (!url) {
      await this.leaveScene(ctx);
      return;
    }

    try {
      const subscription = await this.subscriptionService.createFromUrl(
        user.id,
        url,
        text,
      );

      await ctx.reply(
        this.messages.urlSubscriptionAdded(subscription.name || text, url),
        {
          parse_mode: 'HTML',
          reply_markup: {
            remove_keyboard: true,
          },
        },
      );

      await ctx.reply(this.messages.menu(), {
        reply_markup: this.keyboards.mainMenu(),
      });

      this.logger.log(
        `URL subscription created: ${subscription.name} for user ${user.id}`,
      );

      await this.leaveScene(ctx);
    } catch (error) {
      await this.handleSubscriptionError(ctx, error, url);
    }
  }

  private async handleCancel(ctx: WizardContext): Promise<void> {
    await ctx.reply(this.messages.canceled(), {
      reply_markup: {
        remove_keyboard: true,
      },
    });
    await ctx.reply(this.messages.menu(), {
      reply_markup: this.keyboards.mainMenu(),
    });
    await this.leaveScene(ctx);
  }

  private async handleUserNotFound(ctx: WizardContext): Promise<void> {
    await ctx.reply(this.messages.userNotFound(), {
      reply_markup: {
        remove_keyboard: true,
      },
    });
    await this.leaveScene(ctx);
  }

  private async handleSubscriptionError(
    ctx: WizardContext,
    error: unknown,
    url: string,
  ): Promise<void> {
    if (error instanceof DuplicateSubscriptionException) {
      await ctx.reply(this.messages.duplicateUrlSubscription(url), {
        reply_markup: {
          remove_keyboard: true,
        },
      });
    } else if (error instanceof InvalidQueryException) {
      await ctx.reply(this.messages.invalidQuery(error.message), {
        reply_markup: {
          remove_keyboard: true,
        },
      });
    } else {
      this.logger.error('Failed to create URL subscription:', error);
      await ctx.reply(this.messages.error(), {
        reply_markup: {
          remove_keyboard: true,
        },
      });
    }

    await ctx.reply(this.messages.menu(), {
      reply_markup: this.keyboards.mainMenu(),
    });
    await this.leaveScene(ctx);
  }

  private isCancelCommand(text: string): boolean {
    return text.toLowerCase() === '/cancel' || text === '❌ Отмена';
  }

  private async leaveScene(ctx: WizardContext): Promise<void> {
    await ctx.scene.leave();
  }
}
