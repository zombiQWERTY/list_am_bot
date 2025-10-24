/* eslint-disable @typescript-eslint/unbound-method */
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';

import { ScrapeWorkerService } from '@list-am-bot/application/scheduler/scrape-worker.service';
import { SubscriptionService } from '@list-am-bot/application/subscription/subscription.service';
import { UserService } from '@list-am-bot/application/user/user.service';
import { ScrapeResult } from '@list-am-bot/common/types/listing.types';
import { BotContext } from '@list-am-bot/context/context.interface';
import { UserEntity, UserLanguage } from '@list-am-bot/domain/user/user.entity';
import { BotUpdate } from '@list-am-bot/interfaces/bot/bot.update';
import { BotKeyboards } from '@list-am-bot/interfaces/bot/keyboards/bot.keyboards';
import { BotMessages } from '@list-am-bot/interfaces/bot/messages/bot.messages';

const mockDate = new Date('2024-10-23T10:00:00.000Z');

interface MockContext {
  from?: { id: number; username?: string; is_bot: boolean; first_name: string };
  message?: { text: string };
  chat?: { id: number; type: string };
  callbackQuery?: { data: string };
  reply: jest.Mock;
  answerCbQuery: jest.Mock;
  editMessageReplyMarkup: jest.Mock;
  telegram: {
    sendMessage: jest.Mock;
    editMessageText: jest.Mock;
    deleteMessage: jest.Mock;
  };
}

describe('BotUpdate', (): void => {
  let service: BotUpdate;
  let userService: DeepMockProxy<UserService>;
  let subscriptionService: DeepMockProxy<SubscriptionService>;
  let scrapeWorker: DeepMockProxy<ScrapeWorkerService>;
  let keyboards: DeepMockProxy<BotKeyboards>;
  let messages: DeepMockProxy<BotMessages>;
  let ctx: MockContext;

  const createMockContext = (): MockContext => ({
    from: {
      id: 12345,
      username: 'testuser',
      is_bot: false,
      first_name: 'Test',
    },
    chat: { id: 12345, type: 'private' },
    reply: jest.fn().mockResolvedValue({}),
    answerCbQuery: jest.fn().mockResolvedValue(true),
    editMessageReplyMarkup: jest.fn().mockResolvedValue({}),
    telegram: {
      sendMessage: jest.fn().mockResolvedValue({}),
      editMessageText: jest.fn().mockResolvedValue({}),
      deleteMessage: jest.fn().mockResolvedValue(true),
    },
  });

  beforeEach(async (): Promise<void> => {
    userService = mockDeep<UserService>();
    subscriptionService = mockDeep<SubscriptionService>();
    scrapeWorker = mockDeep<ScrapeWorkerService>();
    keyboards = mockDeep<BotKeyboards>();
    messages = mockDeep<BotMessages>();

    const configService = mockDeep<ConfigService>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BotUpdate,
        {
          provide: UserService,
          useValue: userService,
        },
        {
          provide: SubscriptionService,
          useValue: subscriptionService,
        },
        {
          provide: ScrapeWorkerService,
          useValue: scrapeWorker,
        },
        {
          provide: BotKeyboards,
          useValue: keyboards,
        },
        {
          provide: BotMessages,
          useValue: messages,
        },
        {
          provide: ConfigService,
          useValue: configService,
        },
      ],
    }).compile();

    service = module.get<BotUpdate>(BotUpdate);
    ctx = createMockContext();

    jest.spyOn(Logger.prototype, 'log').mockImplementation();
    jest.spyOn(Logger.prototype, 'debug').mockImplementation();
    jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach((): void => {
    jest.clearAllMocks();
  });

  it('should be defined', (): void => {
    expect(service).toBeDefined();
  });

  describe('onStart', (): void => {
    beforeEach((): void => {
      userService.findOrCreate.mockResolvedValue({} as UserEntity);
      messages.welcome.mockReturnValue('Welcome message');
      keyboards.mainMenu.mockReturnValue({ inline_keyboard: [] });
    });

    it('should return early when no from context', async (): Promise<void> => {
      ctx.from = undefined;

      await service.onStart(ctx as unknown as BotContext);

      expect(userService.findOrCreate).not.toHaveBeenCalled();
    });

    it('should call findOrCreate with userId and username', async (): Promise<void> => {
      await service.onStart(ctx as unknown as BotContext);

      expect(userService.findOrCreate).toHaveBeenCalledWith(12345, 'testuser');
    });

    it('should call findOrCreate with undefined username', async (): Promise<void> => {
      ctx.from = { id: 12345, is_bot: false, first_name: 'Test' };

      await service.onStart(ctx as unknown as BotContext);

      expect(userService.findOrCreate).toHaveBeenCalledWith(12345, undefined);
    });

    it('should send welcome message', async (): Promise<void> => {
      await service.onStart(ctx as unknown as BotContext);

      expect(ctx.reply).toHaveBeenCalledWith(
        'Welcome message',
        expect.anything(),
      );
    });

    it('should include main menu keyboard', async (): Promise<void> => {
      await service.onStart(ctx as unknown as BotContext);

      expect(keyboards.mainMenu).toHaveBeenCalled();
    });
  });

  describe('onHelp', (): void => {
    beforeEach((): void => {
      messages.help.mockReturnValue('Help message');
    });

    it('should send help message', async (): Promise<void> => {
      await service.onHelp(ctx as unknown as BotContext);

      expect(ctx.reply).toHaveBeenCalledWith('Help message', expect.anything());
    });
  });

  describe('onMenu', (): void => {
    beforeEach((): void => {
      messages.menu.mockReturnValue('Menu message');
      keyboards.mainMenu.mockReturnValue({ inline_keyboard: [] });
    });

    it('should send menu message', async (): Promise<void> => {
      await service.onMenu(ctx as unknown as BotContext);

      expect(ctx.reply).toHaveBeenCalledWith('Menu message', expect.anything());
    });
  });

  describe('onStatus', (): void => {
    let mockUser: UserEntity;

    beforeEach((): void => {
      mockUser = new UserEntity({
        id: 1,
        telegramUserId: 12345,
        username: 'testuser',
        language: UserLanguage.EN,
        isPaused: false,
        createdAt: mockDate,
        updatedAt: mockDate,
      });

      userService.findByTelegramUserId.mockResolvedValue(mockUser);
      subscriptionService.count.mockResolvedValue(5);
      messages.status.mockReturnValue('Status message');
    });

    it('should return early when no from context', async (): Promise<void> => {
      ctx.from = undefined;

      await service.onStatus(ctx as unknown as BotContext);

      expect(userService.findByTelegramUserId).not.toHaveBeenCalled();
    });

    it('should show user not found when user is null', async (): Promise<void> => {
      userService.findByTelegramUserId.mockResolvedValue(null);
      messages.userNotFound.mockReturnValue('User not found');

      await service.onStatus(ctx as unknown as BotContext);

      expect(ctx.reply).toHaveBeenCalledWith('User not found');
    });

    it('should get subscription count for user', async (): Promise<void> => {
      await service.onStatus(ctx as unknown as BotContext);

      expect(subscriptionService.count).toHaveBeenCalledWith(1);
    });

    it('should send status message', async (): Promise<void> => {
      await service.onStatus(ctx as unknown as BotContext);

      expect(messages.status).toHaveBeenCalledWith(5, false);
    });
  });

  describe('onLast', (): void => {
    let mockResult: ScrapeResult;

    beforeEach((): void => {
      ctx.message = { text: '/last test query' };

      mockResult = {
        query: 'test query',
        listings: [
          {
            id: '123',
            title: 'Test Listing',
            priceText: '100 AMD',
            priceValue: 100,
            url: 'https://example.com',
            locationText: 'Yerevan',
            imageUrl: 'https://example.com/image.jpg',
            postedAtText: '1 час назад',
          },
        ],
        fetchedAt: mockDate,
      };

      scrapeWorker.scrapeQueryForUser.mockResolvedValue(mockResult);
      messages.lastCommandSearching.mockReturnValue('Searching...');
      messages.lastCommandResult.mockReturnValue('Results');
    });

    it('should return early when no message', async (): Promise<void> => {
      ctx.message = undefined;

      await service.onLast(ctx as unknown as BotContext);

      expect(ctx.reply).not.toHaveBeenCalled();
    });

    it('should show usage when query is empty', async (): Promise<void> => {
      ctx.message = { text: '/last' };
      messages.lastCommandUsage.mockReturnValue('Usage message');

      await service.onLast(ctx as unknown as BotContext);

      expect(ctx.reply).toHaveBeenCalledWith(
        'Usage message',
        expect.anything(),
      );
    });

    it('should show usage when query is just spaces', async (): Promise<void> => {
      ctx.message = { text: '/last   ' };
      messages.lastCommandUsage.mockReturnValue('Usage message');

      await service.onLast(ctx as unknown as BotContext);

      expect(ctx.reply).toHaveBeenCalledWith(
        'Usage message',
        expect.anything(),
      );
    });

    it('should send searching message', async (): Promise<void> => {
      ctx.reply.mockResolvedValueOnce({ message_id: 1 } as never);

      await service.onLast(ctx as unknown as BotContext);

      expect(messages.lastCommandSearching).toHaveBeenCalledWith('test query');
    });

    it('should call scrapeQueryForUser with query', async (): Promise<void> => {
      ctx.reply.mockResolvedValueOnce({ message_id: 1 } as never);

      await service.onLast(ctx as unknown as BotContext);

      expect(scrapeWorker.scrapeQueryForUser).toHaveBeenCalledWith(
        12345,
        'test query',
      );
    });

    it('should use userId 0 when no from context', async (): Promise<void> => {
      ctx.reply.mockResolvedValueOnce({ message_id: 1 } as never);
      ctx.from = undefined;

      await service.onLast(ctx as unknown as BotContext);

      expect(scrapeWorker.scrapeQueryForUser).toHaveBeenCalledWith(
        0,
        'test query',
      );
    });

    it('should handle error from scraper', async (): Promise<void> => {
      ctx.reply.mockResolvedValueOnce({ message_id: 1 } as never);
      messages.searchError.mockReturnValue('Search error: Scrape failed');

      mockResult.error = 'Scrape failed';

      await service.onLast(ctx as unknown as BotContext);

      expect(messages.searchError).toHaveBeenCalledWith('Scrape failed');
    });

    it('should not send listing when error occurs', async (): Promise<void> => {
      ctx.reply.mockResolvedValueOnce({ message_id: 1 } as never);

      mockResult.error = 'Scrape failed';

      await service.onLast(ctx as unknown as BotContext);

      expect(ctx.telegram.deleteMessage).not.toHaveBeenCalled();
    });

    it('should handle no results', async (): Promise<void> => {
      ctx.reply.mockResolvedValueOnce({ message_id: 1 } as never);

      mockResult.listings = [];
      messages.lastCommandNoResults.mockReturnValue('No results');

      await service.onLast(ctx as unknown as BotContext);

      expect(ctx.telegram.editMessageText).toHaveBeenCalledWith(
        12345,
        1,
        undefined,
        'No results',
      );
    });

    it('should delete searching message when results found', async (): Promise<void> => {
      ctx.reply.mockResolvedValueOnce({ message_id: 1 } as never);

      await service.onLast(ctx as unknown as BotContext);

      expect(ctx.telegram.deleteMessage).toHaveBeenCalledWith(12345, 1);
    });

    it('should send results summary', async (): Promise<void> => {
      ctx.reply.mockResolvedValueOnce({ message_id: 1 } as never);

      await service.onLast(ctx as unknown as BotContext);

      expect(messages.lastCommandResult).toHaveBeenCalledWith('test query', 1);
    });

    it('should send listing with HTML parse mode', async (): Promise<void> => {
      ctx.reply.mockResolvedValueOnce({ message_id: 1 } as never);

      await service.onLast(ctx as unknown as BotContext);

      expect(ctx.reply).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ parse_mode: 'HTML' }),
      );
    });

    it('should handle exception during scraping', async (): Promise<void> => {
      ctx.reply.mockResolvedValueOnce({ message_id: 1 } as never);
      scrapeWorker.scrapeQueryForUser.mockRejectedValue(
        new Error('Network error'),
      );
      messages.error.mockReturnValue('General error');

      await service.onLast(ctx as unknown as BotContext);

      expect(ctx.telegram.editMessageText).toHaveBeenCalledWith(
        12345,
        1,
        undefined,
        'General error',
      );
    });

    it('should trim query before searching', async (): Promise<void> => {
      ctx.message = { text: '/last  test query  ' };
      ctx.reply.mockResolvedValueOnce({ message_id: 1 } as never);

      await service.onLast(ctx as unknown as BotContext);

      expect(scrapeWorker.scrapeQueryForUser).toHaveBeenCalledWith(
        12345,
        'test query',
      );
    });
  });

  describe('onUnsubscribe', (): void => {
    beforeEach((): void => {
      ctx.callbackQuery = { data: 'unsubscribe:123' };
      subscriptionService.delete.mockResolvedValue(undefined);
      messages.subscriptionDeleted.mockReturnValue('✅ Подписка удалена');
      messages.invalidFormat.mockReturnValue('❌ Неверный формат');
      messages.deleteError.mockReturnValue('❌ Ошибка при удалении подписки');
    });

    it('should return early when no callback query', async (): Promise<void> => {
      ctx.callbackQuery = undefined;

      await service.onUnsubscribe(ctx as unknown as BotContext);

      expect(subscriptionService.delete).not.toHaveBeenCalled();
    });

    it('should parse subscription id from callback data', async (): Promise<void> => {
      await service.onUnsubscribe(ctx as unknown as BotContext);

      expect(subscriptionService.delete).toHaveBeenCalledWith(123);
    });

    it('should answer callback with success message', async (): Promise<void> => {
      await service.onUnsubscribe(ctx as unknown as BotContext);

      expect(messages.subscriptionDeleted).toHaveBeenCalled();
    });

    it('should remove inline keyboard', async (): Promise<void> => {
      await service.onUnsubscribe(ctx as unknown as BotContext);

      expect(ctx.editMessageReplyMarkup).toHaveBeenCalledWith({
        inline_keyboard: [],
      });
    });

    it('should handle invalid format', async (): Promise<void> => {
      ctx.callbackQuery = { data: 'unsubscribe:invalid' };

      await service.onUnsubscribe(ctx as unknown as BotContext);

      expect(messages.invalidFormat).toHaveBeenCalled();
    });

    it('should not call delete with invalid format', async (): Promise<void> => {
      ctx.callbackQuery = { data: 'unsubscribe:invalid' };

      await service.onUnsubscribe(ctx as unknown as BotContext);

      expect(subscriptionService.delete).not.toHaveBeenCalled();
    });

    it('should handle delete error', async (): Promise<void> => {
      subscriptionService.delete.mockRejectedValue(new Error('Delete error'));

      await service.onUnsubscribe(ctx as unknown as BotContext);

      expect(messages.deleteError).toHaveBeenCalled();
    });

    it('should not edit keyboard on delete error', async (): Promise<void> => {
      subscriptionService.delete.mockRejectedValue(new Error('Delete error'));

      await service.onUnsubscribe(ctx as unknown as BotContext);

      expect(ctx.editMessageReplyMarkup).not.toHaveBeenCalled();
    });
  });

  describe('onText', (): void => {
    beforeEach((): void => {
      messages.unknownCommand.mockReturnValue('Unknown command');
      keyboards.mainMenu.mockReturnValue({ inline_keyboard: [] });
    });

    it('should send unknown command message', async (): Promise<void> => {
      await service.onText(ctx as unknown as BotContext);

      expect(ctx.reply).toHaveBeenCalledWith(
        'Unknown command',
        expect.anything(),
      );
    });

    it('should include main menu keyboard', async (): Promise<void> => {
      await service.onText(ctx as unknown as BotContext);

      expect(keyboards.mainMenu).toHaveBeenCalled();
    });
  });
});
