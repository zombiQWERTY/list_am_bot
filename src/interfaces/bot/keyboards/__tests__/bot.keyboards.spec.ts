import { Test, TestingModule } from '@nestjs/testing';

import {
  SubscriptionEntity,
  SubscriptionType,
} from '@list-am-bot/domain/subscription/subscription.entity';
import { BotKeyboards } from '@list-am-bot/interfaces/bot/keyboards/bot.keyboards';

const mockDate = new Date('2024-10-23T10:00:00.000Z');

describe('BotKeyboards', (): void => {
  let service: BotKeyboards;

  beforeEach(async (): Promise<void> => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BotKeyboards],
    }).compile();

    service = module.get<BotKeyboards>(BotKeyboards);
  });

  it('should be defined', (): void => {
    expect(service).toBeDefined();
  });

  describe('mainMenu', (): void => {
    it('should return inline keyboard markup', (): void => {
      const result = service.mainMenu();

      expect(result).toHaveProperty('inline_keyboard');
    });

    it('should include list button', (): void => {
      const result = service.mainMenu();

      expect(result.inline_keyboard[0][0].text).toContain('Список');
    });

    it('should include add text button', (): void => {
      const result = service.mainMenu();

      expect(result.inline_keyboard[1][0].text).toContain('текстом');
    });

    it('should include add URL button', (): void => {
      const result = service.mainMenu();

      expect(result.inline_keyboard[2][0].text).toContain('URL');
    });

    it('should include clear button', (): void => {
      const result = service.mainMenu();

      expect(result.inline_keyboard[3][0].text).toContain('Очистить');
    });

    it('should show pause button when not paused', (): void => {
      const result = service.mainMenu(false);

      expect(result.inline_keyboard[4][0].text).toContain('Остановить');
    });

    it('should show resume button when paused', (): void => {
      const result = service.mainMenu(true);

      expect(result.inline_keyboard[4][0].text).toContain('Начать');
    });

    it('should have correct callback data for list button', (): void => {
      const result = service.mainMenu();

      expect(result.inline_keyboard[0][0]).toHaveProperty(
        'callback_data',
        'menu:list',
      );
    });

    it('should have correct callback data for add text button', (): void => {
      const result = service.mainMenu();

      expect(result.inline_keyboard[1][0]).toHaveProperty(
        'callback_data',
        'menu:add',
      );
    });

    it('should have correct callback data for add URL button', (): void => {
      const result = service.mainMenu();

      expect(result.inline_keyboard[2][0]).toHaveProperty(
        'callback_data',
        'menu:add_url',
      );
    });

    it('should have correct callback data for clear button', (): void => {
      const result = service.mainMenu();

      expect(result.inline_keyboard[3][0]).toHaveProperty(
        'callback_data',
        'menu:clear',
      );
    });

    it('should have pause callback when not paused', (): void => {
      const result = service.mainMenu(false);

      expect(result.inline_keyboard[4][0]).toHaveProperty(
        'callback_data',
        'menu:pause',
      );
    });

    it('should have resume callback when paused', (): void => {
      const result = service.mainMenu(true);

      expect(result.inline_keyboard[4][0]).toHaveProperty(
        'callback_data',
        'menu:resume',
      );
    });
  });

  describe('subscriptionList', (): void => {
    let mockSubscriptions: SubscriptionEntity[];

    beforeEach((): void => {
      mockSubscriptions = [
        new SubscriptionEntity({
          id: 1,
          userId: 1,
          query: 'Test Query 1',
          type: SubscriptionType.QUERY,
          isActive: true,
          createdAt: mockDate,
          updatedAt: mockDate,
        }),
        new SubscriptionEntity({
          id: 2,
          userId: 1,
          query: 'Test Query 2',
          type: SubscriptionType.QUERY,
          isActive: true,
          createdAt: mockDate,
          updatedAt: mockDate,
        }),
      ];
    });

    it('should return inline keyboard markup', (): void => {
      const result = service.subscriptionList(mockSubscriptions);

      expect(result).toHaveProperty('inline_keyboard');
    });

    it('should create row for each subscription', (): void => {
      const result = service.subscriptionList(mockSubscriptions);

      expect(result.inline_keyboard.length).toBe(3);
    });

    it('should include query text in button', (): void => {
      const result = service.subscriptionList(mockSubscriptions);

      expect(result.inline_keyboard[0][0].text).toContain('Test Query 1');
    });

    it('should include numbered index', (): void => {
      const result = service.subscriptionList(mockSubscriptions);

      expect(result.inline_keyboard[0][0].text).toContain('1.');
    });

    it('should truncate long queries', (): void => {
      const longQuery = 'a'.repeat(50);
      mockSubscriptions[0].query = longQuery;

      const result = service.subscriptionList(mockSubscriptions);

      expect(result.inline_keyboard[0][0].text).toContain('...');
    });

    it('should not truncate short queries', (): void => {
      const result = service.subscriptionList(mockSubscriptions);

      expect(result.inline_keyboard[0][0].text).not.toContain('...');
    });

    it('should include delete button for each subscription', (): void => {
      const result = service.subscriptionList(mockSubscriptions);

      expect(result.inline_keyboard[0][1].text).toBe('🗑');
    });

    it('should have correct callback data for subscription', (): void => {
      const result = service.subscriptionList(mockSubscriptions);

      expect(result.inline_keyboard[0][0]).toHaveProperty(
        'callback_data',
        'sub:1',
      );
    });

    it('should have correct callback data for delete button', (): void => {
      const result = service.subscriptionList(mockSubscriptions);

      expect(result.inline_keyboard[0][1]).toHaveProperty(
        'callback_data',
        'delete:1',
      );
    });

    it('should include back button', (): void => {
      const result = service.subscriptionList(mockSubscriptions);

      expect(result.inline_keyboard[2][0].text).toContain('Назад');
    });

    it('should have correct callback data for back button', (): void => {
      const result = service.subscriptionList(mockSubscriptions);

      expect(result.inline_keyboard[2][0]).toHaveProperty(
        'callback_data',
        'menu:back',
      );
    });
  });

  describe('confirmClear', (): void => {
    it('should return inline keyboard markup', (): void => {
      const result = service.confirmClear();

      expect(result).toHaveProperty('inline_keyboard');
    });

    it('should have yes button', (): void => {
      const result = service.confirmClear();

      expect(result.inline_keyboard[0][0].text).toContain('Да');
    });

    it('should have no button', (): void => {
      const result = service.confirmClear();

      expect(result.inline_keyboard[0][1].text).toContain('Нет');
    });

    it('should have correct callback data for yes button', (): void => {
      const result = service.confirmClear();

      expect(result.inline_keyboard[0][0]).toHaveProperty(
        'callback_data',
        'clear:yes',
      );
    });

    it('should have correct callback data for no button', (): void => {
      const result = service.confirmClear();

      expect(result.inline_keyboard[0][1]).toHaveProperty(
        'callback_data',
        'clear:no',
      );
    });
  });

  describe('cancelButton', (): void => {
    it('should return reply keyboard markup', (): void => {
      const result = service.cancelButton();

      expect(result).toHaveProperty('keyboard');
    });

    it('should have cancel button', (): void => {
      const result = service.cancelButton();

      expect(result.keyboard[0]).toHaveLength(1);
    });

    it('should have resize keyboard enabled', (): void => {
      const result = service.cancelButton();

      expect(result.resize_keyboard).toBe(true);
    });

    it('should have one time keyboard enabled', (): void => {
      const result = service.cancelButton();

      expect(result.one_time_keyboard).toBe(true);
    });
  });
});
