import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';

import { MetricsService } from '@list-am-bot/application/monitoring/metrics.service';
import {
  ScrapeQueueService,
  ScrapePriority,
} from '@list-am-bot/application/scheduler/scrape-queue.service';

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

jest.mock(
  '@list-am-bot/common/utils/delay.util',
  (): {
    delay: jest.Mock;
  } => ({
    delay: jest.fn().mockResolvedValue(undefined),
  }),
);

describe('ScrapeQueueService', (): void => {
  let service: ScrapeQueueService;
  let metricsService: DeepMockProxy<MetricsService>;

  beforeEach(async (): Promise<void> => {
    metricsService = mockDeep<MetricsService>();
    metricsService.recordQueueSize.mockResolvedValue();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScrapeQueueService,
        {
          provide: MetricsService,
          useValue: metricsService,
        },
      ],
    }).compile();

    service = module.get<ScrapeQueueService>(ScrapeQueueService);

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

  describe('addTask', (): void => {
    let taskFn: jest.MockedFunction<() => Promise<void>>;

    beforeEach((): void => {
      taskFn = jest.fn().mockResolvedValue(undefined);
    });

    it('should add task to queue', (): void => {
      service.addTask('task-1', ScrapePriority.CRON_JOB, taskFn);

      const status = service.getStatus();

      expect(status.queueSize).toBe(1);
    });

    it('should add task with correct id', (): void => {
      service.addTask('task-1', ScrapePriority.CRON_JOB, taskFn);

      const status = service.getStatus();

      expect(status.tasks[0].id).toBe('task-1');
    });

    it('should add task with correct priority', (): void => {
      service.addTask('task-1', ScrapePriority.CRON_JOB, taskFn);

      const status = service.getStatus();

      expect(status.tasks[0].priority).toBe(ScrapePriority.CRON_JOB);
    });

    it('should replace existing task with same id', (): void => {
      const firstTaskFn = jest.fn().mockResolvedValue(undefined);
      const secondTaskFn = jest.fn().mockResolvedValue(undefined);

      service.addTask('task-1', ScrapePriority.CRON_JOB, firstTaskFn);
      service.addTask('task-1', ScrapePriority.USER_REQUEST, secondTaskFn);

      const status = service.getStatus();

      expect(status.queueSize).toBe(1);
    });

    it('should sort tasks by priority', (): void => {
      service.addTask('task-low', ScrapePriority.CRON_JOB, taskFn);
      service.addTask('task-high', ScrapePriority.INITIALIZATION, taskFn);
      service.addTask('task-medium', ScrapePriority.USER_REQUEST, taskFn);

      const status = service.getStatus();

      expect(status.tasks[0].id).toBe('task-high');
    });

    it('should have second task with medium priority', (): void => {
      service.addTask('task-low', ScrapePriority.CRON_JOB, taskFn);
      service.addTask('task-high', ScrapePriority.INITIALIZATION, taskFn);
      service.addTask('task-medium', ScrapePriority.USER_REQUEST, taskFn);

      const status = service.getStatus();

      expect(status.tasks[1].id).toBe('task-medium');
    });

    it('should have third task with low priority', (): void => {
      service.addTask('task-low', ScrapePriority.CRON_JOB, taskFn);
      service.addTask('task-high', ScrapePriority.INITIALIZATION, taskFn);
      service.addTask('task-medium', ScrapePriority.USER_REQUEST, taskFn);

      const status = service.getStatus();

      expect(status.tasks[2].id).toBe('task-low');
    });

    it('should add multiple tasks to queue', (): void => {
      service.addTask('task-1', ScrapePriority.CRON_JOB, taskFn);
      service.addTask('task-2', ScrapePriority.CRON_JOB, taskFn);
      service.addTask('task-3', ScrapePriority.CRON_JOB, taskFn);

      const status = service.getStatus();

      expect(status.queueSize).toBe(3);
    });
  });

  describe('getStatus', (): void => {
    let taskFn: jest.MockedFunction<() => Promise<void>>;

    beforeEach((): void => {
      taskFn = jest.fn().mockResolvedValue(undefined);
    });

    it('should return empty queue size when queue is empty', (): void => {
      const status = service.getStatus();

      expect(status.queueSize).toBe(0);
    });

    it('should return isProcessing as false initially', (): void => {
      const status = service.getStatus();

      expect(status.isProcessing).toBe(false);
    });

    it('should return null currentTask initially', (): void => {
      const status = service.getStatus();

      expect(status.currentTask).toBeNull();
    });

    it('should return empty tasks array initially', (): void => {
      const status = service.getStatus();

      expect(status.tasks).toStrictEqual([]);
    });

    it('should return correct queue size with tasks', (): void => {
      service.addTask('task-1', ScrapePriority.CRON_JOB, taskFn);
      service.addTask('task-2', ScrapePriority.CRON_JOB, taskFn);

      const status = service.getStatus();

      expect(status.queueSize).toBe(2);
    });

    it('should return tasks with correct structure', (): void => {
      service.addTask('task-1', ScrapePriority.CRON_JOB, taskFn);

      const status = service.getStatus();

      expect(status.tasks[0]).toHaveProperty('id');
    });

    it('should return tasks with priority property', (): void => {
      service.addTask('task-1', ScrapePriority.CRON_JOB, taskFn);

      const status = service.getStatus();

      expect(status.tasks[0]).toHaveProperty('priority');
    });

    it('should return tasks with waitTime property', (): void => {
      service.addTask('task-1', ScrapePriority.CRON_JOB, taskFn);

      const status = service.getStatus();

      expect(status.tasks[0]).toHaveProperty('waitTime');
    });
  });

  describe('clearQueue', (): void => {
    let taskFn: jest.MockedFunction<() => Promise<void>>;

    beforeEach((): void => {
      taskFn = jest.fn().mockResolvedValue(undefined);
    });

    it('should clear all tasks from queue', (): void => {
      service.addTask('task-1', ScrapePriority.CRON_JOB, taskFn);
      service.addTask('task-2', ScrapePriority.CRON_JOB, taskFn);

      service.clearQueue();

      expect(service.getStatus().queueSize).toBe(0);
    });

    it('should result in empty queue after clearing', (): void => {
      service.addTask('task-1', ScrapePriority.CRON_JOB, taskFn);

      service.clearQueue();

      expect(service.getStatus().tasks).toStrictEqual([]);
    });

    it('should clear queue with multiple tasks', (): void => {
      service.addTask('task-1', ScrapePriority.CRON_JOB, taskFn);
      service.addTask('task-2', ScrapePriority.USER_REQUEST, taskFn);
      service.addTask('task-3', ScrapePriority.INITIALIZATION, taskFn);

      service.clearQueue();

      expect(service.getStatus().queueSize).toBe(0);
    });

    it('should not throw when clearing empty queue', (): void => {
      expect((): void => service.clearQueue()).not.toThrow();
    });
  });

  describe('isTaskQueued', (): void => {
    let taskFn: jest.MockedFunction<() => Promise<void>>;

    beforeEach((): void => {
      taskFn = jest.fn().mockResolvedValue(undefined);
    });

    it('should return false for non-existent task', (): void => {
      const result = service.isTaskQueued('non-existent');

      expect(result).toBe(false);
    });

    it('should return true for queued task', (): void => {
      service.addTask('task-1', ScrapePriority.CRON_JOB, taskFn);

      const result = service.isTaskQueued('task-1');

      expect(result).toBe(true);
    });

    it('should return false after task is removed from queue', (): void => {
      service.addTask('task-1', ScrapePriority.CRON_JOB, taskFn);
      service.clearQueue();

      const result = service.isTaskQueued('task-1');

      expect(result).toBe(false);
    });

    it('should return true for first of multiple queued tasks', (): void => {
      service.addTask('task-1', ScrapePriority.CRON_JOB, taskFn);
      service.addTask('task-2', ScrapePriority.CRON_JOB, taskFn);

      const result = service.isTaskQueued('task-1');

      expect(result).toBe(true);
    });

    it('should return true for second of multiple queued tasks', (): void => {
      service.addTask('task-1', ScrapePriority.CRON_JOB, taskFn);
      service.addTask('task-2', ScrapePriority.CRON_JOB, taskFn);

      const result = service.isTaskQueued('task-2');

      expect(result).toBe(true);
    });

    it('should return false for task that was replaced', (): void => {
      service.addTask('task-1', ScrapePriority.CRON_JOB, taskFn);
      service.addTask('task-1', ScrapePriority.USER_REQUEST, taskFn);

      const result = service.isTaskQueued('task-1');

      expect(result).toBe(true);
    });
  });
});
