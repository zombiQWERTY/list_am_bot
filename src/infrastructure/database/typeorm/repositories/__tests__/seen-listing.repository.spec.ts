/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { In, Repository } from 'typeorm';

import { SeenListingEntity } from '@list-am-bot/domain/seen-listing/seen-listing.entity';
import { SeenListingEntityDto } from '@list-am-bot/infrastructure/database/typeorm/entity-dtos/seen-listing.entity.dto';
import { SeenListingMapper } from '@list-am-bot/infrastructure/database/typeorm/mappers/seen-listing.mapper';
import { SeenListingProviderToken } from '@list-am-bot/infrastructure/database/typeorm/providers/seen-listing.provider';
import { SeenListingRepository } from '@list-am-bot/infrastructure/database/typeorm/repositories/seen-listing.repository';

const mockDate = new Date('2024-10-23T10:00:00.000Z');

describe('SeenListingRepository', (): void => {
  let repository: SeenListingRepository;
  let repo: DeepMockProxy<Repository<SeenListingEntityDto>>;

  beforeEach(async (): Promise<void> => {
    repo = mockDeep<Repository<SeenListingEntityDto>>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SeenListingRepository,
        {
          provide: SeenListingProviderToken,
          useValue: repo,
        },
      ],
    }).compile();

    repository = module.get<SeenListingRepository>(SeenListingRepository);
  });

  afterEach((): void => {
    jest.clearAllMocks();
  });

  it('should be defined', (): void => {
    expect(repository).toBeDefined();
  });

  describe('markAsSeen', (): void => {
    let mockQueryBuilder: {
      insert: jest.Mock;
      into: jest.Mock;
      values: jest.Mock;
      orIgnore: jest.Mock;
      execute: jest.Mock;
    };

    beforeEach((): void => {
      mockQueryBuilder = {
        insert: jest.fn().mockReturnThis(),
        into: jest.fn().mockReturnThis(),
        values: jest.fn().mockReturnThis(),
        orIgnore: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue(undefined),
      };

      repo.createQueryBuilder.mockReturnValue(mockQueryBuilder as never);
      repo.create.mockImplementation(
        (data: Partial<SeenListingEntityDto>): SeenListingEntityDto =>
          data as SeenListingEntityDto,
      );
    });

    it('should create entities for each listing id', async (): Promise<void> => {
      await repository.markAsSeen(1, ['123', '456']);

      expect(repo.create).toHaveBeenCalledTimes(2);
    });

    it('should create entity with subscription id and listing id', async (): Promise<void> => {
      await repository.markAsSeen(1, ['123']);

      expect(repo.create).toHaveBeenCalledWith({
        subscriptionId: 1,
        listingId: '123',
      });
    });

    it('should use query builder to insert', async (): Promise<void> => {
      await repository.markAsSeen(1, ['123']);

      expect(repo.createQueryBuilder).toHaveBeenCalled();
    });

    it('should insert into seen listing table', async (): Promise<void> => {
      await repository.markAsSeen(1, ['123']);

      expect(mockQueryBuilder.into).toHaveBeenCalledWith(SeenListingEntityDto);
    });

    it('should use or ignore for duplicates', async (): Promise<void> => {
      await repository.markAsSeen(1, ['123']);

      expect(mockQueryBuilder.orIgnore).toHaveBeenCalled();
    });

    it('should execute the query', async (): Promise<void> => {
      await repository.markAsSeen(1, ['123']);

      expect(mockQueryBuilder.execute).toHaveBeenCalled();
    });
  });

  describe('findBySubscriptionId', (): void => {
    let mockSeenListingDtos: SeenListingEntityDto[];
    let mockSeenListings: SeenListingEntity[];

    beforeEach((): void => {
      mockSeenListingDtos = [
        {
          id: 1,
          subscriptionId: 1,
          listingId: '123',
          firstSeenAt: mockDate,
        },
        {
          id: 2,
          subscriptionId: 1,
          listingId: '456',
          firstSeenAt: mockDate,
        },
      ];

      mockSeenListings = mockSeenListingDtos.map(
        (dto): SeenListingEntity =>
          new SeenListingEntity({
            id: dto.id,
            subscriptionId: dto.subscriptionId,
            listingId: dto.listingId,
            firstSeenAt: dto.firstSeenAt,
          }),
      );

      jest
        .spyOn(SeenListingMapper, 'toDomain')
        .mockImplementation((dto): SeenListingEntity => {
          const seen = mockSeenListings.find((s): boolean => s.id === dto.id);
          return seen;
        });
    });

    afterEach((): void => {
      jest.restoreAllMocks();
    });

    it('should find seen listings by subscription id', async (): Promise<void> => {
      repo.find.mockResolvedValue(mockSeenListingDtos);

      await repository.findBySubscriptionId(1);

      expect(repo.find).toHaveBeenCalledWith({ where: { subscriptionId: 1 } });
    });

    it('should return mapped seen listings', async (): Promise<void> => {
      repo.find.mockResolvedValue(mockSeenListingDtos);

      const result = await repository.findBySubscriptionId(1);

      expect(result).toStrictEqual(mockSeenListings);
    });
  });

  describe('existsForSubscription', (): void => {
    it('should return true when listing exists for subscription', async (): Promise<void> => {
      repo.existsBy.mockResolvedValue(true);

      const result = await repository.existsForSubscription(1, '123');

      expect(result).toBe(true);
    });

    it('should return false when listing does not exist', async (): Promise<void> => {
      repo.existsBy.mockResolvedValue(false);

      const result = await repository.existsForSubscription(1, '123');

      expect(result).toBe(false);
    });

    it('should check existence by subscription and listing id', async (): Promise<void> => {
      repo.existsBy.mockResolvedValue(true);

      await repository.existsForSubscription(1, '123');

      expect(repo.existsBy).toHaveBeenCalledWith({
        subscriptionId: 1,
        listingId: '123',
      });
    });
  });

  describe('filterNewListings', (): void => {
    beforeEach((): void => {
      jest.spyOn(SeenListingMapper, 'toDomain').mockImplementation(
        (dto): SeenListingEntity =>
          new SeenListingEntity({
            id: dto.id,
            subscriptionId: dto.subscriptionId,
            listingId: dto.listingId,
            firstSeenAt: dto.firstSeenAt,
          }),
      );
    });

    afterEach((): void => {
      jest.restoreAllMocks();
    });

    it('should return empty array when input is empty', async (): Promise<void> => {
      const result = await repository.filterNewListings(1, []);

      expect(result).toStrictEqual([]);
    });

    it('should find seen listings with In operator', async (): Promise<void> => {
      repo.find.mockResolvedValue([]);

      await repository.filterNewListings(1, ['123', '456']);

      expect(repo.find).toHaveBeenCalledWith({
        where: {
          subscriptionId: 1,
          listingId: In(['123', '456']),
        },
      });
    });

    it('should return all listings when none are seen', async (): Promise<void> => {
      repo.find.mockResolvedValue([]);

      const result = await repository.filterNewListings(1, ['123', '456']);

      expect(result).toStrictEqual(['123', '456']);
    });

    it('should filter out seen listings', async (): Promise<void> => {
      repo.find.mockResolvedValue([
        {
          id: 1,
          subscriptionId: 1,
          listingId: '123',
          firstSeenAt: mockDate,
        },
      ]);

      const result = await repository.filterNewListings(1, ['123', '456']);

      expect(result).toStrictEqual(['456']);
    });

    it('should return empty array when all listings are seen', async (): Promise<void> => {
      repo.find.mockResolvedValue([
        {
          id: 1,
          subscriptionId: 1,
          listingId: '123',
          firstSeenAt: mockDate,
        },
        {
          id: 2,
          subscriptionId: 1,
          listingId: '456',
          firstSeenAt: mockDate,
        },
      ]);

      const result = await repository.filterNewListings(1, ['123', '456']);

      expect(result).toStrictEqual([]);
    });
  });

  describe('deleteBySubscriptionId', (): void => {
    it('should delete by subscription id', async (): Promise<void> => {
      await repository.deleteBySubscriptionId(1);

      expect(repo.delete).toHaveBeenCalledWith({ subscriptionId: 1 });
    });
  });
});
