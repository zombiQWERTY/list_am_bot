/* eslint-disable @typescript-eslint/unbound-method */
import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';

import { MetricsReportService } from '@list-am-bot/application/monitoring/metrics-report.service';
import { MetricsReportSchedulerService } from '@list-am-bot/infrastructure/scheduler/metrics-report-scheduler.service';

describe('MetricsReportSchedulerService', (): void => {
  let service: MetricsReportSchedulerService;
  let metricsReportService: DeepMockProxy<MetricsReportService>;

  beforeEach(async (): Promise<void> => {
    metricsReportService = mockDeep<MetricsReportService>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MetricsReportSchedulerService,
        {
          provide: MetricsReportService,
          useValue: metricsReportService,
        },
      ],
    }).compile();

    service = module.get<MetricsReportSchedulerService>(
      MetricsReportSchedulerService,
    );

    jest.spyOn(Logger.prototype, 'log').mockImplementation();
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach((): void => {
    jest.clearAllMocks();
  });

  it('should be defined', (): void => {
    expect(service).toBeDefined();
  });

  describe('handleDailyReport', (): void => {
    beforeEach((): void => {
      metricsReportService.sendDailyReport.mockResolvedValue();
    });

    it('should call metrics report service', async (): Promise<void> => {
      await service.handleDailyReport();

      expect(metricsReportService.sendDailyReport).toHaveBeenCalled();
    });

    it('should handle service errors', async (): Promise<void> => {
      metricsReportService.sendDailyReport.mockRejectedValue(
        new Error('Report generation failed'),
      );

      await expect(service.handleDailyReport()).resolves.not.toThrow();
    });

    it('should call service once', async (): Promise<void> => {
      await service.handleDailyReport();

      expect(metricsReportService.sendDailyReport).toHaveBeenCalledTimes(1);
    });
  });
});
