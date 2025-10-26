/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';

import { MetricsService } from '@list-am-bot/application/monitoring/metrics.service';
import {
  SeenListingRepositoryPort,
  ISeenListingRepository,
} from '@list-am-bot/domain/seen-listing/ports/seen-listing.repository.port';
import { FlaresolvrrService } from '@list-am-bot/infrastructure/scraper/flaresolverr.service';
import { ParserService } from '@list-am-bot/infrastructure/scraper/parser.service';
import { ScraperService } from '@list-am-bot/infrastructure/scraper/scraper.service';

describe('Subscription Flow Integration', (): void => {
  let scraperService: ScraperService;
  let parserService: ParserService;
  let flaresolvrrService: FlaresolvrrService;

  const mockHtml = `
    <div>
      <a class="fav-item-info-container" href="/item/12345">
        <div class="dltitle"><span class="pt">Test Listing</span></div>
        <div class="ad-info-line-wrapper"><span class="p">30,000 ֏</span></div>
        <div class="at">Yerevan</div>
      </a>
    </div>
  `;

  beforeEach(async (): Promise<void> => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScraperService,
        ParserService,
        {
          provide: FlaresolvrrService,
          useValue: {
            fetchHtml: jest.fn().mockResolvedValue(mockHtml),
          },
        },
        {
          provide: MetricsService,
          useValue: {
            recordScrapeDuration: jest.fn(),
          },
        },
        {
          provide: SeenListingRepositoryPort,
          useValue: {
            filterNewListings: jest.fn(),
            markAsSeen: jest.fn(),
          } as Partial<ISeenListingRepository>,
        },
      ],
    }).compile();

    scraperService = module.get<ScraperService>(ScraperService);
    parserService = module.get<ParserService>(ParserService);
    flaresolvrrService = module.get<FlaresolvrrService>(FlaresolvrrService);
  });

  describe('Text Query Subscription (SubscriptionType.QUERY)', (): void => {
    it('should build search URL with q parameter for text query', async (): Promise<void> => {
      const textQuery = 'iPhone 13';

      await scraperService.scrapeQuery(textQuery);

      expect(flaresolvrrService.fetchHtml).toHaveBeenCalledWith(
        expect.stringContaining('q=iPhone'),
      );
    });

    it('should include list.am base URL for text query', async (): Promise<void> => {
      const textQuery = 'MacBook Pro';

      await scraperService.scrapeQuery(textQuery);

      expect(flaresolvrrService.fetchHtml).toHaveBeenCalledWith(
        expect.stringContaining('https://www.list.am'),
      );
    });

    it('should include category path for text query', async (): Promise<void> => {
      const textQuery = 'laptop';

      await scraperService.scrapeQuery(textQuery);

      expect(flaresolvrrService.fetchHtml).toHaveBeenCalledWith(
        expect.stringContaining('/ru/category'),
      );
    });

    it('should work with cyrillic text query', async (): Promise<void> => {
      const textQuery = 'телефон';

      await scraperService.scrapeQuery(textQuery);

      expect(flaresolvrrService.fetchHtml).toHaveBeenCalledWith(
        expect.stringContaining('q='),
      );
    });
  });

  describe('URL Subscription (SubscriptionType.URL)', (): void => {
    it('should use URL directly without modification', async (): Promise<void> => {
      const urlQuery =
        'https://www.list.am/category/134?cnd=2&price2=30000&srt=3';

      await scraperService.scrapeQuery(urlQuery);

      expect(flaresolvrrService.fetchHtml).toHaveBeenCalledWith(urlQuery);
    });

    it('should preserve all filter parameters in URL', async (): Promise<void> => {
      const urlQuery =
        'https://www.list.am/category/134?cnd=2&crc=0&n=1&price2=30000&_ssflist=1&_ssid=720239&srt=3';

      await scraperService.scrapeQuery(urlQuery);

      const mockCalls = (flaresolvrrService.fetchHtml as jest.Mock).mock
        .calls as Array<[string]>;
      const calledUrl = mockCalls[0][0];

      expect(calledUrl).toContain('cnd=2');
    });

    it('should preserve price filter in URL', async (): Promise<void> => {
      const urlQuery =
        'https://www.list.am/category/134?cnd=2&crc=0&n=1&price2=30000&_ssflist=1&_ssid=720239&srt=3';

      await scraperService.scrapeQuery(urlQuery);

      const mockCalls = (flaresolvrrService.fetchHtml as jest.Mock).mock
        .calls as Array<[string]>;
      const calledUrl = mockCalls[0][0];

      expect(calledUrl).toContain('price2=30000');
    });

    it('should preserve sort parameter in URL', async (): Promise<void> => {
      const urlQuery =
        'https://www.list.am/category/134?cnd=2&crc=0&n=1&price2=30000&_ssflist=1&_ssid=720239&srt=3';

      await scraperService.scrapeQuery(urlQuery);

      const mockCalls = (flaresolvrrService.fetchHtml as jest.Mock).mock
        .calls as Array<[string]>;
      const calledUrl = mockCalls[0][0];

      expect(calledUrl).toContain('srt=3');
    });

    it('should preserve session filters in URL', async (): Promise<void> => {
      const urlQuery =
        'https://www.list.am/category/134?cnd=2&crc=0&n=1&price2=30000&_ssflist=1&_ssid=720239&srt=3';

      await scraperService.scrapeQuery(urlQuery);

      const mockCalls = (flaresolvrrService.fetchHtml as jest.Mock).mock
        .calls as Array<[string]>;
      const calledUrl = mockCalls[0][0];

      expect(calledUrl).toContain('_ssid=720239');
    });

    it('should not add q parameter to URL subscriptions', async (): Promise<void> => {
      const urlQuery = 'https://www.list.am/category/134?cnd=2&price2=30000';

      await scraperService.scrapeQuery(urlQuery);

      const mockCalls = (flaresolvrrService.fetchHtml as jest.Mock).mock
        .calls as Array<[string]>;
      const calledUrl = mockCalls[0][0];

      expect(calledUrl).not.toContain('q=');
    });

    it('should work with http protocol', async (): Promise<void> => {
      const urlQuery = 'http://www.list.am/category/134?cnd=2';

      await scraperService.scrapeQuery(urlQuery);

      expect(flaresolvrrService.fetchHtml).toHaveBeenCalledWith(urlQuery);
    });
  });

  describe('Parser buildSearchUrl method behavior', (): void => {
    it('should detect text as non-URL', (): void => {
      const result = parserService.buildSearchUrl(
        'https://www.list.am',
        'iPhone',
      );

      expect(result).toContain('q=iPhone');
    });

    it('should detect full URL as URL', (): void => {
      const url = 'https://www.list.am/category/134?cnd=2';
      const result = parserService.buildSearchUrl('https://www.list.am', url);

      expect(result).toBe(url);
    });

    it('should not treat partial URL as URL', (): void => {
      const result = parserService.buildSearchUrl(
        'https://www.list.am',
        'list.am/category',
      );

      expect(result).toContain('q=');
    });
  });
});
