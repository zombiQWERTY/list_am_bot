/* eslint-disable @typescript-eslint/unbound-method */
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';

import { SubscriptionService } from '@list-am-bot/application/subscription/subscription.service';
import { UserService } from '@list-am-bot/application/user/user.service';
import { BotContext } from '@list-am-bot/context/context.interface';
import { SubscriptionEntity } from '@list-am-bot/domain/subscription/subscription.entity';
import { UserEntity, UserLanguage } from '@list-am-bot/domain/user/user.entity';
import { MenuActions } from '@list-am-bot/interfaces/bot/actions/menu.actions';
import { BotKeyboards } from '@list-am-bot/interfaces/bot/keyboards/bot.keyboards';
import { BotMessages } from '@list-am-bot/interfaces/bot/messages/bot.messages';

const mockDate = new Date('2024-10-23T10:00:00.000Z');

interface MockContext {
  from?: { id: number; is_bot: boolean; first_name: string };
  callbackQuery?: { data: string };
  answerCbQuery: jest.Mock;
  reply: jest.Mock;
  editMessageText: jest.Mock;
  scene: {
    enter: jest.Mock;
    leave: jest.Mock;
  };
}

describe('MenuActions', (): void => {
  let service: MenuActions;
  let userService: DeepMockProxy<UserService>;
  let subscriptionService: DeepMockProxy<SubscriptionService>;
  let keyboards: DeepMockProxy<BotKeyboards>;
  let messages: DeepMockProxy<BotMessages>;
  let ctx: MockContext;

  const createMockContext = (): MockContext => ({
    from: { id: 12345, is_bot: false, first_name: 'Test' },
    answerCbQuery: jest.fn().mockResolvedValue(true),
    reply: jest.fn().mockResolvedValue({}),
    editMessageText: jest.fn().mockResolvedValue({}),
    scene: {
      enter: jest.fn().mockResolvedValue(undefined),
      leave: jest.fn().mockResolvedValue(undefined),
    },
  });

  beforeEach(async (): Promise<void> => {
    userService = mockDeep<UserService>();
    subscriptionService = mockDeep<SubscriptionService>();
    keyboards = mockDeep<BotKeyboards>();
    messages = mockDeep<BotMessages>();

    const configService = mockDeep<ConfigService>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MenuActions,
        {
          provide: UserService,
          useValue: userService,
        },
        {
          provide: SubscriptionService,
          useValue: subscriptionService,
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

    service = module.get<MenuActions>(MenuActions);
    ctx = createMockContext();
  });

  afterEach((): void => {
    jest.clearAllMocks();
  });

  it('should be defined', (): void => {
    expect(service).toBeDefined();
  });

  describe('showList', (): void => {
    let mockUser: UserEntity;
    let mockSubscriptions: SubscriptionEntity[];

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

      mockSubscriptions = [
        new SubscriptionEntity({
          id: 1,
          userId: 1,
          query: 'test query',
          isActive: true,
          createdAt: mockDate,
          updatedAt: mockDate,
        }),
      ];

      userService.findByTelegramUserId.mockResolvedValue(mockUser);
      subscriptionService.findActiveByUserId.mockResolvedValue(
        mockSubscriptions,
      );
      keyboards.subscriptionList.mockReturnValue({ inline_keyboard: [] });
      messages.subscriptionsList.mockReturnValue('List message');
    });

    it('should return early when no from context', async (): Promise<void> => {
      ctx.from = undefined;

      await service.showList(ctx as unknown as BotContext);

      expect(userService.findByTelegramUserId).not.toHaveBeenCalled();
    });

    it('should find user by telegram id', async (): Promise<void> => {
      await service.showList(ctx as unknown as BotContext);

      expect(userService.findByTelegramUserId).toHaveBeenCalledWith(12345);
    });

    it('should answer callback query', async (): Promise<void> => {
      await service.showList(ctx as unknown as BotContext);

      expect(ctx.answerCbQuery).toHaveBeenCalled();
    });

    it('should show user not found when user is null', async (): Promise<void> => {
      userService.findByTelegramUserId.mockResolvedValue(null);
      messages.userNotFound.mockReturnValue('User not found');

      await service.showList(ctx as unknown as BotContext);

      expect(ctx.reply).toHaveBeenCalledWith('User not found');
    });

    it('should find active subscriptions for user', async (): Promise<void> => {
      await service.showList(ctx as unknown as BotContext);

      expect(subscriptionService.findActiveByUserId).toHaveBeenCalledWith(1);
    });

    it('should show no subscriptions message when empty', async (): Promise<void> => {
      subscriptionService.findActiveByUserId.mockResolvedValue([]);
      messages.noSubscriptions.mockReturnValue('No subscriptions');
      keyboards.mainMenu.mockReturnValue({ inline_keyboard: [] });

      await service.showList(ctx as unknown as BotContext);

      expect(ctx.editMessageText).toHaveBeenCalledWith(
        'No subscriptions',
        expect.anything(),
      );
    });

    it('should show subscriptions list when has subscriptions', async (): Promise<void> => {
      await service.showList(ctx as unknown as BotContext);

      expect(ctx.editMessageText).toHaveBeenCalledWith(
        'List message',
        expect.anything(),
      );
    });

    it('should create keyboard with subscriptions', async (): Promise<void> => {
      await service.showList(ctx as unknown as BotContext);

      expect(keyboards.subscriptionList).toHaveBeenCalledWith(
        mockSubscriptions,
      );
    });
  });

  describe('addSubscription', (): void => {
    it('should answer callback query', async (): Promise<void> => {
      await service.addSubscription(ctx as unknown as BotContext);

      expect(ctx.answerCbQuery).toHaveBeenCalled();
    });

    it('should enter add subscription scene', async (): Promise<void> => {
      await service.addSubscription(ctx as unknown as BotContext);

      expect(ctx.scene.enter).toHaveBeenCalledWith('ADD_SUBSCRIPTION_SCENE');
    });
  });

  describe('confirmClear', (): void => {
    beforeEach((): void => {
      messages.confirmClear.mockReturnValue('Confirm message');
      keyboards.confirmClear.mockReturnValue({ inline_keyboard: [] });
    });

    it('should answer callback query', async (): Promise<void> => {
      await service.confirmClear(ctx as unknown as BotContext);

      expect(ctx.answerCbQuery).toHaveBeenCalled();
    });

    it('should show confirm message', async (): Promise<void> => {
      await service.confirmClear(ctx as unknown as BotContext);

      expect(ctx.editMessageText).toHaveBeenCalledWith(
        'Confirm message',
        expect.anything(),
      );
    });
  });

  describe('clearAll', (): void => {
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
      subscriptionService.deleteAll.mockResolvedValue(undefined);
      messages.allCleared.mockReturnValue('Cleared');
      keyboards.mainMenu.mockReturnValue({ inline_keyboard: [] });
    });

    it('should return early when no from context', async (): Promise<void> => {
      ctx.from = undefined;

      await service.clearAll(ctx as unknown as BotContext);

      expect(userService.findByTelegramUserId).not.toHaveBeenCalled();
    });

    it('should find user by telegram id', async (): Promise<void> => {
      await service.clearAll(ctx as unknown as BotContext);

      expect(userService.findByTelegramUserId).toHaveBeenCalledWith(12345);
    });

    it('should delete all subscriptions', async (): Promise<void> => {
      await service.clearAll(ctx as unknown as BotContext);

      expect(subscriptionService.deleteAll).toHaveBeenCalledWith(1);
    });

    it('should answer callback with success message', async (): Promise<void> => {
      await service.clearAll(ctx as unknown as BotContext);

      expect(ctx.answerCbQuery).toHaveBeenCalledWith('✅ Все подписки удалены');
    });

    it('should show all cleared message', async (): Promise<void> => {
      await service.clearAll(ctx as unknown as BotContext);

      expect(ctx.editMessageText).toHaveBeenCalledWith(
        'Cleared',
        expect.anything(),
      );
    });
  });

  describe('cancelClear', (): void => {
    beforeEach((): void => {
      messages.menu.mockReturnValue('Menu');
      keyboards.mainMenu.mockReturnValue({ inline_keyboard: [] });
    });

    it('should answer callback query', async (): Promise<void> => {
      await service.cancelClear(ctx as unknown as BotContext);

      expect(ctx.answerCbQuery).toHaveBeenCalled();
    });

    it('should show menu', async (): Promise<void> => {
      await service.cancelClear(ctx as unknown as BotContext);

      expect(ctx.editMessageText).toHaveBeenCalledWith(
        'Menu',
        expect.anything(),
      );
    });
  });

  describe('pauseNotifications', (): void => {
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
      userService.pauseNotifications.mockResolvedValue(undefined);
      messages.menu.mockReturnValue('Menu');
      keyboards.mainMenu.mockReturnValue({ inline_keyboard: [] });
    });

    it('should return early when no from context', async (): Promise<void> => {
      ctx.from = undefined;

      await service.pauseNotifications(ctx as unknown as BotContext);

      expect(userService.findByTelegramUserId).not.toHaveBeenCalled();
    });

    it('should pause notifications for user', async (): Promise<void> => {
      await service.pauseNotifications(ctx as unknown as BotContext);

      expect(userService.pauseNotifications).toHaveBeenCalledWith(1);
    });

    it('should answer callback with pause message', async (): Promise<void> => {
      await service.pauseNotifications(ctx as unknown as BotContext);

      expect(ctx.answerCbQuery).toHaveBeenCalledWith(
        '⏸ Рассылка приостановлена',
      );
    });

    it('should show menu with paused state', async (): Promise<void> => {
      await service.pauseNotifications(ctx as unknown as BotContext);

      expect(keyboards.mainMenu).toHaveBeenCalledWith(true);
    });
  });

  describe('resumeNotifications', (): void => {
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
      userService.resumeNotifications.mockResolvedValue(undefined);
      messages.menu.mockReturnValue('Menu');
      keyboards.mainMenu.mockReturnValue({ inline_keyboard: [] });
    });

    it('should return early when no from context', async (): Promise<void> => {
      ctx.from = undefined;

      await service.resumeNotifications(ctx as unknown as BotContext);

      expect(userService.findByTelegramUserId).not.toHaveBeenCalled();
    });

    it('should resume notifications for user', async (): Promise<void> => {
      await service.resumeNotifications(ctx as unknown as BotContext);

      expect(userService.resumeNotifications).toHaveBeenCalledWith(1);
    });

    it('should answer callback with resume message', async (): Promise<void> => {
      await service.resumeNotifications(ctx as unknown as BotContext);

      expect(ctx.answerCbQuery).toHaveBeenCalledWith(
        '▶️ Рассылка возобновлена',
      );
    });

    it('should show menu with active state', async (): Promise<void> => {
      await service.resumeNotifications(ctx as unknown as BotContext);

      expect(keyboards.mainMenu).toHaveBeenCalledWith(false);
    });
  });

  describe('backToMenu', (): void => {
    beforeEach((): void => {
      messages.menu.mockReturnValue('Menu');
      keyboards.mainMenu.mockReturnValue({ inline_keyboard: [] });
    });

    it('should answer callback query', async (): Promise<void> => {
      await service.backToMenu(ctx as unknown as BotContext);

      expect(ctx.answerCbQuery).toHaveBeenCalled();
    });

    it('should show menu', async (): Promise<void> => {
      await service.backToMenu(ctx as unknown as BotContext);

      expect(ctx.editMessageText).toHaveBeenCalledWith(
        'Menu',
        expect.anything(),
      );
    });
  });

  describe('deleteSubscription', (): void => {
    beforeEach((): void => {
      ctx.callbackQuery = { data: 'delete:123' } as never;
      subscriptionService.delete.mockResolvedValue(undefined);
    });

    it('should return early when no callback query', async (): Promise<void> => {
      ctx.callbackQuery = undefined;

      await service.deleteSubscription(ctx as unknown as BotContext);

      expect(subscriptionService.delete).not.toHaveBeenCalled();
    });

    it('should parse subscription id from callback data', async (): Promise<void> => {
      await service.deleteSubscription(ctx as unknown as BotContext);

      expect(subscriptionService.delete).toHaveBeenCalledWith(123);
    });

    it('should answer callback with success message', async (): Promise<void> => {
      await service.deleteSubscription(ctx as unknown as BotContext);

      expect(ctx.answerCbQuery).toHaveBeenCalledWith('✅ Подписка удалена');
    });

    it('should handle invalid format', async (): Promise<void> => {
      ctx.callbackQuery = { data: 'delete:invalid' } as never;

      await service.deleteSubscription(ctx as unknown as BotContext);

      expect(ctx.answerCbQuery).toHaveBeenCalledWith('❌ Неверный формат');
    });

    it('should handle delete error', async (): Promise<void> => {
      subscriptionService.delete.mockRejectedValue(new Error('Delete error'));

      await service.deleteSubscription(ctx as unknown as BotContext);

      expect(ctx.answerCbQuery).toHaveBeenCalledWith('❌ Ошибка при удалении');
    });
  });
});
