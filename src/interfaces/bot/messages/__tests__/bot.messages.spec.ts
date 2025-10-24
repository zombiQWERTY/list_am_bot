import { Test, TestingModule } from '@nestjs/testing';

import { BotMessages } from '@list-am-bot/interfaces/bot/messages/bot.messages';

describe('BotMessages', (): void => {
  let service: BotMessages;

  beforeEach(async (): Promise<void> => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BotMessages],
    }).compile();

    service = module.get<BotMessages>(BotMessages);
  });

  it('should be defined', (): void => {
    expect(service).toBeDefined();
  });

  describe('welcome', (): void => {
    it('should return welcome message', (): void => {
      const result = service.welcome();

      expect(result).toContain('Добро пожаловать');
    });

    it('should mention list.am', (): void => {
      const result = service.welcome();

      expect(result).toContain('list.am');
    });
  });

  describe('help', (): void => {
    it('should return help message', (): void => {
      const result = service.help();

      expect(result).toContain('Справка');
    });

    it('should include start command', (): void => {
      const result = service.help();

      expect(result).toContain('/start');
    });
  });

  describe('menu', (): void => {
    it('should return menu message', (): void => {
      const result = service.menu();

      expect(result).toContain('меню');
    });
  });

  describe('status', (): void => {
    it('should include subscriptions count', (): void => {
      const result = service.status(5, false);

      expect(result).toContain('5');
    });

    it('should show active status when not paused', (): void => {
      const result = service.status(5, false);

      expect(result).toContain('Активна');
    });

    it('should show paused status when paused', (): void => {
      const result = service.status(5, true);

      expect(result).toContain('Приостановлена');
    });
  });

  describe('enterQuery', (): void => {
    it('should prompt for query input', (): void => {
      const result = service.enterQuery();

      expect(result).toContain('Пришлите текст');
    });
  });

  describe('subscriptionAdded', (): void => {
    it('should include query in message', (): void => {
      const result = service.subscriptionAdded('test query');

      expect(result).toContain('test query');
    });

    it('should show success confirmation', (): void => {
      const result = service.subscriptionAdded('test query');

      expect(result).toContain('Готово');
    });
  });

  describe('subscriptionsList', (): void => {
    it('should include count in message', (): void => {
      const result = service.subscriptionsList(3);

      expect(result).toContain('3');
    });
  });

  describe('noSubscriptions', (): void => {
    it('should indicate no subscriptions', (): void => {
      const result = service.noSubscriptions();

      expect(result).toContain('нет активных подписок');
    });
  });

  describe('confirmClear', (): void => {
    it('should ask for confirmation', (): void => {
      const result = service.confirmClear();

      expect(result).toContain('уверены');
    });
  });

  describe('allCleared', (): void => {
    it('should confirm deletion', (): void => {
      const result = service.allCleared();

      expect(result).toContain('удалены');
    });
  });

  describe('canceled', (): void => {
    it('should indicate cancellation', (): void => {
      const result = service.canceled();

      expect(result).toContain('Отменено');
    });
  });

  describe('duplicateSubscription', (): void => {
    it('should include query in message', (): void => {
      const result = service.duplicateSubscription('test query');

      expect(result).toContain('test query');
    });

    it('should indicate subscription exists', (): void => {
      const result = service.duplicateSubscription('test query');

      expect(result).toContain('уже существует');
    });
  });

  describe('invalidQuery', (): void => {
    it('should include reason in message', (): void => {
      const result = service.invalidQuery('too short');

      expect(result).toContain('too short');
    });
  });

  describe('error', (): void => {
    it('should return error message', (): void => {
      const result = service.error();

      expect(result).toContain('ошибка');
    });
  });

  describe('userNotFound', (): void => {
    it('should indicate user not found', (): void => {
      const result = service.userNotFound();

      expect(result).toContain('не найден');
    });
  });

  describe('unknownCommand', (): void => {
    it('should indicate unknown command', (): void => {
      const result = service.unknownCommand();

      expect(result).toContain('Неизвестная команда');
    });
  });

  describe('lastCommandUsage', (): void => {
    it('should show usage example', (): void => {
      const result = service.lastCommandUsage();

      expect(result).toContain('/last');
    });
  });

  describe('lastCommandSearching', (): void => {
    it('should include query in message', (): void => {
      const result = service.lastCommandSearching('test query');

      expect(result).toContain('test query');
    });
  });

  describe('lastCommandNoResults', (): void => {
    it('should include query in message', (): void => {
      const result = service.lastCommandNoResults('test query');

      expect(result).toContain('test query');
    });

    it('should indicate no results', (): void => {
      const result = service.lastCommandNoResults('test query');

      expect(result).toContain('ничего не найдено');
    });
  });

  describe('lastCommandResult', (): void => {
    it('should include query in message', (): void => {
      const result = service.lastCommandResult('test query', 5);

      expect(result).toContain('test query');
    });

    it('should include count in message', (): void => {
      const result = service.lastCommandResult('test query', 5);

      expect(result).toContain('5');
    });

    it('should escape HTML in query', (): void => {
      const result = service.lastCommandResult('<script>', 5);

      expect(result).toContain('&lt;script&gt;');
    });
  });

  describe('searchError', (): void => {
    it('should include error in message', (): void => {
      const result = service.searchError('Connection timeout');

      expect(result).toContain('Connection timeout');
    });

    it('should indicate error', (): void => {
      const result = service.searchError('Connection timeout');

      expect(result).toContain('Ошибка поиска');
    });
  });

  describe('invalidFormat', (): void => {
    it('should return invalid format message', (): void => {
      const result = service.invalidFormat();

      expect(result).toContain('Неверный формат');
    });
  });

  describe('subscriptionDeleted', (): void => {
    it('should confirm deletion', (): void => {
      const result = service.subscriptionDeleted();

      expect(result).toContain('удалена');
    });
  });

  describe('deleteError', (): void => {
    it('should return error message', (): void => {
      const result = service.deleteError();

      expect(result).toContain('Ошибка');
    });

    it('should mention deletion', (): void => {
      const result = service.deleteError();

      expect(result).toContain('удалении');
    });
  });

  describe('openOnListAm', (): void => {
    it('should return button text', (): void => {
      const result = service.openOnListAm();

      expect(result).toContain('list.am');
    });
  });
});
