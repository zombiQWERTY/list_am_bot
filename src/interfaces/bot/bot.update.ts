import { Injectable, Logger, UseFilters } from '@nestjs/common';
import { Update, Start, Help, Command, On, Ctx, Action } from 'nestjs-telegraf';

import { ScrapeWorkerService } from '@list-am-bot/application/scheduler/scrape-worker.service';
import { SubscriptionService } from '@list-am-bot/application/subscription/subscription.service';
import { UserService } from '@list-am-bot/application/user/user.service';
import { TelegrafExceptionFilter } from '@list-am-bot/common/filters/telegraf-exception.filter';
import { ListingMessageFormatter } from '@list-am-bot/common/formatters/listing-message.formatter';
import { ListingKeyboard } from '@list-am-bot/common/keyboards/listing.keyboard';
import { Listing, ScrapeResult } from '@list-am-bot/common/types/listing.types';
import { BotContext } from '@list-am-bot/context/context.interface';
import { BotKeyboards } from '@list-am-bot/interfaces/bot/keyboards/bot.keyboards';
import { BotMessages } from '@list-am-bot/interfaces/bot/messages/bot.messages';

@Update()
@Injectable()
@UseFilters(TelegrafExceptionFilter)
export class BotUpdate {
  private readonly logger = new Logger(BotUpdate.name);

  constructor(
    private readonly userService: UserService,
    private readonly subscriptionService: SubscriptionService,
    private readonly scrapeWorker: ScrapeWorkerService,
    private readonly keyboards: BotKeyboards,
    private readonly messages: BotMessages,
  ) {}

  @Start()
  async onStart(@Ctx() ctx: BotContext): Promise<void> {
    if (!ctx.from) return;

    const userId = ctx.from.id;
    const username = ctx.from.username;

    await this.userService.findOrCreate(userId, username);

    await ctx.reply(this.messages.welcome(), {
      reply_markup: this.keyboards.mainMenu(),
    });
  }

  @Help()
  async onHelp(@Ctx() ctx: BotContext): Promise<void> {
    await ctx.reply(this.messages.help(), {
      parse_mode: 'HTML',
    });
  }

  @Command('menu')
  async onMenu(@Ctx() ctx: BotContext): Promise<void> {
    await ctx.reply(this.messages.menu(), {
      reply_markup: this.keyboards.mainMenu(),
    });
  }

  @Command('status')
  async onStatus(@Ctx() ctx: BotContext): Promise<void> {
    if (!ctx.from) return;

    const userId = ctx.from.id;
    const user = await this.userService.findByTelegramUserId(userId);

    if (!user) {
      await ctx.reply(this.messages.userNotFound());
      return;
    }

    const count = await this.subscriptionService.count(user.id);
    const status = this.messages.status(count, user.isPaused);

    await ctx.reply(status, {
      parse_mode: 'HTML',
    });
  }

  @Command('last')
  async onLast(@Ctx() ctx: BotContext): Promise<void> {
    if (!ctx.message || !('text' in ctx.message)) return;

    const commandText = ctx.message.text;
    const query = commandText.replace(/^\/last\s+/, '').trim();

    this.logger.log(
      `/last command received from user ${ctx.from?.id}, query: "${query}"`,
    );

    if (!query || query === '/last') {
      this.logger.debug('No query provided, showing usage message');
      await ctx.reply(this.messages.lastCommandUsage(), {
        parse_mode: 'HTML',
      });
      return;
    }

    const searchingMsg = await ctx.reply(
      this.messages.lastCommandSearching(query),
    );

    try {
      const userId = ctx.from?.id || 0;

      this.logger.debug(`Starting search for: "${query}"`);
      const result: ScrapeResult = await this.scrapeWorker.scrapeQueryForUser(
        userId,
        query,
      );

      this.logger.debug(
        `Search completed. Listings found: ${result.listings.length}`,
      );

      if (result.error) {
        this.logger.error(`Search failed: ${result.error}`);
        await ctx.telegram.editMessageText(
          ctx.chat?.id,
          searchingMsg.message_id,
          undefined,
          `❌ Ошибка поиска: ${result.error}`,
        );
        return;
      }

      if (!result.listings || result.listings.length === 0) {
        this.logger.warn('No results found');
        await ctx.telegram.editMessageText(
          ctx.chat?.id,
          searchingMsg.message_id,
          undefined,
          this.messages.lastCommandNoResults(query),
        );
        return;
      }

      const listing = result.listings[0];
      this.logger.debug(
        `Sending first listing: "${listing.title}" (ID: ${listing.id})`,
      );

      await ctx.telegram.deleteMessage(
        ctx.chat?.id || 0,
        searchingMsg.message_id,
      );

      await ctx.reply(
        this.messages.lastCommandResult(query, result.listings.length),
        {
          parse_mode: 'HTML',
        },
      );

      await this.sendListing(ctx, listing);
      this.logger.log('/last command completed successfully');
    } catch (error) {
      this.logger.error('Error in /last command:', error);
      await ctx.telegram.editMessageText(
        ctx.chat?.id,
        searchingMsg.message_id,
        undefined,
        this.messages.error(),
      );
    }
  }

  @Action(/^unsubscribe:(\d+)$/)
  async onUnsubscribe(@Ctx() ctx: BotContext): Promise<void> {
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
  async onText(@Ctx() ctx: BotContext): Promise<void> {
    await ctx.reply(this.messages.unknownCommand(), {
      reply_markup: this.keyboards.mainMenu(),
    });
  }

  private async sendListing(ctx: BotContext, listing: Listing): Promise<void> {
    const message = ListingMessageFormatter.format(listing);
    const keyboard = ListingKeyboard.create({
      url: listing.url,
      openButtonText: '🔗 Открыть на list.am',
    });

    await ctx.reply(message, {
      parse_mode: 'HTML',
      reply_markup: keyboard,
    });
  }
}
