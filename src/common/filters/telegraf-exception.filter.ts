import { ArgumentsHost, Catch, ExceptionFilter, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TelegrafArgumentsHost } from 'nestjs-telegraf';
import { Context } from 'telegraf';

import { escapeHtml } from '@list-am-bot/common/utils/html.util';

@Catch()
export class TelegrafExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(TelegrafExceptionFilter.name);

  constructor(private readonly configService: ConfigService) {}

  async catch(exception: Error, host: ArgumentsHost): Promise<void> {
    const telegrafHost = TelegrafArgumentsHost.create(host);
    const ctx = telegrafHost.getContext<Context>();

    this.logger.error(`Telegraf error: ${exception.message}`, exception.stack, {
      update: ctx.update,
      chat: ctx.chat,
      from: ctx.from,
    });

    const adminUserId = this.configService.get<number>('BOT_INCIDENTS_USER_ID');
    const nodeEnv = this.configService.get<string>('NODE_ENV', 'development');

    if (adminUserId && ctx.telegram) {
      try {
        const errorMessage = this.formatErrorMessage(exception, ctx, nodeEnv);
        await ctx.telegram.sendMessage(adminUserId, errorMessage, {
          parse_mode: 'HTML',
        });
      } catch (notificationError) {
        this.logger.error(
          'Failed to send error notification to admin',
          notificationError,
        );
      }
    }

    try {
      if (ctx.chat) {
        await ctx.reply(
          '❌ Произошла непредвиденная ошибка. Попробуйте позже или обратитесь в поддержку (@zinovev_space).',
        );
      }
    } catch (replyError) {
      this.logger.error('Failed to send error message to user', replyError);
    }
  }

  private formatErrorMessage(
    exception: Error,
    ctx: Context,
    environment: string,
  ): string {
    const lines: string[] = [
      `<b>🚨 Error in ${environment} environment</b>`,
      '',
      `<b>Error:</b> ${escapeHtml(exception.message)}`,
      '',
    ];

    if (ctx.from) {
      lines.push(
        `<b>User:</b> ${ctx.from.id} ${ctx.from.username ? `(@${ctx.from.username})` : ''}`,
      );
    }

    if (ctx.chat) {
      lines.push(`<b>Chat:</b> ${ctx.chat.id} (${ctx.chat.type})`);
    }

    if (ctx.message && 'text' in ctx.message) {
      lines.push(`<b>Message:</b> ${escapeHtml(ctx.message.text)}`);
    }

    if (exception.stack) {
      const stackLines = exception.stack.split('\n').slice(0, 5);
      lines.push('', '<b>Stack trace:</b>', '<code>');
      lines.push(...stackLines.map((line): string => escapeHtml(line)));
      lines.push('</code>');
    }

    return lines.join('\n');
  }
}
