import { ListAmUrlUtil } from '@list-am-bot/common/utils/list-am-url.util';

describe('ListAmUrlUtil', (): void => {
  describe('isValidListAmUrl', (): void => {
    it('should return true for valid list.am URLs', (): void => {
      expect(
        ListAmUrlUtil.isValidListAmUrl('https://www.list.am/category/212'),
      ).toBe(true);
    });

    it('should return true for list.am without www', (): void => {
      expect(
        ListAmUrlUtil.isValidListAmUrl('https://list.am/category/212'),
      ).toBe(true);
    });

    it('should return false for non-list.am URLs', (): void => {
      expect(ListAmUrlUtil.isValidListAmUrl('https://google.com')).toBe(false);
    });

    it('should return false for invalid URLs', (): void => {
      expect(ListAmUrlUtil.isValidListAmUrl('not a url')).toBe(false);
    });
  });

  describe('normalizeUrl', (): void => {
    it('should add https protocol if missing', (): void => {
      const result = ListAmUrlUtil.normalizeUrl('www.list.am/category/212');

      expect(result).toBe('https://www.list.am/category/212');
    });

    it('should remove trailing slash', (): void => {
      const result = ListAmUrlUtil.normalizeUrl(
        'https://www.list.am/category/212/',
      );

      expect(result).toBe('https://www.list.am/category/212');
    });

    it('should throw error for non-list.am URLs', (): void => {
      expect((): void => {
        ListAmUrlUtil.normalizeUrl('https://google.com');
      }).toThrow('URL must be from list.am domain');
    });

    it('should handle complex URLs with parameters', (): void => {
      const url =
        'https://www.list.am/category/212?n=2&cid=0&price1=&price2=&crc=';
      const result = ListAmUrlUtil.normalizeUrl(url);

      expect(result).toBe(url);
    });
  });

  describe('extractQueryFromUrl', (): void => {
    it('should extract q parameter from URL', (): void => {
      const result = ListAmUrlUtil.extractQueryFromUrl(
        'https://www.list.am/category/212?q=Chevrolet%20Tahoe',
      );

      expect(result).toBe('Chevrolet Tahoe');
    });

    it('should return null if no q parameter', (): void => {
      const result = ListAmUrlUtil.extractQueryFromUrl(
        'https://www.list.am/category/212?n=2&cid=0',
      );

      expect(result).toBe(null);
    });

    it('should return null for empty q parameter', (): void => {
      const result = ListAmUrlUtil.extractQueryFromUrl(
        'https://www.list.am/category/212?q=',
      );

      expect(result).toBe(null);
    });

    it('should return null for invalid URL', (): void => {
      const result = ListAmUrlUtil.extractQueryFromUrl('not a url');

      expect(result).toBe(null);
    });

    it('should trim whitespace from query', (): void => {
      const result = ListAmUrlUtil.extractQueryFromUrl(
        'https://www.list.am/category/212?q=  test  ',
      );

      expect(result).toBe('test');
    });
  });

  describe('isCategoryUrl', (): void => {
    it('should return true for category URLs without text search', (): void => {
      const result = ListAmUrlUtil.isCategoryUrl(
        'https://www.list.am/category/212?n=2&cid=0',
      );

      expect(result).toBe(true);
    });

    it('should return false for URLs with text search', (): void => {
      const result = ListAmUrlUtil.isCategoryUrl(
        'https://www.list.am/category/212?q=test',
      );

      expect(result).toBe(false);
    });
  });

  describe('isValidSubscriptionName', (): void => {
    it('should return true for valid names', (): void => {
      expect(ListAmUrlUtil.isValidSubscriptionName('My Subscription')).toBe(
        true,
      );
    });

    it('should return false for names too short', (): void => {
      expect(ListAmUrlUtil.isValidSubscriptionName('ab')).toBe(false);
    });

    it('should return false for names too long', (): void => {
      const longName = 'a'.repeat(101);
      expect(ListAmUrlUtil.isValidSubscriptionName(longName)).toBe(false);
    });

    it('should trim whitespace before validation', (): void => {
      expect(ListAmUrlUtil.isValidSubscriptionName('  abc  ')).toBe(true);
    });

    it('should return false for empty string after trim', (): void => {
      expect(ListAmUrlUtil.isValidSubscriptionName('   ')).toBe(false);
    });
  });
});
