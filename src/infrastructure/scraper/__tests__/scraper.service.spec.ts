/* eslint-disable @typescript-eslint/unbound-method */
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';

import { MetricsService } from '@list-am-bot/application/monitoring/metrics.service';
import { ScraperException } from '@list-am-bot/common/exceptions/bot.exceptions';
import { Listing } from '@list-am-bot/common/types/listing.types';
import {
  SeenListingRepositoryPort,
  ISeenListingRepository,
} from '@list-am-bot/domain/seen-listing/ports/seen-listing.repository.port';
import { FlaresolvrrService } from '@list-am-bot/infrastructure/scraper/flaresolverr.service';
import { ParserService } from '@list-am-bot/infrastructure/scraper/parser.service';
import { ScraperService } from '@list-am-bot/infrastructure/scraper/scraper.service';

describe('ScraperService', (): void => {
  let service: ScraperService;
  let flaresolvrrService: DeepMockProxy<FlaresolvrrService>;
  let parserService: DeepMockProxy<ParserService>;
  let configService: DeepMockProxy<ConfigService>;
  let seenListingRepository: DeepMockProxy<ISeenListingRepository>;
  let metricsService: DeepMockProxy<MetricsService>;

  beforeEach(async (): Promise<void> => {
    flaresolvrrService = mockDeep<FlaresolvrrService>();
    parserService = mockDeep<ParserService>();
    configService = mockDeep<ConfigService>();
    seenListingRepository = mockDeep<ISeenListingRepository>();
    metricsService = mockDeep<MetricsService>();

    configService.get.mockReturnValue('https://www.list.am');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScraperService,
        {
          provide: FlaresolvrrService,
          useValue: flaresolvrrService,
        },
        {
          provide: ParserService,
          useValue: parserService,
        },
        {
          provide: ConfigService,
          useValue: configService,
        },
        {
          provide: MetricsService,
          useValue: metricsService,
        },
        {
          provide: SeenListingRepositoryPort,
          useValue: seenListingRepository,
        },
      ],
    }).compile();

    service = module.get<ScraperService>(ScraperService);

    jest.spyOn(Logger.prototype, 'log').mockImplementation();
    jest.spyOn(Logger.prototype, 'debug').mockImplementation();
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach((): void => {
    jest.clearAllMocks();
  });

  it('should be defined', (): void => {
    expect(service).toBeDefined();
  });

  describe('scrapeQuery', (): void => {
    let mockListings: Listing[];

    beforeEach((): void => {
      mockListings = [
        {
          id: '123',
          title: 'Test Listing 1',
          url: 'https://list.am/item/123',
        },
        {
          id: '456',
          title: 'Test Listing 2',
          url: 'https://list.am/item/456',
        },
      ];

      parserService.buildSearchUrl.mockReturnValue(
        'https://www.list.am/ru/category?q=test',
      );
      flaresolvrrService.fetchHtml.mockResolvedValue('<html></html>');
      parserService.extractListings.mockReturnValue(mockListings);
    });

    it('should build search url with query', async (): Promise<void> => {
      await service.scrapeQuery('test query');

      expect(parserService.buildSearchUrl).toHaveBeenCalledWith(
        'https://www.list.am',
        'test query',
      );
    });

    it('should fetch html from built url', async (): Promise<void> => {
      await service.scrapeQuery('test query');

      expect(flaresolvrrService.fetchHtml).toHaveBeenCalledWith(
        'https://www.list.am/ru/category?q=test',
      );
    });

    it('should extract listings from html', async (): Promise<void> => {
      await service.scrapeQuery('test query');

      expect(parserService.extractListings).toHaveBeenCalledWith(
        '<html></html>',
        'https://www.list.am',
      );
    });

    it('should return scrape result with listings', async (): Promise<void> => {
      const result = await service.scrapeQuery('test query');

      expect(result.listings).toStrictEqual(mockListings);
    });

    it('should return scrape result with query', async (): Promise<void> => {
      const result = await service.scrapeQuery('test query');

      expect(result.query).toBe('test query');
    });

    it('should return scrape result with fetchedAt date', async (): Promise<void> => {
      const result = await service.scrapeQuery('test query');

      expect(result.fetchedAt).toBeInstanceOf(Date);
    });

    it('should throw ScraperException on fetch error', async (): Promise<void> => {
      flaresolvrrService.fetchHtml.mockRejectedValue(new Error('Fetch failed'));

      await expect(service.scrapeQuery('test query')).rejects.toThrow(
        ScraperException,
      );
    });

    it('should throw ScraperException on parser error', async (): Promise<void> => {
      parserService.extractListings.mockImplementation((): never => {
        throw new Error('Parse failed');
      });

      await expect(service.scrapeQuery('test query')).rejects.toThrow(
        ScraperException,
      );
    });

    it('should retry when getting zero listings', async (): Promise<void> => {
      parserService.extractListings
        .mockReturnValueOnce([])
        .mockReturnValueOnce(mockListings);

      await service.scrapeQuery('test query');

      expect(flaresolvrrService.fetchHtml).toHaveBeenCalledTimes(2);
    });

    it('should not retry infinitely', async (): Promise<void> => {
      parserService.extractListings.mockReturnValue([]);

      await service.scrapeQuery('test query');

      expect(flaresolvrrService.fetchHtml).toHaveBeenCalledTimes(2);
    });

    it('should return empty listings after retry', async (): Promise<void> => {
      parserService.extractListings.mockReturnValue([]);

      const result = await service.scrapeQuery('test query');

      expect(result.listings).toStrictEqual([]);
    });
  });

  describe('filterNewListings', (): void => {
    let mockListings: Listing[];

    beforeEach((): void => {
      mockListings = [
        {
          id: '123',
          title: 'Test Listing 1',
          url: 'https://list.am/item/123',
        },
        {
          id: '456',
          title: 'Test Listing 2',
          url: 'https://list.am/item/456',
        },
        {
          id: '789',
          title: 'Test Listing 3',
          url: 'https://list.am/item/789',
        },
      ];

      seenListingRepository.filterNewListings.mockResolvedValue(['123', '789']);
    });

    it('should call repository with subscription id and listing ids', async (): Promise<void> => {
      await service.filterNewListings(1, mockListings);

      expect(seenListingRepository.filterNewListings).toHaveBeenCalledWith(1, [
        '123',
        '456',
        '789',
      ]);
    });

    it('should return only new listings', async (): Promise<void> => {
      const result = await service.filterNewListings(1, mockListings);

      expect(result).toHaveLength(2);
    });

    it('should return listings with ids from repository', async (): Promise<void> => {
      const result = await service.filterNewListings(1, mockListings);

      expect(result[0].id).toBe('123');
    });

    it('should return second listing with correct id', async (): Promise<void> => {
      const result = await service.filterNewListings(1, mockListings);

      expect(result[1].id).toBe('789');
    });

    it('should return empty array for empty input', async (): Promise<void> => {
      const result = await service.filterNewListings(1, []);

      expect(result).toStrictEqual([]);
    });

    it('should not call repository for empty input', async (): Promise<void> => {
      await service.filterNewListings(1, []);

      expect(seenListingRepository.filterNewListings).not.toHaveBeenCalled();
    });

    it('should return empty array when no new listings', async (): Promise<void> => {
      seenListingRepository.filterNewListings.mockResolvedValue([]);

      const result = await service.filterNewListings(1, mockListings);

      expect(result).toStrictEqual([]);
    });
  });

  describe('markListingsAsSeen', (): void => {
    let mockListings: Listing[];

    beforeEach((): void => {
      mockListings = [
        {
          id: '123',
          title: 'Test Listing 1',
          url: 'https://list.am/item/123',
        },
        {
          id: '456',
          title: 'Test Listing 2',
          url: 'https://list.am/item/456',
        },
      ];

      seenListingRepository.markAsSeen.mockResolvedValue(undefined);
    });

    it('should call repository markAsSeen with subscription id', async (): Promise<void> => {
      await service.markListingsAsSeen(1, mockListings);

      expect(seenListingRepository.markAsSeen).toHaveBeenCalledWith(1, [
        '123',
        '456',
      ]);
    });

    it('should extract listing ids correctly', async (): Promise<void> => {
      await service.markListingsAsSeen(5, mockListings);

      expect(seenListingRepository.markAsSeen).toHaveBeenCalledWith(5, [
        '123',
        '456',
      ]);
    });

    it('should not call repository for empty listings', async (): Promise<void> => {
      await service.markListingsAsSeen(1, []);

      expect(seenListingRepository.markAsSeen).not.toHaveBeenCalled();
    });

    it('should handle single listing', async (): Promise<void> => {
      const singleListing = [mockListings[0]];

      await service.markListingsAsSeen(1, singleListing);

      expect(seenListingRepository.markAsSeen).toHaveBeenCalledWith(1, ['123']);
    });
  });
});
