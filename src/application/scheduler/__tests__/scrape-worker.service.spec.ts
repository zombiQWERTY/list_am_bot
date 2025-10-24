/* eslint-disable @typescript-eslint/unbound-method */
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';

import { MetricsService } from '@list-am-bot/application/monitoring/metrics.service';
import { NotificationService } from '@list-am-bot/application/notification/notification.service';
import {
  ScrapeQueueService,
  ScrapePriority,
} from '@list-am-bot/application/scheduler/scrape-queue.service';
import { ScrapeWorkerService } from '@list-am-bot/application/scheduler/scrape-worker.service';
import { SubscriptionService } from '@list-am-bot/application/subscription/subscription.service';
import { UserService } from '@list-am-bot/application/user/user.service';
import { Listing, ScrapeResult } from '@list-am-bot/common/types/listing.types';
import { ScraperService } from '@list-am-bot/infrastructure/scraper/scraper.service';

const mockDate = new Date('2024-10-23T10:00:00.000Z');
const RealDate = Date;

global.Date = class extends RealDate {
  constructor() {
    super();
    return mockDate;
  }

  static now(): number {
    return mockDate.getTime();
  }
} as DateConstructor;

describe('ScrapeWorkerService', (): void => {
  let service: ScrapeWorkerService;
  let userService: DeepMockProxy<UserService>;
  let subscriptionService: DeepMockProxy<SubscriptionService>;
  let scraperService: DeepMockProxy<ScraperService>;
  let notificationService: DeepMockProxy<NotificationService>;
  let configService: DeepMockProxy<ConfigService>;
  let scrapeQueue: DeepMockProxy<ScrapeQueueService>;
  let metricsService: DeepMockProxy<MetricsService>;

  beforeEach(async (): Promise<void> => {
    userService = mockDeep<UserService>();
    subscriptionService = mockDeep<SubscriptionService>();
    scraperService = mockDeep<ScraperService>();
    notificationService = mockDeep<NotificationService>();
    configService = mockDeep<ConfigService>();
    scrapeQueue = mockDeep<ScrapeQueueService>();
    metricsService = mockDeep<MetricsService>();

    configService.get.mockReturnValue(2500);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScrapeWorkerService,
        {
          provide: UserService,
          useValue: userService,
        },
        {
          provide: SubscriptionService,
          useValue: subscriptionService,
        },
        {
          provide: ScraperService,
          useValue: scraperService,
        },
        {
          provide: NotificationService,
          useValue: notificationService,
        },
        {
          provide: MetricsService,
          useValue: metricsService,
        },
        {
          provide: ConfigService,
          useValue: configService,
        },
        {
          provide: ScrapeQueueService,
          useValue: scrapeQueue,
        },
      ],
    }).compile();

    service = module.get<ScrapeWorkerService>(ScrapeWorkerService);

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

  describe('initializeSubscription', (): void => {
    let mockListings: Listing[];
    let mockScrapeResult: ScrapeResult;

    beforeEach((): void => {
      mockListings = [
        {
          id: 'listing-1',
          title: 'Test Listing 1',
          url: 'https://list.am/item/1',
        },
        {
          id: 'listing-2',
          title: 'Test Listing 2',
          url: 'https://list.am/item/2',
        },
      ];

      mockScrapeResult = {
        query: 'test query',
        listings: mockListings,
        fetchedAt: mockDate,
      };

      scraperService.scrapeQuery.mockResolvedValue(mockScrapeResult);
      scraperService.markListingsAsSeen.mockResolvedValue(undefined);
    });

    it('should call scrapeQuery with correct query', async (): Promise<void> => {
      await service.initializeSubscription(1, 'test query');

      expect(scraperService.scrapeQuery).toHaveBeenCalledWith('test query');
    });

    it('should mark listings as seen when listings found', async (): Promise<void> => {
      await service.initializeSubscription(1, 'test query');

      expect(scraperService.markListingsAsSeen).toHaveBeenCalledWith(
        1,
        mockListings,
      );
    });

    it('should not mark listings as seen when no listings found', async (): Promise<void> => {
      scraperService.scrapeQuery.mockResolvedValue({
        query: 'test query',
        listings: [],
        fetchedAt: mockDate,
      });

      await service.initializeSubscription(1, 'test query');

      expect(scraperService.markListingsAsSeen).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully without throwing', async (): Promise<void> => {
      scraperService.scrapeQuery.mockRejectedValue(new Error('Scrape failed'));

      await expect(
        service.initializeSubscription(1, 'test query'),
      ).resolves.toBeUndefined();
    });

    it('should not throw when markListingsAsSeen fails', async (): Promise<void> => {
      scraperService.markListingsAsSeen.mockRejectedValue(
        new Error('Mark failed'),
      );

      await expect(
        service.initializeSubscription(1, 'test query'),
      ).resolves.toBeUndefined();
    });
  });

  describe('runCycle', (): void => {
    beforeEach((): void => {
      scrapeQueue.isTaskQueued.mockReturnValue(false);
      scrapeQueue.addTask.mockReturnValue(undefined);
    });

    it('should check if task already queued', (): void => {
      service.runCycle();

      expect(scrapeQueue.isTaskQueued).toHaveBeenCalled();
    });

    it('should not add task if already queued', (): void => {
      scrapeQueue.isTaskQueued.mockReturnValue(true);

      service.runCycle();

      expect(scrapeQueue.addTask).not.toHaveBeenCalled();
    });

    it('should add task with CRON_JOB priority', (): void => {
      service.runCycle();

      expect(scrapeQueue.addTask).toHaveBeenCalledWith(
        expect.any(String),
        ScrapePriority.CRON_JOB,
        expect.any(Function),
      );
    });

    it('should add task with taskId containing cron prefix', (): void => {
      service.runCycle();

      const callArgs = scrapeQueue.addTask.mock.calls[0];
      expect(callArgs[0]).toMatch(/^cron-/);
    });

    it('should add task with function as third parameter', (): void => {
      service.runCycle();

      const callArgs = scrapeQueue.addTask.mock.calls[0];
      expect(typeof callArgs[2]).toBe('function');
    });
  });

  describe('scrapeQueryForUser', (): void => {
    let mockScrapeResult: ScrapeResult;

    beforeEach((): void => {
      mockScrapeResult = {
        query: 'test query',
        listings: [
          {
            id: 'listing-1',
            title: 'Test Listing',
            url: 'https://list.am/item/1',
          },
        ],
        fetchedAt: mockDate,
      };

      scraperService.scrapeQuery.mockResolvedValue(mockScrapeResult);
      scrapeQueue.addTask.mockImplementation(
        (
          _taskId: string,
          _priority: ScrapePriority,
          taskFn: () => Promise<void>,
        ): void => {
          void taskFn();
        },
      );
    });

    it('should add task to queue with USER_REQUEST priority', async (): Promise<void> => {
      const promise = service.scrapeQueryForUser(1, 'test query');

      await promise;

      expect(scrapeQueue.addTask).toHaveBeenCalledWith(
        expect.any(String),
        ScrapePriority.USER_REQUEST,
        expect.any(Function),
      );
    });

    it('should add task with taskId containing user id', async (): Promise<void> => {
      const promise = service.scrapeQueryForUser(123, 'test query');

      await promise;

      const callArgs = scrapeQueue.addTask.mock.calls[0];
      expect(callArgs[0]).toMatch(/^user-123-/);
    });

    it('should call scraperService with correct query', async (): Promise<void> => {
      await service.scrapeQueryForUser(1, 'test query');

      expect(scraperService.scrapeQuery).toHaveBeenCalledWith('test query');
    });

    it('should return scrape result on success', async (): Promise<void> => {
      const result = await service.scrapeQueryForUser(1, 'test query');

      expect(result).toStrictEqual(mockScrapeResult);
    });

    it('should return error result when scraper fails', async (): Promise<void> => {
      scraperService.scrapeQuery.mockRejectedValue(new Error('Scrape failed'));

      const result = await service.scrapeQueryForUser(1, 'test query');

      expect(result.error).toBe('Scrape failed');
    });

    it('should return empty listings array when scraper fails', async (): Promise<void> => {
      scraperService.scrapeQuery.mockRejectedValue(new Error('Scrape failed'));

      const result = await service.scrapeQueryForUser(1, 'test query');

      expect(result.listings).toStrictEqual([]);
    });

    it('should return query in error result', async (): Promise<void> => {
      scraperService.scrapeQuery.mockRejectedValue(new Error('Scrape failed'));

      const result = await service.scrapeQueryForUser(1, 'test query');

      expect(result.query).toBe('test query');
    });

    it('should return fetchedAt in error result', async (): Promise<void> => {
      scraperService.scrapeQuery.mockRejectedValue(new Error('Scrape failed'));

      const result = await service.scrapeQueryForUser(1, 'test query');

      expect(result.fetchedAt).toBeDefined();
    });

    it('should handle non-Error exceptions', async (): Promise<void> => {
      scraperService.scrapeQuery.mockRejectedValue('String error');

      const result = await service.scrapeQueryForUser(1, 'test query');

      expect(result.error).toBe('Unknown error occurred');
    });
  });
});
