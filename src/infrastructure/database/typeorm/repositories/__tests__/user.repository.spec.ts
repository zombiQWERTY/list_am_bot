/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { Repository } from 'typeorm';

import { UserEntity, UserLanguage } from '@list-am-bot/domain/user/user.entity';
import { UserEntityDto } from '@list-am-bot/infrastructure/database/typeorm/entity-dtos/user.entity.dto';
import { UserMapper } from '@list-am-bot/infrastructure/database/typeorm/mappers/user.mapper';
import { UserProviderToken } from '@list-am-bot/infrastructure/database/typeorm/providers/user.provider';
import { UserRepository } from '@list-am-bot/infrastructure/database/typeorm/repositories/user.repository';

const mockDate = new Date('2024-10-23T10:00:00.000Z');

describe('UserRepository', (): void => {
  let repository: UserRepository;
  let repo: DeepMockProxy<Repository<UserEntityDto>>;

  beforeEach(async (): Promise<void> => {
    repo = mockDeep<Repository<UserEntityDto>>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserRepository,
        {
          provide: UserProviderToken,
          useValue: repo,
        },
      ],
    }).compile();

    repository = module.get<UserRepository>(UserRepository);
  });

  afterEach((): void => {
    jest.clearAllMocks();
  });

  it('should be defined', (): void => {
    expect(repository).toBeDefined();
  });

  describe('create', (): void => {
    let mockUserDto: UserEntityDto;
    let mockUser: UserEntity;

    beforeEach((): void => {
      mockUserDto = {
        id: 1,
        telegramUserId: 12345,
        username: 'testuser',
        language: UserLanguage.RU,
        isPaused: false,
        createdAt: mockDate,
        updatedAt: mockDate,
      };

      mockUser = new UserEntity({
        id: 1,
        telegramUserId: 12345,
        username: 'testuser',
        language: UserLanguage.RU,
        isPaused: false,
        createdAt: mockDate,
        updatedAt: mockDate,
      });

      repo.create.mockReturnValue(mockUserDto);
      repo.save.mockResolvedValue(mockUserDto);
      jest.spyOn(UserMapper, 'toDomain').mockReturnValue(mockUser);
    });

    afterEach((): void => {
      jest.restoreAllMocks();
    });

    it('should create user entity with correct data', async (): Promise<void> => {
      await repository.create(12345, 'testuser');

      expect(repo.create).toHaveBeenCalledWith({
        telegramUserId: 12345,
        username: 'testuser',
        language: UserLanguage.RU,
        isPaused: false,
      });
    });

    it('should create user entity with null username when not provided', async (): Promise<void> => {
      await repository.create(12345);

      expect(repo.create).toHaveBeenCalledWith({
        telegramUserId: 12345,
        username: null,
        language: UserLanguage.RU,
        isPaused: false,
      });
    });

    it('should save created user', async (): Promise<void> => {
      await repository.create(12345, 'testuser');

      expect(repo.save).toHaveBeenCalledWith(mockUserDto);
    });

    it('should map saved user to domain', async (): Promise<void> => {
      await repository.create(12345, 'testuser');

      expect(UserMapper.toDomain).toHaveBeenCalledWith(mockUserDto);
    });

    it('should return domain user entity', async (): Promise<void> => {
      const result = await repository.create(12345, 'testuser');

      expect(result).toBe(mockUser);
    });
  });

  describe('findByTelegramUserId', (): void => {
    let mockUserDto: UserEntityDto;
    let mockUser: UserEntity;

    beforeEach((): void => {
      mockUserDto = {
        id: 1,
        telegramUserId: 12345,
        username: 'testuser',
        language: UserLanguage.RU,
        isPaused: false,
        createdAt: mockDate,
        updatedAt: mockDate,
      };

      mockUser = new UserEntity({
        id: 1,
        telegramUserId: 12345,
        username: 'testuser',
        language: UserLanguage.RU,
        isPaused: false,
        createdAt: mockDate,
        updatedAt: mockDate,
      });

      jest.spyOn(UserMapper, 'toDomain').mockReturnValue(mockUser);
    });

    afterEach((): void => {
      jest.restoreAllMocks();
    });

    it('should find user by telegram user id', async (): Promise<void> => {
      repo.findOne.mockResolvedValue(mockUserDto);

      await repository.findByTelegramUserId(12345);

      expect(repo.findOne).toHaveBeenCalledWith({
        where: { telegramUserId: 12345 },
      });
    });

    it('should return mapped user when found', async (): Promise<void> => {
      repo.findOne.mockResolvedValue(mockUserDto);

      const result = await repository.findByTelegramUserId(12345);

      expect(result).toBe(mockUser);
    });

    it('should return null when user not found', async (): Promise<void> => {
      repo.findOne.mockResolvedValue(null);

      const result = await repository.findByTelegramUserId(12345);

      expect(result).toBeNull();
    });
  });

  describe('findAllActive', (): void => {
    let mockUserDtos: UserEntityDto[];
    let mockUsers: UserEntity[];

    beforeEach((): void => {
      mockUserDtos = [
        {
          id: 1,
          telegramUserId: 12345,
          username: 'user1',
          language: UserLanguage.RU,
          isPaused: false,
          createdAt: mockDate,
          updatedAt: mockDate,
        },
        {
          id: 2,
          telegramUserId: 67890,
          username: 'user2',
          language: UserLanguage.EN,
          isPaused: false,
          createdAt: mockDate,
          updatedAt: mockDate,
        },
      ];

      mockUsers = mockUserDtos.map(
        (dto): UserEntity =>
          new UserEntity({
            id: dto.id,
            telegramUserId: dto.telegramUserId,
            username: dto.username || undefined,
            language: dto.language,
            isPaused: dto.isPaused,
            createdAt: dto.createdAt,
            updatedAt: dto.updatedAt,
          }),
      );

      jest
        .spyOn(UserMapper, 'toDomain')
        .mockImplementation((dto): UserEntity => {
          const user = mockUsers.find((u): boolean => u.id === dto.id);
          return user;
        });
    });

    afterEach((): void => {
      jest.restoreAllMocks();
    });

    it('should find all active users', async (): Promise<void> => {
      repo.find.mockResolvedValue(mockUserDtos);

      await repository.findAllActive();

      expect(repo.find).toHaveBeenCalledWith({ where: { isPaused: false } });
    });

    it('should return mapped users', async (): Promise<void> => {
      repo.find.mockResolvedValue(mockUserDtos);

      const result = await repository.findAllActive();

      expect(result).toStrictEqual(mockUsers);
    });
  });

  describe('updatePauseStatus', (): void => {
    it('should update pause status to true', async (): Promise<void> => {
      await repository.updatePauseStatus(1, true);

      expect(repo.update).toHaveBeenCalledWith(1, { isPaused: true });
    });

    it('should update pause status to false', async (): Promise<void> => {
      await repository.updatePauseStatus(1, false);

      expect(repo.update).toHaveBeenCalledWith(1, { isPaused: false });
    });
  });

  describe('updateLanguage', (): void => {
    it('should update language to RU', async (): Promise<void> => {
      await repository.updateLanguage(1, 'ru');

      expect(repo.update).toHaveBeenCalledWith(1, {
        language: UserLanguage.RU,
      });
    });

    it('should update language to EN', async (): Promise<void> => {
      await repository.updateLanguage(1, 'en');

      expect(repo.update).toHaveBeenCalledWith(1, {
        language: UserLanguage.EN,
      });
    });
  });

  describe('exists', (): void => {
    it('should return true when user exists', async (): Promise<void> => {
      repo.existsBy.mockResolvedValue(true);

      const result = await repository.exists(12345);

      expect(result).toBe(true);
    });

    it('should return false when user does not exist', async (): Promise<void> => {
      repo.existsBy.mockResolvedValue(false);

      const result = await repository.exists(12345);

      expect(result).toBe(false);
    });

    it('should check existence by telegram user id', async (): Promise<void> => {
      repo.existsBy.mockResolvedValue(true);

      await repository.exists(12345);

      expect(repo.existsBy).toHaveBeenCalledWith({ telegramUserId: 12345 });
    });
  });
});
