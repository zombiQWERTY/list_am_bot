/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { DataSource, Repository } from 'typeorm';

import { SubscriptionEntity } from '@list-am-bot/domain/subscription/subscription.entity';
import { SubscriptionEntityDto } from '@list-am-bot/infrastructure/database/typeorm/entity-dtos/subscription.entity.dto';
import { SubscriptionMapper } from '@list-am-bot/infrastructure/database/typeorm/mappers/subscription.mapper';
import { SubscriptionProviderToken } from '@list-am-bot/infrastructure/database/typeorm/providers/subscription.provider';
import { SubscriptionRepository } from '@list-am-bot/infrastructure/database/typeorm/repositories/subscription.repository';

const mockDate = new Date('2024-10-23T10:00:00.000Z');

describe('SubscriptionRepository', (): void => {
  let repository: SubscriptionRepository;
  let repo: DeepMockProxy<Repository<SubscriptionEntityDto>>;
  let dataSource: DeepMockProxy<DataSource>;

  beforeEach(async (): Promise<void> => {
    repo = mockDeep<Repository<SubscriptionEntityDto>>();
    dataSource = mockDeep<DataSource>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionRepository,
        {
          provide: SubscriptionProviderToken,
          useValue: repo,
        },
        {
          provide: DataSource,
          useValue: dataSource,
        },
      ],
    }).compile();

    repository = module.get<SubscriptionRepository>(SubscriptionRepository);
  });

  afterEach((): void => {
    jest.clearAllMocks();
  });

  it('should be defined', (): void => {
    expect(repository).toBeDefined();
  });

  describe('create', (): void => {
    let mockSubscriptionDto: SubscriptionEntityDto;
    let mockSubscription: SubscriptionEntity;

    beforeEach((): void => {
      mockSubscriptionDto = {
        id: 1,
        userId: 1,
        query: 'test query',
        isActive: true,
        createdAt: mockDate,
        updatedAt: mockDate,
      };

      mockSubscription = new SubscriptionEntity({
        id: 1,
        userId: 1,
        query: 'test query',
        isActive: true,
        createdAt: mockDate,
        updatedAt: mockDate,
      });

      repo.create.mockReturnValue(mockSubscriptionDto);
      repo.save.mockResolvedValue(mockSubscriptionDto);
      jest
        .spyOn(SubscriptionMapper, 'toDomain')
        .mockReturnValue(mockSubscription);
    });

    afterEach((): void => {
      jest.restoreAllMocks();
    });

    it('should create subscription with correct data', async (): Promise<void> => {
      await repository.create(1, 'test query');

      expect(repo.create).toHaveBeenCalledWith({
        userId: 1,
        query: 'test query',
        isActive: true,
      });
    });

    it('should save created subscription', async (): Promise<void> => {
      await repository.create(1, 'test query');

      expect(repo.save).toHaveBeenCalledWith(mockSubscriptionDto);
    });

    it('should map saved subscription to domain', async (): Promise<void> => {
      await repository.create(1, 'test query');

      expect(SubscriptionMapper.toDomain).toHaveBeenCalledWith(
        mockSubscriptionDto,
      );
    });

    it('should return domain subscription entity', async (): Promise<void> => {
      const result = await repository.create(1, 'test query');

      expect(result).toBe(mockSubscription);
    });
  });

  describe('findById', (): void => {
    let mockSubscriptionDto: SubscriptionEntityDto;
    let mockSubscription: SubscriptionEntity;

    beforeEach((): void => {
      mockSubscriptionDto = {
        id: 1,
        userId: 1,
        query: 'test query',
        isActive: true,
        createdAt: mockDate,
        updatedAt: mockDate,
      };

      mockSubscription = new SubscriptionEntity({
        id: 1,
        userId: 1,
        query: 'test query',
        isActive: true,
        createdAt: mockDate,
        updatedAt: mockDate,
      });

      jest
        .spyOn(SubscriptionMapper, 'toDomain')
        .mockReturnValue(mockSubscription);
    });

    afterEach((): void => {
      jest.restoreAllMocks();
    });

    it('should find subscription by id', async (): Promise<void> => {
      repo.findOne.mockResolvedValue(mockSubscriptionDto);

      await repository.findById(1);

      expect(repo.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('should return mapped subscription when found', async (): Promise<void> => {
      repo.findOne.mockResolvedValue(mockSubscriptionDto);

      const result = await repository.findById(1);

      expect(result).toBe(mockSubscription);
    });

    it('should return null when subscription not found', async (): Promise<void> => {
      repo.findOne.mockResolvedValue(null);

      const result = await repository.findById(1);

      expect(result).toBeNull();
    });
  });

  describe('findByUserId', (): void => {
    let mockSubscriptionDtos: SubscriptionEntityDto[];
    let mockSubscriptions: SubscriptionEntity[];

    beforeEach((): void => {
      mockSubscriptionDtos = [
        {
          id: 1,
          userId: 1,
          query: 'query 1',
          isActive: true,
          createdAt: mockDate,
          updatedAt: mockDate,
        },
        {
          id: 2,
          userId: 1,
          query: 'query 2',
          isActive: false,
          createdAt: mockDate,
          updatedAt: mockDate,
        },
      ];

      mockSubscriptions = mockSubscriptionDtos.map(
        (dto): SubscriptionEntity =>
          new SubscriptionEntity({
            id: dto.id,
            userId: dto.userId,
            query: dto.query,
            isActive: dto.isActive,
            createdAt: dto.createdAt,
            updatedAt: dto.updatedAt,
          }),
      );

      jest
        .spyOn(SubscriptionMapper, 'toDomain')
        .mockImplementation((dto): SubscriptionEntity => {
          return mockSubscriptions.find((s): boolean => s.id === dto.id);
        });
    });

    afterEach((): void => {
      jest.restoreAllMocks();
    });

    it('should find only active subscriptions by default', async (): Promise<void> => {
      repo.find.mockResolvedValue(mockSubscriptionDtos);

      await repository.findByUserId(1);

      expect(repo.find).toHaveBeenCalledWith({
        where: { userId: 1, isActive: true },
        order: { createdAt: 'DESC' },
      });
    });

    it('should find all subscriptions when includeInactive is true', async (): Promise<void> => {
      repo.find.mockResolvedValue(mockSubscriptionDtos);

      await repository.findByUserId(1, true);

      expect(repo.find).toHaveBeenCalledWith({
        where: { userId: 1 },
        order: { createdAt: 'DESC' },
      });
    });

    it('should return mapped subscriptions', async (): Promise<void> => {
      repo.find.mockResolvedValue(mockSubscriptionDtos);

      const result = await repository.findByUserId(1);

      expect(result).toStrictEqual(mockSubscriptions);
    });
  });

  describe('findActiveByUserId', (): void => {
    let mockSubscriptionDtos: SubscriptionEntityDto[];
    let mockSubscriptions: SubscriptionEntity[];

    beforeEach((): void => {
      mockSubscriptionDtos = [
        {
          id: 1,
          userId: 1,
          query: 'query 1',
          isActive: true,
          createdAt: mockDate,
          updatedAt: mockDate,
        },
      ];

      mockSubscriptions = mockSubscriptionDtos.map(
        (dto): SubscriptionEntity =>
          new SubscriptionEntity({
            id: dto.id,
            userId: dto.userId,
            query: dto.query,
            isActive: dto.isActive,
            createdAt: dto.createdAt,
            updatedAt: dto.updatedAt,
          }),
      );

      jest
        .spyOn(SubscriptionMapper, 'toDomain')
        .mockImplementation((dto): SubscriptionEntity => {
          return mockSubscriptions.find((s): boolean => s.id === dto.id);
        });
    });

    afterEach((): void => {
      jest.restoreAllMocks();
    });

    it('should find active subscriptions', async (): Promise<void> => {
      repo.find.mockResolvedValue(mockSubscriptionDtos);

      await repository.findActiveByUserId(1);

      expect(repo.find).toHaveBeenCalledWith({
        where: { userId: 1, isActive: true },
        order: { createdAt: 'DESC' },
      });
    });

    it('should return mapped subscriptions', async (): Promise<void> => {
      repo.find.mockResolvedValue(mockSubscriptionDtos);

      const result = await repository.findActiveByUserId(1);

      expect(result).toStrictEqual(mockSubscriptions);
    });
  });

  describe('exists', (): void => {
    it('should return true when subscription exists', async (): Promise<void> => {
      repo.existsBy.mockResolvedValue(true);

      const result = await repository.exists(1, 'test query');

      expect(result).toBe(true);
    });

    it('should return false when subscription does not exist', async (): Promise<void> => {
      repo.existsBy.mockResolvedValue(false);

      const result = await repository.exists(1, 'test query');

      expect(result).toBe(false);
    });

    it('should check existence by user id, query and active status', async (): Promise<void> => {
      repo.existsBy.mockResolvedValue(true);

      await repository.exists(1, 'test query');

      expect(repo.existsBy).toHaveBeenCalledWith({
        userId: 1,
        query: 'test query',
        isActive: true,
      });
    });
  });

  describe('deactivate', (): void => {
    it('should update subscription to inactive', async (): Promise<void> => {
      await repository.deactivate(1);

      expect(repo.update).toHaveBeenCalledWith(1, { isActive: false });
    });
  });

  describe('delete', (): void => {
    it('should delete subscription by id', async (): Promise<void> => {
      await repository.delete(1);

      expect(repo.delete).toHaveBeenCalledWith(1);
    });
  });

  describe('deleteAllByUserId', (): void => {
    it('should delete all subscriptions by user id', async (): Promise<void> => {
      await repository.deleteAllByUserId(1);

      expect(repo.delete).toHaveBeenCalledWith({ userId: 1 });
    });
  });

  describe('count', (): void => {
    it('should count active subscriptions', async (): Promise<void> => {
      repo.count.mockResolvedValue(5);

      const result = await repository.count(1);

      expect(result).toBe(5);
    });

    it('should count with correct where clause', async (): Promise<void> => {
      repo.count.mockResolvedValue(5);

      await repository.count(1);

      expect(repo.count).toHaveBeenCalledWith({
        where: { userId: 1, isActive: true },
      });
    });
  });
});
