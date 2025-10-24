/* eslint-disable @typescript-eslint/unbound-method */
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { Context, Telegraf } from 'telegraf';

import { MetricsReportService } from '@list-am-bot/application/monitoring/metrics-report.service';
import { MetricsService } from '@list-am-bot/application/monitoring/metrics.service';
import { LIST_AM_BOT } from '@list-am-bot/constants';
import {
  MetricEntity,
  MetricType,
} from '@list-am-bot/domain/metric/metric.entity';
import {
  MetricRepositoryPort,
  IMetricRepository,
} from '@list-am-bot/domain/metric/ports/metric.repository.port';

describe('MetricsReportService', (): void => {
  let service: MetricsReportService;
  let bot: DeepMockProxy<Telegraf<Context>>;
  let metricsService: DeepMockProxy<MetricsService>;
  let metricRepository: DeepMockProxy<IMetricRepository>;
  let configService: DeepMockProxy<ConfigService>;

  beforeEach(async (): Promise<void> => {
    bot = mockDeep<Telegraf<Context>>();
    metricsService = mockDeep<MetricsService>();
    metricRepository = mockDeep<IMetricRepository>();
    configService = mockDeep<ConfigService>();

    configService.get.mockImplementation((key: string): unknown => {
      if (key === 'bot.botIncidentsUserId') {
        return 123456789;
      }
      return undefined;
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MetricsReportService,
        {
          provide: `${LIST_AM_BOT}Bot`,
          useValue: bot,
        },
        {
          provide: MetricsService,
          useValue: metricsService,
        },
        {
          provide: MetricRepositoryPort,
          useValue: metricRepository,
        },
        {
          provide: ConfigService,
          useValue: configService,
        },
      ],
    }).compile();

    service = module.get<MetricsReportService>(MetricsReportService);

    jest.spyOn(Logger.prototype, 'log').mockImplementation();
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

  describe('sendDailyReport', (): void => {
    beforeEach((): void => {
      metricRepository.getAverageByType.mockResolvedValue(1500);
      metricsService.getNotificationSuccessRate.mockResolvedValue(95.5);

      const successMetrics = [
        new MetricEntity({
          id: 1,
          type: MetricType.NOTIFICATION_SUCCESS,
          value: 1,
          createdAt: new Date(),
        }),
        new MetricEntity({
          id: 2,
          type: MetricType.NOTIFICATION_SUCCESS,
          value: 1,
          createdAt: new Date(),
        }),
      ];

      const failureMetrics = [
        new MetricEntity({
          id: 3,
          type: MetricType.NOTIFICATION_FAILURE,
          value: 1,
          createdAt: new Date(),
        }),
      ];

      const queueMetrics = [
        new MetricEntity({
          id: 4,
          type: MetricType.QUEUE_SIZE,
          value: 5,
          createdAt: new Date(),
        }),
        new MetricEntity({
          id: 5,
          type: MetricType.QUEUE_SIZE,
          value: 3,
          createdAt: new Date(),
        }),
      ];

      const subscriptionMetrics = [
        new MetricEntity({
          id: 6,
          type: MetricType.ACTIVE_SUBSCRIPTIONS,
          value: 10,
          createdAt: new Date(),
        }),
        new MetricEntity({
          id: 7,
          type: MetricType.ACTIVE_SUBSCRIPTIONS,
          value: 12,
          createdAt: new Date(),
        }),
      ];

      metricRepository.findByType.mockImplementation(
        (type: MetricType): Promise<MetricEntity[]> => {
          if (type === MetricType.NOTIFICATION_SUCCESS) {
            return Promise.resolve(successMetrics);
          }
          if (type === MetricType.NOTIFICATION_FAILURE) {
            return Promise.resolve(failureMetrics);
          }
          if (type === MetricType.QUEUE_SIZE) {
            return Promise.resolve(queueMetrics);
          }
          if (type === MetricType.ACTIVE_SUBSCRIPTIONS) {
            return Promise.resolve(subscriptionMetrics);
          }
          return Promise.resolve([] as MetricEntity[]);
        },
      );

      bot.telegram.sendMessage.mockResolvedValue({} as never);
    });

    it('should send report to admin', async (): Promise<void> => {
      await service.sendDailyReport();

      expect(bot.telegram.sendMessage).toHaveBeenCalledWith(
        123456789,
        expect.any(String),
        { parse_mode: 'HTML' },
      );
    });

    it('should include 24 hours metrics', async (): Promise<void> => {
      await service.sendDailyReport();

      const [[, message]] = bot.telegram.sendMessage.mock.calls;
      expect(message).toContain('Last 24 Hours');
    });

    it('should include 7 days metrics', async (): Promise<void> => {
      await service.sendDailyReport();

      const [[, message]] = bot.telegram.sendMessage.mock.calls;
      expect(message).toContain('Last 7 Days');
    });

    it('should include 30 days metrics', async (): Promise<void> => {
      await service.sendDailyReport();

      const [[, message]] = bot.telegram.sendMessage.mock.calls;
      expect(message).toContain('Last 30 Days');
    });

    it('should include scrape duration', async (): Promise<void> => {
      await service.sendDailyReport();

      const [[, message]] = bot.telegram.sendMessage.mock.calls;
      expect(message).toContain('Avg Scrape Duration');
    });

    it('should include notification stats', async (): Promise<void> => {
      await service.sendDailyReport();

      const [[, message]] = bot.telegram.sendMessage.mock.calls;
      expect(message).toContain('Notifications');
    });

    it('should include queue size', async (): Promise<void> => {
      await service.sendDailyReport();

      const [[, message]] = bot.telegram.sendMessage.mock.calls;
      expect(message).toContain('Avg Queue Size');
    });

    it('should include active subscriptions', async (): Promise<void> => {
      await service.sendDailyReport();

      const [[, message]] = bot.telegram.sendMessage.mock.calls;
      expect(message).toContain('Avg Active Subs');
    });

    it('should format message with HTML', async (): Promise<void> => {
      await service.sendDailyReport();

      const [[, , options]] = bot.telegram.sendMessage.mock.calls;
      expect(options).toEqual({ parse_mode: 'HTML' });
    });

    it('should not send if admin user id not configured', async (): Promise<void> => {
      configService.get.mockReturnValue(null);

      const newModule = await Test.createTestingModule({
        providers: [
          MetricsReportService,
          {
            provide: `${LIST_AM_BOT}Bot`,
            useValue: bot,
          },
          {
            provide: MetricsService,
            useValue: metricsService,
          },
          {
            provide: MetricRepositoryPort,
            useValue: metricRepository,
          },
          {
            provide: ConfigService,
            useValue: configService,
          },
        ],
      }).compile();

      const newService =
        newModule.get<MetricsReportService>(MetricsReportService);

      await newService.sendDailyReport();

      expect(bot.telegram.sendMessage).not.toHaveBeenCalled();
    });

    it('should handle send message error', async (): Promise<void> => {
      bot.telegram.sendMessage.mockRejectedValue(
        new Error('Telegram API error'),
      );

      await expect(service.sendDailyReport()).resolves.not.toThrow();
    });

    it('should fetch metrics for three periods', async (): Promise<void> => {
      await service.sendDailyReport();

      expect(metricRepository.getAverageByType).toHaveBeenCalledTimes(3);
    });

    it('should fetch success rate for three periods', async (): Promise<void> => {
      await service.sendDailyReport();

      expect(metricsService.getNotificationSuccessRate).toHaveBeenCalledTimes(
        3,
      );
    });

    it('should include date in report', async (): Promise<void> => {
      await service.sendDailyReport();

      const [[, message]] = bot.telegram.sendMessage.mock.calls;
      expect(message).toContain('Metrics Report');
    });
  });
});
