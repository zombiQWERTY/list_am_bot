import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { ParserService } from '@list-am-bot/infrastructure/scraper/parser.service';

describe('ParserService', (): void => {
  let service: ParserService;

  beforeEach(async (): Promise<void> => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ParserService],
    }).compile();

    service = module.get<ParserService>(ParserService);

    jest.spyOn(Logger.prototype, 'debug').mockImplementation();
    jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach((): void => {
    jest.clearAllMocks();
  });

  it('should be defined', (): void => {
    expect(service).toBeDefined();
  });

  describe('extractListings', (): void => {
    const baseUrl = 'https://www.list.am';

    it('should return empty array for empty html', (): void => {
      const result = service.extractListings('', baseUrl);

      expect(result).toStrictEqual([]);
    });

    it('should return empty array when no listings found', (): void => {
      const html = '<html><body><div>No listings</div></body></html>';

      const result = service.extractListings(html, baseUrl);

      expect(result).toStrictEqual([]);
    });

    it('should extract listing with title', (): void => {
      const html = `
        <a class="fav-item-info-container" href="/item/123">
          <div class="dltitle"><span class="pt">Test Title</span></div>
        </a>
      `;

      const result = service.extractListings(html, baseUrl);

      expect(result[0].title).toBe('Test Title');
    });

    it('should extract listing with id from href', (): void => {
      const html = `
        <a class="fav-item-info-container" href="/item/123">
          <div class="dltitle"><span class="pt">Test Title</span></div>
        </a>
      `;

      const result = service.extractListings(html, baseUrl);

      expect(result[0].id).toBe('123');
    });

    it('should extract listing with price', (): void => {
      const html = `
        <a class="fav-item-info-container" href="/item/123">
          <div class="dltitle"><span class="pt">Test Title</span></div>
          <div class="ad-info-line-wrapper"><div class="p">50,000 AMD</div></div>
        </a>
      `;

      const result = service.extractListings(html, baseUrl);

      expect(result[0].priceText).toBe('50,000 AMD');
    });

    it('should extract listing with location', (): void => {
      const html = `
        <a class="fav-item-info-container" href="/item/123">
          <div class="dltitle"><span class="pt">Test Title</span></div>
          <div class="at">Yerevan</div>
        </a>
      `;

      const result = service.extractListings(html, baseUrl);

      expect(result[0].locationText).toBe('Yerevan');
    });

    it('should extract listing with posted time', (): void => {
      const html = `
        <a class="fav-item-info-container" href="/item/123">
          <div class="dltitle"><span class="pt">Test Title</span></div>
          <div class="d">2 hours ago</div>
        </a>
      `;

      const result = service.extractListings(html, baseUrl);

      expect(result[0].postedAtText).toBe('2 hours ago');
    });

    it('should build full url from relative href', (): void => {
      const html = `
        <a class="fav-item-info-container" href="/item/123">
          <div class="dltitle"><span class="pt">Test Title</span></div>
        </a>
      `;

      const result = service.extractListings(html, baseUrl);

      expect(result[0].url).toBe('https://www.list.am/item/123');
    });

    it('should extract multiple listings', (): void => {
      const html = `
        <a class="fav-item-info-container" href="/item/123">
          <div class="dltitle"><span class="pt">Title 1</span></div>
        </a>
        <a class="fav-item-info-container" href="/item/456">
          <div class="dltitle"><span class="pt">Title 2</span></div>
        </a>
      `;

      const result = service.extractListings(html, baseUrl);

      expect(result).toHaveLength(2);
    });

    it('should have correct title for second listing', (): void => {
      const html = `
        <a class="fav-item-info-container" href="/item/123">
          <div class="dltitle"><span class="pt">Title 1</span></div>
        </a>
        <a class="fav-item-info-container" href="/item/456">
          <div class="dltitle"><span class="pt">Title 2</span></div>
        </a>
      `;

      const result = service.extractListings(html, baseUrl);

      expect(result[1].title).toBe('Title 2');
    });

    it('should skip listings without title', (): void => {
      const html = `
        <a class="fav-item-info-container" href="/item/123"></a>
        <a class="fav-item-info-container" href="/item/456">
          <div class="dltitle"><span class="pt">Title 2</span></div>
        </a>
      `;

      const result = service.extractListings(html, baseUrl);

      expect(result).toHaveLength(1);
    });

    it('should deduplicate listings with same id', (): void => {
      const html = `
        <a class="fav-item-info-container" href="/item/123">
          <div class="dltitle"><span class="pt">Title 1</span></div>
        </a>
        <a class="fav-item-info-container" href="/item/123">
          <div class="dltitle"><span class="pt">Title 1 Duplicate</span></div>
        </a>
      `;

      const result = service.extractListings(html, baseUrl);

      expect(result).toHaveLength(1);
    });

    it('should parse price value from price text', (): void => {
      const html = `
        <a class="fav-item-info-container" href="/item/123">
          <div class="dltitle"><span class="pt">Test Title</span></div>
          <div class="ad-info-line-wrapper"><div class="p">50000 AMD</div></div>
        </a>
      `;

      const result = service.extractListings(html, baseUrl);

      expect(result[0].priceValue).toBe(50000);
    });

    it('should return null price value when price has no digits', (): void => {
      const html = `
        <a class="fav-item-info-container" href="/item/123">
          <div class="dltitle"><span class="pt">Test Title</span></div>
          <div class="ad-info-line-wrapper"><div class="p">Price on request</div></div>
        </a>
      `;

      const result = service.extractListings(html, baseUrl);

      expect(result[0].priceValue).toBeNull();
    });

    it('should extract image url from img tag', (): void => {
      const html = `
        <a class="fav-item-info-container" href="/item/123">
          <div class="dltitle"><span class="pt">Test Title</span></div>
          <img src="/images/test.jpg" />
        </a>
      `;

      const result = service.extractListings(html, baseUrl);

      expect(result[0].imageUrl).toContain('test.jpg');
    });

    it('should handle protocol-relative image urls', (): void => {
      const html = `
        <a class="fav-item-info-container" href="/item/123">
          <div class="dltitle"><span class="pt">Test Title</span></div>
          <img src="//list.am/images/test.jpg" />
        </a>
      `;

      const result = service.extractListings(html, baseUrl);

      expect(result[0].imageUrl).toBe('https://list.am/images/test.jpg');
    });

    it('should prefer data-original attribute for image', (): void => {
      const html = `
        <a class="fav-item-info-container" href="/item/123">
          <div class="dltitle"><span class="pt">Test Title</span></div>
          <img data-original="/images/original.jpg" src="/images/thumb.jpg" />
        </a>
      `;

      const result = service.extractListings(html, baseUrl);

      expect(result[0].imageUrl).toContain('original.jpg');
    });

    it('should skip "Suitable for" location text', (): void => {
      const html = `
        <a class="fav-item-info-container" href="/item/123">
          <div class="dltitle"><span class="pt">Test Title</span></div>
          <div class="at">Suitable for something</div>
          <div class="at">Yerevan</div>
        </a>
      `;

      const result = service.extractListings(html, baseUrl);

      expect(result[0].locationText).toBe('Yerevan');
    });

    it('should skip location with car parameters', (): void => {
      const html = `
        <a class="fav-item-info-container" href="/item/123">
          <div class="dltitle"><span class="pt">Test Title</span></div>
          <div class="at">Mercedes, г. 2015, 50000 км</div>
          <div class="at">Yerevan</div>
        </a>
      `;

      const result = service.extractListings(html, baseUrl);

      expect(result[0].locationText).toBe('Yerevan');
    });

    it('should skip very long location text', (): void => {
      const html = `
        <a class="fav-item-info-container" href="/item/123">
          <div class="dltitle"><span class="pt">Test Title</span></div>
          <div class="at">${'a'.repeat(60)}</div>
          <div class="at">Yerevan</div>
        </a>
      `;

      const result = service.extractListings(html, baseUrl);

      expect(result[0].locationText).toBe('Yerevan');
    });

    it('should trim whitespace from extracted text', (): void => {
      const html = `
        <a class="fav-item-info-container" href="/item/123">
          <div class="dltitle"><span class="pt">  Test Title  </span></div>
        </a>
      `;

      const result = service.extractListings(html, baseUrl);

      expect(result[0].title).toBe('Test Title');
    });
  });

  describe('buildSearchUrl', (): void => {
    it('should build url with query parameter', (): void => {
      const result = service.buildSearchUrl(
        'https://www.list.am',
        'test query',
      );

      expect(result).toContain('q=test+query');
    });

    it('should include base url', (): void => {
      const result = service.buildSearchUrl(
        'https://www.list.am',
        'test query',
      );

      expect(result).toContain('https://www.list.am');
    });

    it('should include ru/category path', (): void => {
      const result = service.buildSearchUrl(
        'https://www.list.am',
        'test query',
      );

      expect(result).toContain('/ru/category');
    });

    it('should encode special characters in query', (): void => {
      const result = service.buildSearchUrl(
        'https://www.list.am',
        'test & query',
      );

      expect(result).toContain('%26');
    });

    it('should handle empty query', (): void => {
      const result = service.buildSearchUrl('https://www.list.am', '');

      expect(result).toContain('q=');
    });

    it('should handle cyrillic characters', (): void => {
      const result = service.buildSearchUrl('https://www.list.am', 'тест');

      expect(result).toContain('q=');
    });
  });
});
