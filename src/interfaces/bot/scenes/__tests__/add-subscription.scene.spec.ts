/* eslint-disable @typescript-eslint/unbound-method */
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { Scenes } from 'telegraf';

import { ScrapeWorkerService } from '@list-am-bot/application/scheduler/scrape-worker.service';
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
import { AddSubscriptionScene } from '@list-am-bot/interfaces/bot/scenes/add-subscription.scene';

const mockDate = new Date('2024-10-23T10:00:00.000Z');

type WizardContext = Scenes.WizardContext & BotContext;

interface MockWizardContext {
  from?: { id: number; is_bot: boolean; first_name: string };
  message?: { text: string };
  reply: jest.Mock;
  wizard: {
    next: jest.Mock;
  };
  scene: {
    enter: jest.Mock;
    leave: jest.Mock;
  };
}

describe('AddSubscriptionScene', (): void => {
  let service: AddSubscriptionScene;
  let userService: DeepMockProxy<UserService>;
  let subscriptionService: DeepMockProxy<SubscriptionService>;
  let scrapeWorkerService: DeepMockProxy<ScrapeWorkerService>;
  let keyboards: DeepMockProxy<BotKeyboards>;
  let messages: DeepMockProxy<BotMessages>;
  let ctx: MockWizardContext;

  const createMockContext = (): MockWizardContext => ({
    from: { id: 12345, is_bot: false, first_name: 'Test' },
    message: { text: 'test query' },
    reply: jest.fn().mockResolvedValue({}),
    wizard: {
      next: jest.fn(),
    },
    scene: {
      enter: jest.fn().mockResolvedValue(undefined),
      leave: jest.fn().mockResolvedValue(undefined),
    },
  });

  beforeEach(async (): Promise<void> => {
    userService = mockDeep<UserService>();
    subscriptionService = mockDeep<SubscriptionService>();
    scrapeWorkerService = mockDeep<ScrapeWorkerService>();
    keyboards = mockDeep<BotKeyboards>();
    messages = mockDeep<BotMessages>();

    const configService = mockDeep<ConfigService>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AddSubscriptionScene,
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
          useValue: scrapeWorkerService,
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

    service = module.get<AddSubscriptionScene>(AddSubscriptionScene);
    ctx = createMockContext();

    jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach((): void => {
    jest.clearAllMocks();
  });

  it('should be defined', (): void => {
    expect(service).toBeDefined();
  });

  describe('promptForQuery', (): void => {
    beforeEach((): void => {
      messages.enterQuery.mockReturnValue('Enter query');
      keyboards.cancelButton.mockReturnValue({ keyboard: [] } as never);
    });

    it('should send query prompt', async (): Promise<void> => {
      await service.promptForQuery(ctx as unknown as WizardContext);

      expect(ctx.reply).toHaveBeenCalledWith('Enter query', expect.anything());
    });

    it('should call wizard next', async (): Promise<void> => {
      await service.promptForQuery(ctx as unknown as WizardContext);

      expect(ctx.wizard?.next).toHaveBeenCalled();
    });
  });

  describe('onQueryInput', (): void => {
    let mockUser: UserEntity;
    let mockSubscription: SubscriptionEntity;

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

      mockSubscription = new SubscriptionEntity({
        id: 1,
        userId: 1,
        query: 'test query',
        type: SubscriptionType.QUERY,
        isActive: true,
        createdAt: mockDate,
        updatedAt: mockDate,
      });

      userService.findByTelegramUserId.mockResolvedValue(mockUser);
      subscriptionService.create.mockResolvedValue(mockSubscription);
      scrapeWorkerService.initializeSubscription.mockResolvedValue(undefined);
      messages.subscriptionAdded.mockReturnValue('Subscription added');
      keyboards.mainMenu.mockReturnValue({ inline_keyboard: [] });
    });

    it('should return early when no from context', async (): Promise<void> => {
      ctx.from = undefined;

      await service.onQueryInput(ctx as unknown as WizardContext);

      expect(userService.findByTelegramUserId).not.toHaveBeenCalled();
    });

    it('should handle cancel command', async (): Promise<void> => {
      ctx.message = { text: '/cancel' } as never;
      messages.canceled.mockReturnValue('Canceled');

      await service.onQueryInput(ctx as unknown as WizardContext);

      expect(ctx.scene?.leave).toHaveBeenCalled();
    });

    it('should handle cancel button text', async (): Promise<void> => {
      ctx.message = { text: 'Отмена' } as never;
      messages.canceled.mockReturnValue('Canceled');

      await service.onQueryInput(ctx as unknown as WizardContext);

      expect(ctx.scene?.leave).toHaveBeenCalled();
    });

    it('should show user not found when user is null', async (): Promise<void> => {
      userService.findByTelegramUserId.mockResolvedValue(null);
      messages.userNotFound.mockReturnValue('User not found');

      await service.onQueryInput(ctx as unknown as WizardContext);

      expect(ctx.reply).toHaveBeenCalledWith('User not found', {
        reply_markup: {
          remove_keyboard: true,
        },
      });
    });

    it('should create subscription with query', async (): Promise<void> => {
      await service.onQueryInput(ctx as unknown as WizardContext);

      expect(subscriptionService.create).toHaveBeenCalledWith(1, 'test query');
    });

    it('should initialize subscription', async (): Promise<void> => {
      await service.onQueryInput(ctx as unknown as WizardContext);

      expect(scrapeWorkerService.initializeSubscription).toHaveBeenCalledWith(
        1,
        'test query',
      );
    });

    it('should leave scene after successful creation', async (): Promise<void> => {
      await service.onQueryInput(ctx as unknown as WizardContext);

      expect(ctx.scene?.leave).toHaveBeenCalled();
    });

    it('should handle duplicate subscription error', async (): Promise<void> => {
      subscriptionService.create.mockRejectedValue(
        new DuplicateSubscriptionException('test query'),
      );
      messages.duplicateSubscription.mockReturnValue('Duplicate');

      await service.onQueryInput(ctx as unknown as WizardContext);

      expect(ctx.reply).toHaveBeenCalledWith('Duplicate', {
        reply_markup: {
          remove_keyboard: true,
        },
      });
    });

    it('should handle invalid query error', async (): Promise<void> => {
      subscriptionService.create.mockRejectedValue(
        new InvalidQueryException('Invalid'),
      );
      messages.invalidQuery.mockReturnValue('Invalid query');

      await service.onQueryInput(ctx as unknown as WizardContext);

      expect(ctx.reply).toHaveBeenCalledWith('Invalid query', {
        reply_markup: {
          remove_keyboard: true,
        },
      });
    });

    it('should handle general error', async (): Promise<void> => {
      subscriptionService.create.mockRejectedValue(new Error('General error'));
      messages.error.mockReturnValue('Error');

      await service.onQueryInput(ctx as unknown as WizardContext);

      expect(ctx.reply).toHaveBeenCalledWith('Error', {
        reply_markup: {
          remove_keyboard: true,
        },
      });
    });
  });
});
