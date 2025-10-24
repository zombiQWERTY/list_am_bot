/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';

import { SubscriptionService } from '@list-am-bot/application/subscription/subscription.service';
import {
  DuplicateSubscriptionException,
  InvalidQueryException,
} from '@list-am-bot/common/exceptions/bot.exceptions';
import {
  SubscriptionRepositoryPort,
  ISubscriptionRepository,
} from '@list-am-bot/domain/subscription/ports/subscription.repository.port';
import { SubscriptionEntity } from '@list-am-bot/domain/subscription/subscription.entity';

const mockDate = new Date('2024-10-23T10:00:00.000Z');

describe('SubscriptionService', (): void => {
  let service: SubscriptionService;
  let subscriptionRepository: DeepMockProxy<ISubscriptionRepository>;

  beforeEach(async (): Promise<void> => {
    subscriptionRepository = mockDeep<ISubscriptionRepository>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionService,
        {
          provide: SubscriptionRepositoryPort,
          useValue: subscriptionRepository,
        },
      ],
    }).compile();

    service = module.get<SubscriptionService>(SubscriptionService);
  });

  afterEach((): void => {
    jest.clearAllMocks();
  });

  it('should be defined', (): void => {
    expect(service).toBeDefined();
  });

  describe('create', (): void => {
    let mockSubscription: SubscriptionEntity;

    beforeEach((): void => {
      mockSubscription = new SubscriptionEntity({
        id: 1,
        userId: 1,
        query: 'test query',
        isActive: true,
        createdAt: mockDate,
        updatedAt: mockDate,
      });

      subscriptionRepository.exists.mockResolvedValue(false);
      subscriptionRepository.create.mockResolvedValue(mockSubscription);
    });

    it('should check if subscription already exists', async (): Promise<void> => {
      await service.create(1, 'test query');

      expect(subscriptionRepository.exists).toHaveBeenCalledWith(
        1,
        'test query',
      );
    });

    it('should trim query before checking existence', async (): Promise<void> => {
      await service.create(1, '  test query  ');

      expect(subscriptionRepository.exists).toHaveBeenCalledWith(
        1,
        'test query',
      );
    });

    it('should create subscription with trimmed query', async (): Promise<void> => {
      await service.create(1, '  test query  ');

      expect(subscriptionRepository.create).toHaveBeenCalledWith(
        1,
        'test query',
      );
    });

    it('should return created subscription', async (): Promise<void> => {
      const result = await service.create(1, 'test query');

      expect(result).toStrictEqual(mockSubscription);
    });

    it('should throw DuplicateSubscriptionException if subscription exists', async (): Promise<void> => {
      subscriptionRepository.exists.mockResolvedValue(true);

      await expect(service.create(1, 'test query')).rejects.toThrow(
        DuplicateSubscriptionException,
      );
    });

    it('should not create subscription if duplicate exists', async (): Promise<void> => {
      subscriptionRepository.exists.mockResolvedValue(true);

      await expect(service.create(1, 'test query')).rejects.toThrow();

      expect(subscriptionRepository.create).not.toHaveBeenCalled();
    });

    it('should throw InvalidQueryException for empty query', async (): Promise<void> => {
      await expect(service.create(1, '')).rejects.toThrow(
        InvalidQueryException,
      );
    });

    it('should throw InvalidQueryException for whitespace-only query', async (): Promise<void> => {
      await expect(service.create(1, '   ')).rejects.toThrow(
        InvalidQueryException,
      );
    });

    it('should throw InvalidQueryException for too long query', async (): Promise<void> => {
      const longQuery = 'a'.repeat(501);

      await expect(service.create(1, longQuery)).rejects.toThrow(
        InvalidQueryException,
      );
    });

    it('should not check existence for invalid query', async (): Promise<void> => {
      await expect(service.create(1, '')).rejects.toThrow();

      expect(subscriptionRepository.exists).not.toHaveBeenCalled();
    });

    it('should accept query with exactly 500 characters', async (): Promise<void> => {
      const maxLengthQuery = 'a'.repeat(500);

      await service.create(1, maxLengthQuery);

      expect(subscriptionRepository.create).toHaveBeenCalled();
    });

    it('should accept query with 1 character', async (): Promise<void> => {
      await service.create(1, 'a');

      expect(subscriptionRepository.create).toHaveBeenCalled();
    });
  });

  describe('findByUserId', (): void => {
    let mockSubscriptions: SubscriptionEntity[];

    beforeEach((): void => {
      mockSubscriptions = [
        new SubscriptionEntity({
          id: 1,
          userId: 1,
          query: 'query 1',
          isActive: true,
          createdAt: mockDate,
          updatedAt: mockDate,
        }),
        new SubscriptionEntity({
          id: 2,
          userId: 1,
          query: 'query 2',
          isActive: false,
          createdAt: mockDate,
          updatedAt: mockDate,
        }),
      ];

      subscriptionRepository.findByUserId.mockResolvedValue(mockSubscriptions);
    });

    it('should call repository with correct userId', async (): Promise<void> => {
      await service.findByUserId(1);

      expect(subscriptionRepository.findByUserId).toHaveBeenCalledWith(1);
    });

    it('should return all subscriptions from repository', async (): Promise<void> => {
      const result = await service.findByUserId(1);

      expect(result).toStrictEqual(mockSubscriptions);
    });

    it('should return empty array when no subscriptions', async (): Promise<void> => {
      subscriptionRepository.findByUserId.mockResolvedValue([]);

      const result = await service.findByUserId(1);

      expect(result).toStrictEqual([]);
    });
  });

  describe('findActiveByUserId', (): void => {
    let mockActiveSubscriptions: SubscriptionEntity[];

    beforeEach((): void => {
      mockActiveSubscriptions = [
        new SubscriptionEntity({
          id: 1,
          userId: 1,
          query: 'active query 1',
          isActive: true,
          createdAt: mockDate,
          updatedAt: mockDate,
        }),
        new SubscriptionEntity({
          id: 2,
          userId: 1,
          query: 'active query 2',
          isActive: true,
          createdAt: mockDate,
          updatedAt: mockDate,
        }),
      ];

      subscriptionRepository.findActiveByUserId.mockResolvedValue(
        mockActiveSubscriptions,
      );
    });

    it('should call repository with correct userId', async (): Promise<void> => {
      await service.findActiveByUserId(1);

      expect(subscriptionRepository.findActiveByUserId).toHaveBeenCalledWith(1);
    });

    it('should return active subscriptions from repository', async (): Promise<void> => {
      const result = await service.findActiveByUserId(1);

      expect(result).toStrictEqual(mockActiveSubscriptions);
    });

    it('should return empty array when no active subscriptions', async (): Promise<void> => {
      subscriptionRepository.findActiveByUserId.mockResolvedValue([]);

      const result = await service.findActiveByUserId(1);

      expect(result).toStrictEqual([]);
    });
  });

  describe('delete', (): void => {
    beforeEach((): void => {
      subscriptionRepository.delete.mockResolvedValue(undefined);
    });

    it('should call repository delete', async (): Promise<void> => {
      await service.delete(1);

      expect(subscriptionRepository.delete).toHaveBeenCalledWith(1);
    });

    it('should delete subscription with correct id', async (): Promise<void> => {
      await service.delete(123);

      expect(subscriptionRepository.delete).toHaveBeenCalledWith(123);
    });
  });

  describe('deleteAll', (): void => {
    beforeEach((): void => {
      subscriptionRepository.deleteAllByUserId.mockResolvedValue(undefined);
    });

    it('should call repository deleteAllByUserId', async (): Promise<void> => {
      await service.deleteAll(1);

      expect(subscriptionRepository.deleteAllByUserId).toHaveBeenCalledWith(1);
    });

    it('should delete all subscriptions for correct userId', async (): Promise<void> => {
      await service.deleteAll(456);

      expect(subscriptionRepository.deleteAllByUserId).toHaveBeenCalledWith(456);
    });
  });

  describe('count', (): void => {
    beforeEach((): void => {
      subscriptionRepository.count.mockResolvedValue(5);
    });

    it('should call repository count with correct userId', async (): Promise<void> => {
      await service.count(1);

      expect(subscriptionRepository.count).toHaveBeenCalledWith(1);
    });

    it('should return count from repository', async (): Promise<void> => {
      const result = await service.count(1);

      expect(result).toBe(5);
    });

    it('should return zero when no subscriptions', async (): Promise<void> => {
      subscriptionRepository.count.mockResolvedValue(0);

      const result = await service.count(1);

      expect(result).toBe(0);
    });
  });
});
