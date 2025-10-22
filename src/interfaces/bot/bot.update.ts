import { Injectable, Logger } from '@nestjs/common';
import { Update, Start, Help, Command, On, Ctx, Action } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import { InlineKeyboardMarkup } from 'telegraf/types';

import { ScrapeWorkerService } from '@list-am-bot/application/scheduler/scrape-worker.service';
import { SubscriptionService } from '@list-am-bot/application/subscription/subscription.service';
import { UserService } from '@list-am-bot/application/user/user.service';
import { Listing } from '@list-am-bot/common/types/listing.types';
import { BotKeyboards } from '@list-am-bot/interfaces/bot/keyboards/bot.keyboards';
import { BotMessages } from '@list-am-bot/interfaces/bot/messages/bot.messages';

@Update()
@Injectable()
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
    await ctx.reply(this.messages.help(), {
      parse_mode: 'HTML',
    });
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

    await ctx.reply(status, {
      parse_mode: 'HTML',
    });
  }

  @Command('last')
  async onLast(@Ctx() ctx: Context): Promise<void> {
    if (!ctx.message || !('text' in ctx.message)) return;

    const commandText = ctx.message.text;
    const query = commandText.replace(/^\/last\s+/, '').trim();

    this.logger.log(
      `/last command received from user ${ctx.from?.id}, query: "${query}"`,
    );

    // Check if query is provided
    if (!query || query === '/last') {
      this.logger.debug('No query provided, showing usage message');
      await ctx.reply(this.messages.lastCommandUsage(), {
        parse_mode: 'HTML',
      });
      return;
    }

    // Send "searching" message
    const searchingMsg = await ctx.reply(
      this.messages.lastCommandSearching(query),
    );

    try {
      // Get user ID for queue tracking
      const userId = ctx.from?.id || 0;

      // Perform search through queue
      this.logger.debug(`Starting search for: "${query}"`);
      const result = await this.scrapeWorker.scrapeQueryForUser(userId, query);

      this.logger.debug(
        `Search completed. Listings found: ${result.listings.length}`,
      );

      // Check for errors
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

      // Check if there are results
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

      // Get the first (latest) listing
      const listing = result.listings[0] as Listing;
      this.logger.debug(
        `Sending first listing: "${listing.title}" (ID: ${listing.id})`,
      );

      // Delete searching message
      await ctx.telegram.deleteMessage(
        ctx.chat?.id || 0,
        searchingMsg.message_id,
      );

      // Send result header
      await ctx.reply(
        this.messages.lastCommandResult(query, result.listings.length),
        {
          parse_mode: 'HTML',
        },
      );

      // Send listing
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

  private async sendListing(ctx: Context, listing: Listing): Promise<void> {
    const message = this.formatListingMessage(listing);
    const keyboard = this.createListingKeyboard(listing);

    await ctx.reply(message, {
      parse_mode: 'HTML',
      reply_markup: keyboard,
    });
  }

  private formatListingMessage(listing: Listing): string {
    const parts: string[] = [`<b>${this.escapeHtml(listing.title)}</b>`];

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

  private createListingKeyboard(listing: Listing): InlineKeyboardMarkup {
    return {
      inline_keyboard: [
        [
          {
            text: '🔗 Открыть на list.am',
            url: listing.url,
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
