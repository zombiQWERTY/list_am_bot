/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { Scenes } from 'telegraf';

import { SubscriptionService } from '@list-am-bot/application/subscription/subscription.service';
import { UserService } from '@list-am-bot/application/user/user.service';
import {
  DuplicateSubscriptionException,
  InvalidQueryException,
} from '@list-am-bot/common/exceptions/bot.exceptions';
import { BotContext } from '@list-am-bot/context/context.interface';
import {
  SubscriptionEntity,
  SubscriptionType,
} from '@list-am-bot/domain/subscription/subscription.entity';
import { UserEntity, UserLanguage } from '@list-am-bot/domain/user/user.entity';
import { BotKeyboards } from '@list-am-bot/interfaces/bot/keyboards/bot.keyboards';
import { BotMessages } from '@list-am-bot/interfaces/bot/messages/bot.messages';
import { AddUrlSubscriptionScene } from '@list-am-bot/interfaces/bot/scenes/add-url-subscription.scene';

const mockDate = new Date('2024-10-23T10:00:00.000Z');

type WizardContext = Scenes.WizardContext & BotContext;

interface MockContext {
  from?: { id: number; is_bot: boolean; first_name: string };
  message?: { text: string };
  wizard: {
    state: Record<string, unknown>;
    next: jest.Mock;
  };
  scene: {
    enter: jest.Mock;
    leave: jest.Mock;
  };
  reply: jest.Mock;
  answerCbQuery: jest.Mock;
}

function createMockContext(): MockContext {
  return {
    from: { id: 123, is_bot: false, first_name: 'Test User' },
    wizard: {
      state: {},
      next: jest.fn(),
    },
    scene: {
      enter: jest.fn(),
      leave: jest.fn(),
    },
    reply: jest.fn(),
    answerCbQuery: jest.fn(),
  };
}

describe('AddUrlSubscriptionScene', (): void => {
  let scene: AddUrlSubscriptionScene;
  let userService: DeepMockProxy<UserService>;
  let subscriptionService: DeepMockProxy<SubscriptionService>;
  let keyboards: DeepMockProxy<BotKeyboards>;
  let messages: DeepMockProxy<BotMessages>;
  let configService: DeepMockProxy<ConfigService>;

  beforeEach(async (): Promise<void> => {
    userService = mockDeep<UserService>();
    subscriptionService = mockDeep<SubscriptionService>();
    keyboards = mockDeep<BotKeyboards>();
    messages = mockDeep<BotMessages>();
    configService = mockDeep<ConfigService>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AddUrlSubscriptionScene,
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

    scene = module.get<AddUrlSubscriptionScene>(AddUrlSubscriptionScene);

    jest.spyOn(Logger.prototype, 'log').mockImplementation();
    jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach((): void => {
    jest.clearAllMocks();
  });

  it('should be defined', (): void => {
    expect(scene).toBeDefined();
  });

  describe('promptForUrl', (): void => {
    let ctx: MockContext;

    beforeEach((): void => {
      ctx = createMockContext();

      messages.enterUrl.mockReturnValue('Enter URL');
      keyboards.cancelButton.mockReturnValue({
        keyboard: [[{ text: 'Cancel' }]],
        resize_keyboard: true,
        one_time_keyboard: true,
      });
    });

    it('should send URL prompt', async (): Promise<void> => {
      await scene.promptForUrl(ctx as unknown as WizardContext);

      expect(ctx.reply).toHaveBeenCalledWith('Enter URL', {
        parse_mode: 'HTML',
        reply_markup: expect.any(Object),
      });
    });

    it('should move to next wizard step', async (): Promise<void> => {
      await scene.promptForUrl(ctx as unknown as WizardContext);

      expect(ctx.wizard.next).toHaveBeenCalled();
    });
  });

  describe('onUrlInput', (): void => {
    let ctx: MockContext;

    beforeEach((): void => {
      ctx = createMockContext();
      ctx.message = { text: 'https://www.list.am/category/212' };

      messages.enterSubscriptionName.mockReturnValue('Enter name');
      messages.invalidUrl.mockReturnValue('Invalid URL');
      messages.canceled.mockReturnValue('Canceled');
      keyboards.cancelButton.mockReturnValue({
        keyboard: [[{ text: 'Cancel' }]],
        resize_keyboard: true,
        one_time_keyboard: true,
      });
    });

    it('should accept valid list.am URL', async (): Promise<void> => {
      await scene.onUrlInput(ctx as unknown as WizardContext);

      expect(ctx.reply).toHaveBeenCalledWith('Enter name', {
        parse_mode: 'HTML',
        reply_markup: expect.any(Object),
      });
      expect(ctx.wizard.next).toHaveBeenCalled();
    });

    it('should reject non-list.am URL', async (): Promise<void> => {
      ctx.message = { text: 'https://google.com' };

      await scene.onUrlInput(ctx as unknown as WizardContext);

      expect(ctx.reply).toHaveBeenCalledWith('Invalid URL', {
        parse_mode: 'HTML',
        reply_markup: expect.any(Object),
      });
      expect(ctx.wizard.next).not.toHaveBeenCalled();
    });

    it('should handle cancel command', async (): Promise<void> => {
      ctx.message = { text: '/cancel' };
      keyboards.mainMenu.mockReturnValue({ inline_keyboard: [] });

      await scene.onUrlInput(ctx as unknown as WizardContext);

      expect(ctx.reply).toHaveBeenCalledWith('Canceled', {
        reply_markup: expect.any(Object),
      });
      expect(ctx.scene.leave).toHaveBeenCalled();
    });

    it('should move to name input on valid URL', async (): Promise<void> => {
      ctx.message = { text: 'https://www.list.am/category/212?price1=1000' };

      await scene.onUrlInput(ctx as unknown as WizardContext);

      expect(ctx.reply).toHaveBeenCalledWith('Enter name', {
        parse_mode: 'HTML',
        reply_markup: expect.any(Object),
      });
      expect(ctx.wizard.next).toHaveBeenCalled();
    });
  });

  describe('onNameInput', (): void => {
    let ctx: MockContext;
    let mockUser: UserEntity;
    let mockSubscription: SubscriptionEntity;

    beforeEach((): void => {
      ctx = createMockContext();
      ctx.message = { text: 'My Subscription' };
      ctx.wizard.state.url = 'https://www.list.am/category/212';

      mockUser = new UserEntity({
        id: 1,
        telegramUserId: 123,
        username: 'testuser',
        language: UserLanguage.RU,
        isPaused: false,
        createdAt: mockDate,
        updatedAt: mockDate,
      });

      mockSubscription = new SubscriptionEntity({
        id: 1,
        userId: 1,
        query: 'https://www.list.am/category/212',
        name: 'My Subscription',
        type: SubscriptionType.URL,
        isActive: true,
        createdAt: mockDate,
        updatedAt: mockDate,
      });

      userService.findByTelegramUserId.mockResolvedValue(mockUser);
      subscriptionService.createFromUrl.mockResolvedValue(mockSubscription);
      messages.urlSubscriptionAdded.mockReturnValue('Subscription added');
      messages.invalidSubscriptionName.mockReturnValue('Invalid name');
      messages.canceled.mockReturnValue('Canceled');
      messages.userNotFound.mockReturnValue('User not found');
      keyboards.mainMenu.mockReturnValue({ inline_keyboard: [] });
      keyboards.cancelButton.mockReturnValue({
        keyboard: [[{ text: 'Cancel' }]],
        resize_keyboard: true,
        one_time_keyboard: true,
      });
    });

    it('should create subscription with valid name', async (): Promise<void> => {
      await scene.onNameInput(ctx as unknown as WizardContext);

      expect(subscriptionService.createFromUrl).toHaveBeenCalledWith(
        mockUser.id,
        'https://www.list.am/category/212',
        'My Subscription',
      );
    });

    it('should send success message', async (): Promise<void> => {
      await scene.onNameInput(ctx as unknown as WizardContext);

      expect(ctx.reply).toHaveBeenCalledWith('Subscription added', {
        parse_mode: 'HTML',
        reply_markup: expect.any(Object),
      });
      expect(ctx.scene.leave).toHaveBeenCalled();
    });

    it('should reject too short name', async (): Promise<void> => {
      ctx.message = { text: 'ab' };

      await scene.onNameInput(ctx as unknown as WizardContext);

      expect(ctx.reply).toHaveBeenCalledWith('Invalid name', {
        parse_mode: 'HTML',
        reply_markup: expect.any(Object),
      });
      expect(subscriptionService.createFromUrl).not.toHaveBeenCalled();
    });

    it('should reject too long name', async (): Promise<void> => {
      ctx.message = { text: 'a'.repeat(101) };

      await scene.onNameInput(ctx as unknown as WizardContext);

      expect(ctx.reply).toHaveBeenCalledWith('Invalid name', {
        parse_mode: 'HTML',
        reply_markup: expect.any(Object),
      });
      expect(subscriptionService.createFromUrl).not.toHaveBeenCalled();
    });

    it('should handle duplicate subscription error', async (): Promise<void> => {
      subscriptionService.createFromUrl.mockRejectedValue(
        new DuplicateSubscriptionException('Duplicate'),
      );
      messages.duplicateUrlSubscription.mockReturnValue(
        'Duplicate subscription',
      );

      await scene.onNameInput(ctx as unknown as WizardContext);

      expect(ctx.reply).toHaveBeenCalledWith('Duplicate subscription', {
        reply_markup: expect.any(Object),
      });
      expect(ctx.scene.leave).toHaveBeenCalled();
    });

    it('should handle invalid query error', async (): Promise<void> => {
      subscriptionService.createFromUrl.mockRejectedValue(
        new InvalidQueryException('Invalid'),
      );
      messages.invalidQuery.mockReturnValue('Invalid query');

      await scene.onNameInput(ctx as unknown as WizardContext);

      expect(ctx.reply).toHaveBeenCalledWith('Invalid query', {
        reply_markup: expect.any(Object),
      });
      expect(ctx.scene.leave).toHaveBeenCalled();
    });

    it('should handle generic error', async (): Promise<void> => {
      subscriptionService.createFromUrl.mockRejectedValue(
        new Error('Something went wrong'),
      );
      messages.error.mockReturnValue('Error occurred');

      await scene.onNameInput(ctx as unknown as WizardContext);

      expect(ctx.reply).toHaveBeenCalledWith('Error occurred', {
        reply_markup: expect.any(Object),
      });
      expect(ctx.scene.leave).toHaveBeenCalled();
    });

    it('should handle user not found', async (): Promise<void> => {
      userService.findByTelegramUserId.mockResolvedValue(null);

      await scene.onNameInput(ctx as unknown as WizardContext);

      expect(ctx.reply).toHaveBeenCalledWith('User not found', {
        reply_markup: {
          remove_keyboard: true,
        },
      });
      expect(ctx.scene.leave).toHaveBeenCalled();
      expect(subscriptionService.createFromUrl).not.toHaveBeenCalled();
    });

    it('should handle cancel command', async (): Promise<void> => {
      ctx.message = { text: '/cancel' };

      await scene.onNameInput(ctx as unknown as WizardContext);

      expect(ctx.reply).toHaveBeenCalledWith('Canceled', {
        reply_markup: expect.any(Object),
      });
      expect(ctx.scene.leave).toHaveBeenCalled();
    });

    it('should handle Russian cancel button', async (): Promise<void> => {
      ctx.message = { text: 'Отмена' };

      await scene.onNameInput(ctx as unknown as WizardContext);

      expect(ctx.reply).toHaveBeenCalledWith('Canceled', {
        reply_markup: expect.any(Object),
      });
      expect(ctx.scene.leave).toHaveBeenCalled();
    });
  });
});
