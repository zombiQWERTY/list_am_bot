/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { Repository } from 'typeorm';

import { DeliveryEntity } from '@list-am-bot/domain/delivery/delivery.entity';
import { DeliveryEntityDto } from '@list-am-bot/infrastructure/database/typeorm/entity-dtos/delivery.entity.dto';
import { DeliveryMapper } from '@list-am-bot/infrastructure/database/typeorm/mappers/delivery.mapper';
import { DeliveryProviderToken } from '@list-am-bot/infrastructure/database/typeorm/providers/delivery.provider';
import { DeliveryRepository } from '@list-am-bot/infrastructure/database/typeorm/repositories/delivery.repository';

const mockDate = new Date('2024-10-23T10:00:00.000Z');

describe('DeliveryRepository', (): void => {
  let repository: DeliveryRepository;
  let repo: DeepMockProxy<Repository<DeliveryEntityDto>>;

  beforeEach(async (): Promise<void> => {
    repo = mockDeep<Repository<DeliveryEntityDto>>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeliveryRepository,
        {
          provide: DeliveryProviderToken,
          useValue: repo,
        },
      ],
    }).compile();

    repository = module.get<DeliveryRepository>(DeliveryRepository);
  });

  afterEach((): void => {
    jest.clearAllMocks();
  });

  it('should be defined', (): void => {
    expect(repository).toBeDefined();
  });

  describe('create', (): void => {
    let mockDeliveryDto: DeliveryEntityDto;
    let mockDelivery: DeliveryEntity;

    beforeEach((): void => {
      mockDeliveryDto = {
        id: 1,
        userId: 1,
        subscriptionId: 1,
        listingId: '123',
        messageId: '456',
        deliveredAt: mockDate,
      };

      mockDelivery = new DeliveryEntity({
        id: 1,
        userId: 1,
        subscriptionId: 1,
        listingId: '123',
        messageId: '456',
        deliveredAt: mockDate,
      });

      repo.create.mockReturnValue(mockDeliveryDto);
      repo.save.mockResolvedValue(mockDeliveryDto);
      jest.spyOn(DeliveryMapper, 'toDomain').mockReturnValue(mockDelivery);
    });

    afterEach((): void => {
      jest.restoreAllMocks();
    });

    it('should create delivery with message id', async (): Promise<void> => {
      await repository.create(1, 1, '123', '456');

      expect(repo.create).toHaveBeenCalledWith({
        userId: 1,
        subscriptionId: 1,
        listingId: '123',
        messageId: '456',
      });
    });

    it('should create delivery with null message id when not provided', async (): Promise<void> => {
      await repository.create(1, 1, '123');

      expect(repo.create).toHaveBeenCalledWith({
        userId: 1,
        subscriptionId: 1,
        listingId: '123',
        messageId: null,
      });
    });

    it('should save created delivery', async (): Promise<void> => {
      await repository.create(1, 1, '123', '456');

      expect(repo.save).toHaveBeenCalledWith(mockDeliveryDto);
    });

    it('should map saved delivery to domain', async (): Promise<void> => {
      await repository.create(1, 1, '123', '456');

      expect(DeliveryMapper.toDomain).toHaveBeenCalledWith(mockDeliveryDto);
    });

    it('should return domain delivery entity', async (): Promise<void> => {
      const result = await repository.create(1, 1, '123', '456');

      expect(result).toBe(mockDelivery);
    });
  });

  describe('findByUserId', (): void => {
    let mockDeliveryDtos: DeliveryEntityDto[];
    let mockDeliveries: DeliveryEntity[];

    beforeEach((): void => {
      mockDeliveryDtos = [
        {
          id: 1,
          userId: 1,
          subscriptionId: 1,
          listingId: '123',
          messageId: '456',
          deliveredAt: mockDate,
        },
        {
          id: 2,
          userId: 1,
          subscriptionId: 2,
          listingId: '789',
          messageId: '012',
          deliveredAt: mockDate,
        },
      ];

      mockDeliveries = mockDeliveryDtos.map(
        (dto): DeliveryEntity =>
          new DeliveryEntity({
            id: dto.id,
            userId: dto.userId,
            subscriptionId: dto.subscriptionId,
            listingId: dto.listingId,
            messageId: dto.messageId || undefined,
            deliveredAt: dto.deliveredAt,
          }),
      );

      jest
        .spyOn(DeliveryMapper, 'toDomain')
        .mockImplementation((dto): DeliveryEntity => {
          const delivery = mockDeliveries.find((d): boolean => d.id === dto.id);
          return delivery;
        });
    });

    afterEach((): void => {
      jest.restoreAllMocks();
    });

    it('should find deliveries by user id', async (): Promise<void> => {
      repo.find.mockResolvedValue(mockDeliveryDtos);

      await repository.findByUserId(1);

      expect(repo.find).toHaveBeenCalledWith({
        where: { userId: 1 },
        order: { deliveredAt: 'DESC' },
      });
    });

    it('should return mapped deliveries', async (): Promise<void> => {
      repo.find.mockResolvedValue(mockDeliveryDtos);

      const result = await repository.findByUserId(1);

      expect(result).toStrictEqual(mockDeliveries);
    });

    it('should return empty array when no deliveries found', async (): Promise<void> => {
      repo.find.mockResolvedValue([]);

      const result = await repository.findByUserId(1);

      expect(result).toStrictEqual([]);
    });
  });

  describe('exists', (): void => {
    it('should return true when delivery exists', async (): Promise<void> => {
      repo.existsBy.mockResolvedValue(true);

      const result = await repository.exists(1, '123');

      expect(result).toBe(true);
    });

    it('should return false when delivery does not exist', async (): Promise<void> => {
      repo.existsBy.mockResolvedValue(false);

      const result = await repository.exists(1, '123');

      expect(result).toBe(false);
    });

    it('should check existence by user id and listing id', async (): Promise<void> => {
      repo.existsBy.mockResolvedValue(true);

      await repository.exists(1, '123');

      expect(repo.existsBy).toHaveBeenCalledWith({
        userId: 1,
        listingId: '123',
      });
    });
  });
});
