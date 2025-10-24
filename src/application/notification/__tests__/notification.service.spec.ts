/* eslint-disable @typescript-eslint/unbound-method */
import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { Context, Telegraf } from 'telegraf';

import { MetricsService } from '@list-am-bot/application/monitoring/metrics.service';
import { NotificationService } from '@list-am-bot/application/notification/notification.service';
import { SubscriptionService } from '@list-am-bot/application/subscription/subscription.service';
import { UserService } from '@list-am-bot/application/user/user.service';
import { ListingMessageFormatter } from '@list-am-bot/common/formatters/listing-message.formatter';
import { ListingKeyboard } from '@list-am-bot/common/keyboards/listing.keyboard';
import {
  Listing,
  NotificationPayload,
} from '@list-am-bot/common/types/listing.types';
import { LIST_AM_BOT } from '@list-am-bot/constants';
import { DeliveryEntity } from '@list-am-bot/domain/delivery/delivery.entity';
import {
  DeliveryRepositoryPort,
  IDeliveryRepository,
} from '@list-am-bot/domain/delivery/ports/delivery.repository.port';
import { UserEntity, UserLanguage } from '@list-am-bot/domain/user/user.entity';

const mockDate = new Date('2024-10-23T10:00:00.000Z');
const RealDate = Date;

global.Date = class extends RealDate {
  constructor() {
    super();
    return mockDate;
  }

  static now(): number {
    return mockDate.getTime();
  }
} as DateConstructor;

describe('NotificationService', (): void => {
  let service: NotificationService;
  let bot: DeepMockProxy<Telegraf<Context>>;
  let deliveryRepository: DeepMockProxy<IDeliveryRepository>;
  let userService: DeepMockProxy<UserService>;
  let subscriptionService: DeepMockProxy<SubscriptionService>;
  let metricsService: DeepMockProxy<MetricsService>;

  beforeEach(async (): Promise<void> => {
    bot = mockDeep<Telegraf<Context>>();
    deliveryRepository = mockDeep<IDeliveryRepository>();
    userService = mockDeep<UserService>();
    subscriptionService = mockDeep<SubscriptionService>();
    metricsService = mockDeep<MetricsService>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        {
          provide: `${LIST_AM_BOT}Bot`,
          useValue: bot,
        },
        {
          provide: DeliveryRepositoryPort,
          useValue: deliveryRepository,
        },
        {
          provide: UserService,
          useValue: userService,
        },
        {
          provide: SubscriptionService,
          useValue: subscriptionService,
        },
        {
          provide: MetricsService,
          useValue: metricsService,
        },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);

    jest.spyOn(Logger.prototype, 'debug').mockImplementation();
    jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    jest.spyOn(Logger.prototype, 'error').mockImplementation();

    jest
      .spyOn(ListingMessageFormatter, 'format')
      .mockReturnValue('Formatted message');
    jest.spyOn(ListingKeyboard, 'create').mockReturnValue({
      inline_keyboard: [],
    });
  });

  afterEach((): void => {
    jest.clearAllMocks();
  });

  it('should be defined', (): void => {
    expect(service).toBeDefined();
  });

  describe('sendListingNotification', (): void => {
    let payload: NotificationPayload;
    let mockListing: Listing;
    let mockUser: UserEntity;

    beforeEach((): void => {
      mockListing = {
        id: 'listing-123',
        title: 'Test Listing',
        priceText: '$100',
        priceValue: 100,
        locationText: 'Yerevan',
        url: 'https://list.am/item/listing-123',
        imageUrl: 'https://list.am/image.jpg',
        postedAtText: 'Today',
      };

      payload = {
        userTelegramId: 12345,
        subscriptionId: 1,
        query: 'test query',
        listing: mockListing,
      };

      mockUser = new UserEntity({
        id: 1,
        telegramUserId: 12345,
        username: 'testuser',
        language: UserLanguage.EN,
        isPaused: false,
        createdAt: mockDate,
        updatedAt: mockDate,
      });

      const mockDelivery = new DeliveryEntity({
        id: 1,
        userId: mockUser.id,
        subscriptionId: payload.subscriptionId,
        listingId: payload.listing.id,
        deliveredAt: mockDate,
        messageId: '456',
      });

      userService.findByTelegramUserId.mockResolvedValue(mockUser);
      deliveryRepository.exists.mockResolvedValue(false);
      deliveryRepository.create.mockResolvedValue(mockDelivery);
      bot.telegram.sendMessage.mockResolvedValue({ message_id: 456 } as never);
    });

    it('should call findByTelegramUserId with correct telegram user id', async (): Promise<void> => {
      await service.sendListingNotification(payload);

      expect(userService.findByTelegramUserId).toHaveBeenCalledWith(
        payload.userTelegramId,
      );
    });

    it('should check if notification was already sent', async (): Promise<void> => {
      await service.sendListingNotification(payload);

      expect(deliveryRepository.exists).toHaveBeenCalledWith(
        mockUser.id,
        payload.listing.id,
      );
    });

    it('should skip sending if notification was already sent', async (): Promise<void> => {
      deliveryRepository.exists.mockResolvedValue(true);

      await service.sendListingNotification(payload);

      expect(bot.telegram.sendMessage).not.toHaveBeenCalled();
    });

    it('should format message with listing and query', async (): Promise<void> => {
      await service.sendListingNotification(payload);

      expect(ListingMessageFormatter.format).toHaveBeenCalledWith(
        payload.listing,
        {
          includeQuery: true,
          query: payload.query,
        },
      );
    });

    it('should create keyboard with correct parameters', async (): Promise<void> => {
      await service.sendListingNotification(payload);

      expect(ListingKeyboard.create).toHaveBeenCalledWith({
        url: payload.listing.url,
        subscriptionId: payload.subscriptionId,
        includeUnsubscribe: true,
      });
    });

    it('should send telegram message with formatted content', async (): Promise<void> => {
      await service.sendListingNotification(payload);

      expect(bot.telegram.sendMessage).toHaveBeenCalledWith(
        payload.userTelegramId,
        'Formatted message',
        {
          parse_mode: 'HTML',
          reply_markup: { inline_keyboard: [] },
        },
      );
    });

    it('should create delivery record after sending message', async (): Promise<void> => {
      await service.sendListingNotification(payload);

      expect(deliveryRepository.create).toHaveBeenCalledWith(
        mockUser.id,
        payload.subscriptionId,
        payload.listing.id,
        '456',
      );
    });

    it('should create user if not found in database', async (): Promise<void> => {
      userService.findByTelegramUserId.mockResolvedValue(null);
      userService.findOrCreate.mockResolvedValue(mockUser);

      await service.sendListingNotification(payload);

      expect(userService.findOrCreate).toHaveBeenCalledWith(
        payload.userTelegramId,
      );
    });

    it('should not create user if already exists in database', async (): Promise<void> => {
      await service.sendListingNotification(payload);

      expect(userService.findOrCreate).not.toHaveBeenCalled();
    });
  });

  describe('sendListingNotification - error handling', (): void => {
    let payload: NotificationPayload;
    let mockUser: UserEntity;

    beforeEach((): void => {
      payload = {
        userTelegramId: 12345,
        subscriptionId: 1,
        query: 'test query',
        listing: {
          id: 'listing-123',
          title: 'Test Listing',
          url: 'https://list.am/item/listing-123',
        },
      };

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
      deliveryRepository.exists.mockResolvedValue(false);
    });

    it('should not throw when bot is blocked by user', async (): Promise<void> => {
      const botBlockedError = {
        response: {
          error_code: 403,
          description: 'Forbidden: bot was blocked by the user',
        },
      };
      bot.telegram.sendMessage.mockRejectedValue(botBlockedError);

      await expect(
        service.sendListingNotification(payload),
      ).resolves.toBeUndefined();
    });

    it('should not create delivery when bot is blocked by user', async (): Promise<void> => {
      const botBlockedError = {
        response: {
          error_code: 403,
          description: 'Forbidden: bot was blocked by the user',
        },
      };
      bot.telegram.sendMessage.mockRejectedValue(botBlockedError);

      await service.sendListingNotification(payload);

      expect(deliveryRepository.create).not.toHaveBeenCalled();
    });

    it('should throw when telegram api returns non-403 error', async (): Promise<void> => {
      const telegramError = {
        response: {
          error_code: 429,
          description: 'Too Many Requests',
        },
      };
      bot.telegram.sendMessage.mockRejectedValue(telegramError);

      await expect(
        service.sendListingNotification(payload),
      ).rejects.toStrictEqual(telegramError);
    });

    it('should throw when telegram api returns error without description', async (): Promise<void> => {
      const telegramError = {
        response: {
          error_code: 500,
        },
      };
      bot.telegram.sendMessage.mockRejectedValue(telegramError);

      await expect(
        service.sendListingNotification(payload),
      ).rejects.toStrictEqual(telegramError);
    });

    it('should throw for non-telegram errors', async (): Promise<void> => {
      const genericError = new Error('Network error');
      bot.telegram.sendMessage.mockRejectedValue(genericError);

      await expect(
        service.sendListingNotification(payload),
      ).rejects.toStrictEqual(genericError);
    });

    it('should not create delivery when telegram api returns non-403 error', async (): Promise<void> => {
      const telegramError = {
        response: {
          error_code: 429,
          description: 'Too Many Requests',
        },
      };
      bot.telegram.sendMessage.mockRejectedValue(telegramError);

      await expect(
        service.sendListingNotification(payload),
      ).rejects.toStrictEqual(telegramError);

      expect(deliveryRepository.create).not.toHaveBeenCalled();
    });

    it('should not create delivery when non-telegram error occurs', async (): Promise<void> => {
      const genericError = new Error('Network error');
      bot.telegram.sendMessage.mockRejectedValue(genericError);

      await expect(
        service.sendListingNotification(payload),
      ).rejects.toStrictEqual(genericError);

      expect(deliveryRepository.create).not.toHaveBeenCalled();
    });

    it('should handle telegram error with 403 code without throwing', async (): Promise<void> => {
      const botBlockedError = {
        response: {
          error_code: 403,
        },
      };
      bot.telegram.sendMessage.mockRejectedValue(botBlockedError);

      await expect(
        service.sendListingNotification(payload),
      ).resolves.toBeUndefined();
    });

    it('should delete all subscriptions when bot is blocked by user', async (): Promise<void> => {
      const botBlockedError = {
        response: {
          error_code: 403,
          description: 'Forbidden: bot was blocked by the user',
        },
      };
      bot.telegram.sendMessage.mockRejectedValue(botBlockedError);
      subscriptionService.count.mockResolvedValue(3);
      subscriptionService.deleteAll.mockResolvedValue(undefined);

      await service.sendListingNotification(payload);

      expect(userService.findByTelegramUserId).toHaveBeenCalledWith(
        payload.userTelegramId,
      );
    });

    it('should call subscriptionService.count when bot is blocked', async (): Promise<void> => {
      const botBlockedError = {
        response: {
          error_code: 403,
          description: 'Forbidden: bot was blocked by the user',
        },
      };
      bot.telegram.sendMessage.mockRejectedValue(botBlockedError);
      subscriptionService.count.mockResolvedValue(5);
      subscriptionService.deleteAll.mockResolvedValue(undefined);

      await service.sendListingNotification(payload);

      expect(subscriptionService.count).toHaveBeenCalledWith(mockUser.id);
    });

    it('should call subscriptionService.deleteAll when bot is blocked and user has subscriptions', async (): Promise<void> => {
      const botBlockedError = {
        response: {
          error_code: 403,
          description: 'Forbidden: bot was blocked by the user',
        },
      };
      bot.telegram.sendMessage.mockRejectedValue(botBlockedError);
      subscriptionService.count.mockResolvedValue(5);
      subscriptionService.deleteAll.mockResolvedValue(undefined);

      await service.sendListingNotification(payload);

      expect(subscriptionService.deleteAll).toHaveBeenCalledWith(mockUser.id);
    });

    it('should not call deleteAll when bot is blocked but user has no subscriptions', async (): Promise<void> => {
      const botBlockedError = {
        response: {
          error_code: 403,
          description: 'Forbidden: bot was blocked by the user',
        },
      };
      bot.telegram.sendMessage.mockRejectedValue(botBlockedError);
      subscriptionService.count.mockResolvedValue(0);

      await service.sendListingNotification(payload);

      expect(subscriptionService.deleteAll).not.toHaveBeenCalled();
    });

    it('should not throw when user not found in database during cleanup', async (): Promise<void> => {
      const botBlockedError = {
        response: {
          error_code: 403,
          description: 'Forbidden: bot was blocked by the user',
        },
      };
      bot.telegram.sendMessage.mockRejectedValue(botBlockedError);
      userService.findByTelegramUserId.mockResolvedValueOnce(mockUser);
      userService.findByTelegramUserId.mockResolvedValueOnce(null);

      await expect(
        service.sendListingNotification(payload),
      ).resolves.toBeUndefined();
    });

    it('should not throw when cleanup fails', async (): Promise<void> => {
      const botBlockedError = {
        response: {
          error_code: 403,
          description: 'Forbidden: bot was blocked by the user',
        },
      };
      bot.telegram.sendMessage.mockRejectedValue(botBlockedError);
      subscriptionService.count.mockRejectedValue(new Error('Database error'));

      await expect(
        service.sendListingNotification(payload),
      ).resolves.toBeUndefined();
    });

    it('should log debug when user blocked the bot', async (): Promise<void> => {
      const botBlockedError = {
        response: {
          error_code: 403,
          description: 'Forbidden: bot was blocked by the user',
        },
      };
      const debugSpy = jest.spyOn(Logger.prototype, 'debug');
      bot.telegram.sendMessage.mockRejectedValue(botBlockedError);
      subscriptionService.count.mockResolvedValue(2);
      subscriptionService.deleteAll.mockResolvedValue(undefined);

      await service.sendListingNotification(payload);

      expect(debugSpy).toHaveBeenCalledWith(
        expect.stringContaining('blocked the bot'),
      );
    });

    it('should log debug when subscriptions cleaned up', async (): Promise<void> => {
      const botBlockedError = {
        response: {
          error_code: 403,
          description: 'Forbidden: bot was blocked by the user',
        },
      };
      const debugSpy = jest.spyOn(Logger.prototype, 'debug');
      bot.telegram.sendMessage.mockRejectedValue(botBlockedError);
      subscriptionService.count.mockResolvedValue(3);
      subscriptionService.deleteAll.mockResolvedValue(undefined);

      await service.sendListingNotification(payload);

      expect(debugSpy).toHaveBeenCalledWith(
        expect.stringContaining('Cleaned up 3 subscription'),
      );
    });
  });
});
