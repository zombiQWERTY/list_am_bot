/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { Repository, MoreThanOrEqual } from 'typeorm';

import {
  MetricEntity,
  MetricType,
} from '@list-am-bot/domain/metric/metric.entity';
import { MetricEntityDto } from '@list-am-bot/infrastructure/database/typeorm/entity-dtos/metric.entity.dto';
import { MetricMapper } from '@list-am-bot/infrastructure/database/typeorm/mappers/metric.mapper';
import { MetricProviderToken } from '@list-am-bot/infrastructure/database/typeorm/providers/metric.provider';
import { MetricRepository } from '@list-am-bot/infrastructure/database/typeorm/repositories/metric.repository';

describe('MetricRepository', (): void => {
  let repository: MetricRepository;
  let repo: DeepMockProxy<Repository<MetricEntityDto>>;

  beforeEach(async (): Promise<void> => {
    repo = mockDeep<Repository<MetricEntityDto>>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MetricRepository,
        {
          provide: MetricProviderToken,
          useValue: repo,
        },
      ],
    }).compile();

    repository = module.get<MetricRepository>(MetricRepository);

    jest.spyOn(MetricMapper, 'toDomain').mockImplementation(
      (dto): MetricEntity =>
        new MetricEntity({
          id: dto.id,
          type: dto.type,
          value: Number(dto.value),
          createdAt: dto.createdAt,
          metadata: dto.metadata,
        }),
    );
  });

  it('should be defined', (): void => {
    expect(repository).toBeDefined();
  });

  describe('create', (): void => {
    let mockDto: MetricEntityDto;
    let savedDto: MetricEntityDto;

    beforeEach((): void => {
      mockDto = {
        type: MetricType.SCRAPE_DURATION,
        value: 1500,
        metadata: null,
      } as MetricEntityDto;

      savedDto = {
        id: 1,
        type: MetricType.SCRAPE_DURATION,
        value: 1500,
        metadata: null,
        createdAt: new Date('2024-01-01'),
      } as MetricEntityDto;

      repo.create.mockReturnValue(mockDto);
      repo.save.mockResolvedValue(savedDto);
    });

    it('should create metric dto', async (): Promise<void> => {
      await repository.create(MetricType.SCRAPE_DURATION, 1500);

      expect(repo.create).toHaveBeenCalledWith({
        type: MetricType.SCRAPE_DURATION,
        value: 1500,
        metadata: null,
      });
    });

    it('should save metric dto', async (): Promise<void> => {
      await repository.create(MetricType.SCRAPE_DURATION, 1500);

      expect(repo.save).toHaveBeenCalledWith(mockDto);
    });

    it('should return metric entity', async (): Promise<void> => {
      const result = await repository.create(MetricType.SCRAPE_DURATION, 1500);

      expect(result.id).toBe(1);
    });

    it('should create metric with metadata', async (): Promise<void> => {
      await repository.create(MetricType.SCRAPE_DURATION, 1500, {
        query: 'test',
      });

      expect(repo.create).toHaveBeenCalledWith({
        type: MetricType.SCRAPE_DURATION,
        value: 1500,
        metadata: { query: 'test' },
      });
    });

    it('should create notification success metric', async (): Promise<void> => {
      await repository.create(MetricType.NOTIFICATION_SUCCESS, 1, {
        userId: 123,
      });

      expect(repo.create).toHaveBeenCalledWith({
        type: MetricType.NOTIFICATION_SUCCESS,
        value: 1,
        metadata: { userId: 123 },
      });
    });
  });

  describe('findByType', (): void => {
    let mockDtos: MetricEntityDto[];

    beforeEach((): void => {
      mockDtos = [
        {
          id: 1,
          type: MetricType.SCRAPE_DURATION,
          value: 1500,
          metadata: null,
          createdAt: new Date('2024-01-01'),
        },
        {
          id: 2,
          type: MetricType.SCRAPE_DURATION,
          value: 2000,
          metadata: null,
          createdAt: new Date('2024-01-02'),
        },
      ] as MetricEntityDto[];

      repo.find.mockResolvedValue(mockDtos);
    });

    it('should find by type with default limit', async (): Promise<void> => {
      await repository.findByType(MetricType.SCRAPE_DURATION);

      expect(repo.find).toHaveBeenCalledWith({
        where: { type: MetricType.SCRAPE_DURATION },
        order: { createdAt: 'DESC' },
        take: 100,
      });
    });

    it('should find by type with custom limit', async (): Promise<void> => {
      await repository.findByType(MetricType.SCRAPE_DURATION, 50);

      expect(repo.find).toHaveBeenCalledWith({
        where: { type: MetricType.SCRAPE_DURATION },
        order: { createdAt: 'DESC' },
        take: 50,
      });
    });

    it('should return metric entities', async (): Promise<void> => {
      const result = await repository.findByType(MetricType.SCRAPE_DURATION);

      expect(result).toHaveLength(2);
    });

    it('should map dtos to entities', async (): Promise<void> => {
      const result = await repository.findByType(MetricType.SCRAPE_DURATION);

      expect(result[0].id).toBe(1);
    });
  });

  describe('findRecent', (): void => {
    let mockDtos: MetricEntityDto[];

    beforeEach((): void => {
      mockDtos = [
        {
          id: 3,
          type: MetricType.QUEUE_SIZE,
          value: 5,
          metadata: null,
          createdAt: new Date('2024-01-03'),
        },
      ] as MetricEntityDto[];

      repo.find.mockResolvedValue(mockDtos);
    });

    it('should find recent with limit', async (): Promise<void> => {
      await repository.findRecent(10);

      expect(repo.find).toHaveBeenCalledWith({
        order: { createdAt: 'DESC' },
        take: 10,
      });
    });

    it('should return metric entities', async (): Promise<void> => {
      const result = await repository.findRecent(10);

      expect(result).toHaveLength(1);
    });
  });

  describe('getAverageByType', (): void => {
    let mockQueryBuilder: {
      select: jest.Mock;
      where: jest.Mock;
      getRawOne: jest.Mock;
    };

    beforeEach((): void => {
      mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ average: '1750.50' }),
      };

      repo.createQueryBuilder.mockReturnValue(mockQueryBuilder as never);
    });

    it('should calculate average without since date', async (): Promise<void> => {
      await repository.getAverageByType(MetricType.SCRAPE_DURATION);

      expect(mockQueryBuilder.where).toHaveBeenCalledWith({
        type: MetricType.SCRAPE_DURATION,
      });
    });

    it('should calculate average with since date', async (): Promise<void> => {
      const since = new Date('2024-01-01');
      await repository.getAverageByType(MetricType.SCRAPE_DURATION, since);

      expect(mockQueryBuilder.where).toHaveBeenCalledWith({
        type: MetricType.SCRAPE_DURATION,
        createdAt: MoreThanOrEqual(since),
      });
    });

    it('should return parsed average', async (): Promise<void> => {
      const result = await repository.getAverageByType(
        MetricType.SCRAPE_DURATION,
      );

      expect(result).toBe(1750.5);
    });

    it('should return zero for null average', async (): Promise<void> => {
      mockQueryBuilder.getRawOne.mockResolvedValue({ average: null });

      const result = await repository.getAverageByType(
        MetricType.SCRAPE_DURATION,
      );

      expect(result).toBe(0);
    });

    it('should return zero for undefined result', async (): Promise<void> => {
      mockQueryBuilder.getRawOne.mockResolvedValue(undefined);

      const result = await repository.getAverageByType(
        MetricType.SCRAPE_DURATION,
      );

      expect(result).toBe(0);
    });

    it('should use AVG function', async (): Promise<void> => {
      await repository.getAverageByType(MetricType.SCRAPE_DURATION);

      expect(mockQueryBuilder.select).toHaveBeenCalledWith(
        'AVG(metric.value)',
        'average',
      );
    });
  });
});
