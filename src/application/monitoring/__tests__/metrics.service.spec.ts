/* eslint-disable @typescript-eslint/unbound-method */
import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';

import { MetricsService } from '@list-am-bot/application/monitoring/metrics.service';
import {
  MetricEntity,
  MetricType,
} from '@list-am-bot/domain/metric/metric.entity';
import {
  MetricRepositoryPort,
  IMetricRepository,
} from '@list-am-bot/domain/metric/ports/metric.repository.port';

describe('MetricsService', (): void => {
  let service: MetricsService;
  let metricRepository: DeepMockProxy<IMetricRepository>;

  beforeEach(async (): Promise<void> => {
    metricRepository = mockDeep<IMetricRepository>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MetricsService,
        {
          provide: MetricRepositoryPort,
          useValue: metricRepository,
        },
      ],
    }).compile();

    service = module.get<MetricsService>(MetricsService);

    jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  it('should be defined', (): void => {
    expect(service).toBeDefined();
  });

  describe('recordScrapeDuration', (): void => {
    beforeEach((): void => {
      metricRepository.create.mockResolvedValue({} as MetricEntity);
    });

    it('should create metric with duration', async (): Promise<void> => {
      await service.recordScrapeDuration(1500, 'test query');

      expect(metricRepository.create).toHaveBeenCalledWith(
        MetricType.SCRAPE_DURATION,
        1500,
        { query: 'test query' },
      );
    });

    it('should handle repository error', async (): Promise<void> => {
      metricRepository.create.mockRejectedValue(new Error('DB error'));

      await expect(
        service.recordScrapeDuration(1500, 'test'),
      ).resolves.not.toThrow();
    });
  });

  describe('recordNotificationSuccess', (): void => {
    beforeEach((): void => {
      metricRepository.create.mockResolvedValue({} as MetricEntity);
    });

    it('should create success metric', async (): Promise<void> => {
      await service.recordNotificationSuccess(123, 'listing-456');

      expect(metricRepository.create).toHaveBeenCalledWith(
        MetricType.NOTIFICATION_SUCCESS,
        1,
        { userId: 123, listingId: 'listing-456' },
      );
    });

    it('should use value 1 for counter', async (): Promise<void> => {
      await service.recordNotificationSuccess(123, 'listing-456');

      expect(metricRepository.create).toHaveBeenCalledWith(
        expect.anything(),
        1,
        expect.anything(),
      );
    });

    it('should handle repository error', async (): Promise<void> => {
      metricRepository.create.mockRejectedValue(new Error('DB error'));

      await expect(
        service.recordNotificationSuccess(123, 'listing-456'),
      ).resolves.not.toThrow();
    });
  });

  describe('recordNotificationFailure', (): void => {
    beforeEach((): void => {
      metricRepository.create.mockResolvedValue({} as MetricEntity);
    });

    it('should create failure metric', async (): Promise<void> => {
      await service.recordNotificationFailure(
        123,
        'listing-456',
        'User blocked bot',
      );

      expect(metricRepository.create).toHaveBeenCalledWith(
        MetricType.NOTIFICATION_FAILURE,
        1,
        { userId: 123, listingId: 'listing-456', reason: 'User blocked bot' },
      );
    });

    it('should include failure reason', async (): Promise<void> => {
      await service.recordNotificationFailure(123, 'listing-456', 'timeout');

      expect(metricRepository.create).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({ reason: 'timeout' }),
      );
    });

    it('should handle repository error', async (): Promise<void> => {
      metricRepository.create.mockRejectedValue(new Error('DB error'));

      await expect(
        service.recordNotificationFailure(123, 'listing-456', 'error'),
      ).resolves.not.toThrow();
    });
  });

  describe('recordQueueSize', (): void => {
    beforeEach((): void => {
      metricRepository.create.mockResolvedValue({} as MetricEntity);
    });

    it('should create queue size metric', async (): Promise<void> => {
      await service.recordQueueSize(5);

      expect(metricRepository.create).toHaveBeenCalledWith(
        MetricType.QUEUE_SIZE,
        5,
      );
    });

    it('should record zero size', async (): Promise<void> => {
      await service.recordQueueSize(0);

      expect(metricRepository.create).toHaveBeenCalledWith(
        MetricType.QUEUE_SIZE,
        0,
      );
    });

    it('should handle repository error', async (): Promise<void> => {
      metricRepository.create.mockRejectedValue(new Error('DB error'));

      await expect(service.recordQueueSize(5)).resolves.not.toThrow();
    });
  });

  describe('recordActiveSubscriptions', (): void => {
    beforeEach((): void => {
      metricRepository.create.mockResolvedValue({} as MetricEntity);
    });

    it('should create active subscriptions metric', async (): Promise<void> => {
      await service.recordActiveSubscriptions(10);

      expect(metricRepository.create).toHaveBeenCalledWith(
        MetricType.ACTIVE_SUBSCRIPTIONS,
        10,
      );
    });

    it('should record zero subscriptions', async (): Promise<void> => {
      await service.recordActiveSubscriptions(0);

      expect(metricRepository.create).toHaveBeenCalledWith(
        MetricType.ACTIVE_SUBSCRIPTIONS,
        0,
      );
    });

    it('should handle repository error', async (): Promise<void> => {
      metricRepository.create.mockRejectedValue(new Error('DB error'));

      await expect(
        service.recordActiveSubscriptions(10),
      ).resolves.not.toThrow();
    });
  });

  describe('getAverageScrapeDuration', (): void => {
    beforeEach((): void => {
      metricRepository.getAverageByType.mockResolvedValue(1750.5);
    });

    it('should get average without since date', async (): Promise<void> => {
      await service.getAverageScrapeDuration();

      expect(metricRepository.getAverageByType).toHaveBeenCalledWith(
        MetricType.SCRAPE_DURATION,
        undefined,
      );
    });

    it('should get average with since date', async (): Promise<void> => {
      const since = new Date('2024-01-01');
      await service.getAverageScrapeDuration(since);

      expect(metricRepository.getAverageByType).toHaveBeenCalledWith(
        MetricType.SCRAPE_DURATION,
        since,
      );
    });

    it('should return average value', async (): Promise<void> => {
      const result = await service.getAverageScrapeDuration();

      expect(result).toBe(1750.5);
    });
  });

  describe('getNotificationSuccessRate', (): void => {
    let mockSuccessMetrics: MetricEntity[];
    let mockFailureMetrics: MetricEntity[];

    beforeEach((): void => {
      mockSuccessMetrics = [
        new MetricEntity({
          id: 1,
          type: MetricType.NOTIFICATION_SUCCESS,
          value: 1,
          createdAt: new Date('2024-01-01'),
        }),
        new MetricEntity({
          id: 2,
          type: MetricType.NOTIFICATION_SUCCESS,
          value: 1,
          createdAt: new Date('2024-01-02'),
        }),
        new MetricEntity({
          id: 3,
          type: MetricType.NOTIFICATION_SUCCESS,
          value: 1,
          createdAt: new Date('2024-01-03'),
        }),
      ];

      mockFailureMetrics = [
        new MetricEntity({
          id: 4,
          type: MetricType.NOTIFICATION_FAILURE,
          value: 1,
          createdAt: new Date('2024-01-02'),
        }),
      ];

      metricRepository.findByType
        .mockResolvedValueOnce(mockSuccessMetrics)
        .mockResolvedValueOnce(mockFailureMetrics);
    });

    it('should fetch success and failure metrics', async (): Promise<void> => {
      await service.getNotificationSuccessRate();

      expect(metricRepository.findByType).toHaveBeenCalledWith(
        MetricType.NOTIFICATION_SUCCESS,
        1000,
      );
    });

    it('should fetch failure metrics', async (): Promise<void> => {
      await service.getNotificationSuccessRate();

      expect(metricRepository.findByType).toHaveBeenCalledWith(
        MetricType.NOTIFICATION_FAILURE,
        1000,
      );
    });

    it('should calculate success rate percentage', async (): Promise<void> => {
      const result = await service.getNotificationSuccessRate();

      expect(result).toBe(75);
    });

    it('should return 0 for no metrics', async (): Promise<void> => {
      metricRepository.findByType.mockReset();
      metricRepository.findByType
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const result = await service.getNotificationSuccessRate();

      expect(result).toBe(0);
    });

    it('should filter by since date', async (): Promise<void> => {
      const since = new Date('2024-01-02');
      const result = await service.getNotificationSuccessRate(since);

      expect(result).toBe(66.66666666666666);
    });

    it('should return 100 for all success', async (): Promise<void> => {
      metricRepository.findByType.mockReset();
      metricRepository.findByType
        .mockResolvedValueOnce(mockSuccessMetrics)
        .mockResolvedValueOnce([]);

      const result = await service.getNotificationSuccessRate();

      expect(result).toBe(100);
    });

    it('should return 0 for all failures', async (): Promise<void> => {
      metricRepository.findByType.mockReset();
      metricRepository.findByType
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce(mockFailureMetrics);

      const result = await service.getNotificationSuccessRate();

      expect(result).toBe(0);
    });
  });
});
