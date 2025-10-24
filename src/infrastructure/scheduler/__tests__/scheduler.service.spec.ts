/* eslint-disable @typescript-eslint/unbound-method */
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';

import { ScrapeWorkerService } from '@list-am-bot/application/scheduler/scrape-worker.service';
import { SchedulerService } from '@list-am-bot/infrastructure/scheduler/scheduler.service';

describe('SchedulerService', (): void => {
  let service: SchedulerService;
  let scrapeWorker: DeepMockProxy<ScrapeWorkerService>;
  let configService: DeepMockProxy<ConfigService>;

  beforeEach(async (): Promise<void> => {
    scrapeWorker = mockDeep<ScrapeWorkerService>();
    configService = mockDeep<ConfigService>();

    configService.get.mockReturnValue('0 * * * *');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SchedulerService,
        {
          provide: ScrapeWorkerService,
          useValue: scrapeWorker,
        },
        {
          provide: ConfigService,
          useValue: configService,
        },
      ],
    }).compile();

    jest.spyOn(Logger.prototype, 'log').mockImplementation();

    service = module.get<SchedulerService>(SchedulerService);
  });

  afterEach((): void => {
    jest.clearAllMocks();
  });

  it('should be defined', (): void => {
    expect(service).toBeDefined();
  });

  describe('handleCron', (): void => {
    beforeEach((): void => {
      scrapeWorker.runCycle.mockReturnValue(undefined);
    });

    it('should call scrapeWorker runCycle', (): void => {
      service.handleCron();

      expect(scrapeWorker.runCycle).toHaveBeenCalled();
    });

    it('should call runCycle exactly once', (): void => {
      service.handleCron();

      expect(scrapeWorker.runCycle).toHaveBeenCalledTimes(1);
    });

    it('should not throw error', (): void => {
      expect((): void => service.handleCron()).not.toThrow();
    });
  });
});
