import { ListingKeyboard } from '@list-am-bot/common/keyboards/listing.keyboard';

describe('ListingKeyboard', (): void => {
  describe('create', (): void => {
    it('should create keyboard with open button', (): void => {
      const result = ListingKeyboard.create({
        url: 'https://list.am/item/123',
      });

      expect(result.inline_keyboard[0][0].text).toBe('🔗 Открыть');
    });

    it('should set url for open button', (): void => {
      const result = ListingKeyboard.create({
        url: 'https://list.am/item/123',
      });

      expect('url' in result.inline_keyboard[0][0]).toBe(true);
    });

    it('should use custom open button text when provided', (): void => {
      const result = ListingKeyboard.create({
        url: 'https://list.am/item/123',
        openButtonText: 'View Listing',
      });

      expect(result.inline_keyboard[0][0].text).toBe('View Listing');
    });

    it('should not include unsubscribe button by default', (): void => {
      const result = ListingKeyboard.create({
        url: 'https://list.am/item/123',
      });

      expect(result.inline_keyboard).toHaveLength(1);
    });

    it('should include unsubscribe button when includeUnsubscribe is true', (): void => {
      const result = ListingKeyboard.create({
        url: 'https://list.am/item/123',
        subscriptionId: 456,
        includeUnsubscribe: true,
      });

      expect(result.inline_keyboard).toHaveLength(2);
    });

    it('should set unsubscribe button text', (): void => {
      const result = ListingKeyboard.create({
        url: 'https://list.am/item/123',
        subscriptionId: 456,
        includeUnsubscribe: true,
      });

      expect(result.inline_keyboard[1][0].text).toBe(
        '🗑 Отписаться от этого запроса',
      );
    });

    it('should set unsubscribe callback data with subscription id', (): void => {
      const result = ListingKeyboard.create({
        url: 'https://list.am/item/123',
        subscriptionId: 456,
        includeUnsubscribe: true,
      });

      expect(result.inline_keyboard[1][0]).toHaveProperty(
        'callback_data',
        'unsubscribe:456',
      );
    });

    it('should not include unsubscribe when includeUnsubscribe is false', (): void => {
      const result = ListingKeyboard.create({
        url: 'https://list.am/item/123',
        subscriptionId: 456,
        includeUnsubscribe: false,
      });

      expect(result.inline_keyboard).toHaveLength(1);
    });

    it('should not include unsubscribe when subscriptionId not provided', (): void => {
      const result = ListingKeyboard.create({
        url: 'https://list.am/item/123',
        includeUnsubscribe: true,
      });

      expect(result.inline_keyboard).toHaveLength(1);
    });

    it('should return InlineKeyboardMarkup structure', (): void => {
      const result = ListingKeyboard.create({
        url: 'https://list.am/item/123',
      });

      expect(result).toHaveProperty('inline_keyboard');
    });

    it('should have inline_keyboard as array', (): void => {
      const result = ListingKeyboard.create({
        url: 'https://list.am/item/123',
      });

      expect(Array.isArray(result.inline_keyboard)).toBe(true);
    });

    it('should have first row with one button', (): void => {
      const result = ListingKeyboard.create({
        url: 'https://list.am/item/123',
      });

      expect(result.inline_keyboard[0]).toHaveLength(1);
    });

    it('should have second row with one button when unsubscribe included', (): void => {
      const result = ListingKeyboard.create({
        url: 'https://list.am/item/123',
        subscriptionId: 456,
        includeUnsubscribe: true,
      });

      expect(result.inline_keyboard[1]).toHaveLength(1);
    });

    it('should handle different subscription ids', (): void => {
      const result = ListingKeyboard.create({
        url: 'https://list.am/item/123',
        subscriptionId: 999,
        includeUnsubscribe: true,
      });

      expect(result.inline_keyboard[1][0]).toHaveProperty(
        'callback_data',
        'unsubscribe:999',
      );
    });

    it('should handle different urls', (): void => {
      const result = ListingKeyboard.create({
        url: 'https://example.com/test',
      });

      expect('url' in result.inline_keyboard[0][0]).toBe(true);
    });
  });
});
