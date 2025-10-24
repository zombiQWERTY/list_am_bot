import { ListingMessageFormatter } from '@list-am-bot/common/formatters/listing-message.formatter';
import { Listing } from '@list-am-bot/common/types/listing.types';

describe('ListingMessageFormatter', (): void => {
  describe('format', (): void => {
    let mockListing: Listing;

    beforeEach((): void => {
      mockListing = {
        id: 'listing-123',
        title: 'Test Listing Title',
        priceText: '50,000 AMD',
        priceValue: 50000,
        locationText: 'Yerevan, Center',
        url: 'https://list.am/item/123',
        imageUrl: 'https://list.am/image.jpg',
        postedAtText: '2 hours ago',
      };
    });

    it('should include listing title in message', (): void => {
      const result = ListingMessageFormatter.format(mockListing);

      expect(result).toContain('Test Listing Title');
    });

    it('should include price in message', (): void => {
      const result = ListingMessageFormatter.format(mockListing);

      expect(result).toContain('💰 Цена: 50,000 AMD');
    });

    it('should include location in message', (): void => {
      const result = ListingMessageFormatter.format(mockListing);

      expect(result).toContain('📍 Локация: Yerevan, Center');
    });

    it('should include posted time in message', (): void => {
      const result = ListingMessageFormatter.format(mockListing);

      expect(result).toContain('🕐 Время: 2 hours ago');
    });

    it('should include url in message', (): void => {
      const result = ListingMessageFormatter.format(mockListing);

      expect(result).toContain('🔗 https://list.am/item/123');
    });

    it('should include query when includeQuery is true', (): void => {
      const result = ListingMessageFormatter.format(mockListing, {
        includeQuery: true,
        query: 'test query',
      });

      expect(result).toContain('по запросу: "test query"');
    });

    it('should not include query when includeQuery is false', (): void => {
      const result = ListingMessageFormatter.format(mockListing, {
        includeQuery: false,
        query: 'test query',
      });

      expect(result).not.toContain('по запросу');
    });

    it('should not include query when query is not provided', (): void => {
      const result = ListingMessageFormatter.format(mockListing, {
        includeQuery: true,
      });

      expect(result).not.toContain('по запросу');
    });

    it('should omit price when not provided', (): void => {
      const listingWithoutPrice = { ...mockListing, priceText: undefined };

      const result = ListingMessageFormatter.format(listingWithoutPrice);

      expect(result).not.toContain('💰 Цена:');
    });

    it('should omit location when not provided', (): void => {
      const listingWithoutLocation = {
        ...mockListing,
        locationText: undefined,
      };

      const result = ListingMessageFormatter.format(listingWithoutLocation);

      expect(result).not.toContain('📍 Локация:');
    });

    it('should omit posted time when not provided', (): void => {
      const listingWithoutPostedAt = {
        ...mockListing,
        postedAtText: undefined,
      };

      const result = ListingMessageFormatter.format(listingWithoutPostedAt);

      expect(result).not.toContain('🕐 Время:');
    });

    it('should escape HTML special characters in title', (): void => {
      const listingWithHtml = {
        ...mockListing,
        title: 'Title <script>alert("xss")</script>',
      };

      const result = ListingMessageFormatter.format(listingWithHtml);

      expect(result).toContain('&lt;script&gt;');
    });

    it('should escape HTML special characters in query', (): void => {
      const result = ListingMessageFormatter.format(mockListing, {
        includeQuery: true,
        query: '<script>',
      });

      expect(result).toContain('&lt;script&gt;');
    });

    it('should escape HTML special characters in price', (): void => {
      const listingWithHtmlPrice = {
        ...mockListing,
        priceText: '100 & 200',
      };

      const result = ListingMessageFormatter.format(listingWithHtmlPrice);

      expect(result).toContain('100 &amp; 200');
    });

    it('should format minimal listing with only required fields', (): void => {
      const minimalListing: Listing = {
        id: 'min-123',
        title: 'Minimal',
        url: 'https://list.am/item/min',
      };

      const result = ListingMessageFormatter.format(minimalListing);

      expect(result).toContain('Minimal');
    });

    it('should include url in minimal listing', (): void => {
      const minimalListing: Listing = {
        id: 'min-123',
        title: 'Minimal',
        url: 'https://list.am/item/min',
      };

      const result = ListingMessageFormatter.format(minimalListing);

      expect(result).toContain('https://list.am/item/min');
    });

    it('should use HTML bold tags for title', (): void => {
      const result = ListingMessageFormatter.format(mockListing);

      expect(result).toContain('<b>Test Listing Title</b>');
    });

    it('should format with new lines between sections', (): void => {
      const result = ListingMessageFormatter.format(mockListing);

      expect(result).toContain('\n');
    });
  });
});
