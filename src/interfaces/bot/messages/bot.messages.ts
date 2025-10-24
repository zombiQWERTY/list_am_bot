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

  enterUrl(): string {
    return (
      '🔗 <b>Подписка по URL</b>\n\n' +
      'Пришлите ссылку с list.am с нужными фильтрами.\n\n' +
      '<b>Пример:</b>\n' +
      '<code>https://www.list.am/category/212?n=2&cid=0&price1=10000&price2=50000</code>\n\n' +
      '💡 Вы можете настроить фильтры на сайте list.am, скопировать ссылку и вставить сюда.\n\n' +
      'Нажмите "Отмена" для возврата в меню.'
    );
  }

  enterSubscriptionName(): string {
    return (
      '✍️ <b>Название подписки</b>\n\n' +
      'Придумайте название для этой подписки (от 3 до 100 символов).\n\n' +
      '<b>Примеры:</b>\n' +
      '• "Chevrolet Tahoe до $50k"\n' +
      '• "Квартиры в центре"\n' +
      '• "iPhone недорого"\n\n' +
      'Нажмите "Отмена" для возврата в меню.'
    );
  }

  urlSubscriptionAdded(name: string, url: string): string {
    return (
      `✅ <b>Готово!</b>\n\n` +
      `Подписка создана: "${name}"\n\n` +
      `🔗 URL: <code>${url}</code>\n\n` +
      `Вы будете получать уведомления о новых объявлениях.`
    );
  }

  invalidUrl(): string {
    return (
      '❌ <b>Неверная ссылка</b>\n\n' +
      'Ссылка должна быть с сайта list.am.\n\n' +
      '<b>Правильные форматы:</b>\n' +
      '• https://www.list.am/category/212\n' +
      '• www.list.am/category/212?n=2\n' +
      '• list.am/item/12345\n\n' +
      'Попробуйте еще раз или нажмите "Отмена".'
    );
  }

  invalidSubscriptionName(): string {
    return (
      '❌ <b>Некорректное название</b>\n\n' +
      'Название должно содержать от 3 до 100 символов.\n\n' +
      'Попробуйте еще раз или нажмите "Отмена".'
    );
  }

  duplicateUrlSubscription(url: string): string {
    return `⚠️ Подписка на этот URL уже существует:\n<code>${url}</code>`;
  }
}
