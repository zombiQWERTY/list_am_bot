import { Injectable } from '@nestjs/common';

import { escapeHtml } from '@list-am-bot/common/utils/html.util';

@Injectable()
export class BotMessages {
  welcome(): string {
    return (
      '👋 Добро пожаловать!\n\n' +
      'Этот бот поможет вам отслеживать новые объявления на list.am.\n\n' +
      'Вы можете добавить поисковые запросы, и бот будет уведомлять вас о новых объявлениях каждый час.\n\n' +
      'Используйте кнопки ниже или команду /menu для навигации.'
    );
  }

  help(): string {
    return (
      '📖 <b>Справка</b>\n\n' +
      '<b>Доступные команды:</b>\n' +
      '/start - Начать работу с ботом\n' +
      '/menu - Открыть главное меню\n' +
      '/status - Показать текущий статус\n' +
      '/help - Показать эту справку\n\n' +
      '<b>Как использовать:</b>\n' +
      '1. Добавьте поисковый запрос (например, "Chevrolet Tahoe")\n' +
      '2. Бот будет проверять list.am каждый час\n' +
      '3. Вы получите уведомление о каждом новом объявлении\n\n' +
      'Вы можете приостановить рассылку в любое время через меню.'
    );
  }

  menu(): string {
    return 'Вы в меню. Выберите действие:';
  }

  status(subscriptionsCount: number, isPaused: boolean): string {
    const pauseStatus = isPaused ? '⏸ Приостановлена' : '✅ Активна';
    return (
      '📊 <b>Статус</b>\n\n' +
      `Активных подписок: ${subscriptionsCount}\n` +
      `Рассылка: ${pauseStatus}\n\n` +
      'Следующая проверка: в начале следующего часа'
    );
  }

  enterQuery(): string {
    return (
      '✍️ Пришлите текст для поиска на list.am\n\n' +
      'Например: <code>Chevrolet Tahoe</code>\n\n' +
      'Нажмите "Отмена" для возврата в меню.'
    );
  }

  subscriptionAdded(query: string): string {
    return `✅ Готово! Добавлено: "${query}"\n\nВы будете получать уведомления о новых объявлениях.`;
  }

  subscriptionsList(count: number): string {
    return `📋 Ваши отслеживания (${count}):`;
  }

  noSubscriptions(): string {
    return (
      'У вас пока нет активных подписок.\n\n' +
      'Нажмите "➕ Добавить в список" для создания первой подписки.'
    );
  }

  confirmClear(): string {
    return '⚠️ Вы уверены, что хотите удалить ВСЕ подписки?\n\nЭто действие нельзя отменить.';
  }

  allCleared(): string {
    return '✅ Все подписки удалены.';
  }

  canceled(): string {
    return '❌ Отменено.';
  }

  duplicateSubscription(query: string): string {
    return `⚠️ Подписка на "${query}" уже существует.`;
  }

  invalidQuery(reason: string): string {
    return `❌ Некорректный запрос: ${reason}`;
  }

  error(): string {
    return '❌ Произошла ошибка. Попробуйте позже.';
  }

  userNotFound(): string {
    return '❌ Пользователь не найден. Используйте /start для регистрации.';
  }

  unknownCommand(): string {
    return 'Неизвестная команда. Используйте /menu для навигации.';
  }

  lastCommandUsage(): string {
    return (
      '❌ Неверный формат команды.\n\n' +
      'Использование: <code>/last поисковый запрос</code>\n\n' +
      'Например: <code>/last Chevrolet Tahoe</code>'
    );
  }

  lastCommandSearching(query: string): string {
    return `🔍 Ищу "${query}" на list.am...`;
  }

  lastCommandNoResults(query: string): string {
    return `❌ По запросу "${query}" ничего не найдено.`;
  }

  lastCommandResult(query: string, count: number): string {
    return `🔍 <b>Результаты поиска</b> по запросу: "${escapeHtml(query)}"\n\nНайдено: ${count} объявлений\n\nПоказываю последнее:`;
  }

  searchError(error: string): string {
    return `❌ Ошибка поиска: ${error}`;
  }

  invalidFormat(): string {
    return '❌ Неверный формат';
  }

  subscriptionDeleted(): string {
    return '✅ Подписка удалена';
  }

  deleteError(): string {
    return '❌ Ошибка при удалении подписки';
  }

  openOnListAm(): string {
    return '🔗 Открыть на list.am';
  }
}
