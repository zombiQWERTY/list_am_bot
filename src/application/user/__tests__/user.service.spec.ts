/* eslint-disable @typescript-eslint/unbound-method */
import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';

import { UserService } from '@list-am-bot/application/user/user.service';
import {
  UserRepositoryPort,
  IUserRepository,
} from '@list-am-bot/domain/user/ports/user.repository.port';
import { UserEntity, UserLanguage } from '@list-am-bot/domain/user/user.entity';

const mockDate = new Date('2024-10-23T10:00:00.000Z');

describe('UserService', (): void => {
  let service: UserService;
  let userRepository: DeepMockProxy<IUserRepository>;

  beforeEach(async (): Promise<void> => {
    userRepository = mockDeep<IUserRepository>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: UserRepositoryPort,
          useValue: userRepository,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);

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

  describe('findOrCreate', (): void => {
    let mockUser: UserEntity;

    beforeEach((): void => {
      mockUser = new UserEntity({
        id: 1,
        telegramUserId: 12345,
        username: 'testuser',
        language: UserLanguage.EN,
        isPaused: false,
        createdAt: mockDate,
        updatedAt: mockDate,
      });
    });

    it('should check if user exists', async (): Promise<void> => {
      userRepository.findByTelegramUserId.mockResolvedValue(mockUser);

      await service.findOrCreate(12345, 'testuser');

      expect(userRepository.findByTelegramUserId).toHaveBeenCalledWith(12345);
    });

    it('should return existing user if found', async (): Promise<void> => {
      userRepository.findByTelegramUserId.mockResolvedValue(mockUser);

      const result = await service.findOrCreate(12345, 'testuser');

      expect(result).toStrictEqual(mockUser);
    });

    it('should not create user if already exists', async (): Promise<void> => {
      userRepository.findByTelegramUserId.mockResolvedValue(mockUser);

      await service.findOrCreate(12345, 'testuser');

      expect(userRepository.create).not.toHaveBeenCalled();
    });

    it('should create new user if not found', async (): Promise<void> => {
      userRepository.findByTelegramUserId.mockResolvedValue(null);
      userRepository.create.mockResolvedValue(mockUser);

      await service.findOrCreate(12345, 'testuser');

      expect(userRepository.create).toHaveBeenCalledWith(12345, 'testuser');
    });

    it('should return created user', async (): Promise<void> => {
      userRepository.findByTelegramUserId.mockResolvedValue(null);
      userRepository.create.mockResolvedValue(mockUser);

      const result = await service.findOrCreate(12345, 'testuser');

      expect(result).toStrictEqual(mockUser);
    });

    it('should create user without username if not provided', async (): Promise<void> => {
      userRepository.findByTelegramUserId.mockResolvedValue(null);
      userRepository.create.mockResolvedValue(mockUser);

      await service.findOrCreate(12345);

      expect(userRepository.create).toHaveBeenCalledWith(12345, undefined);
    });

    it('should handle duplicate key error by fetching existing user', async (): Promise<void> => {
      userRepository.findByTelegramUserId
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockUser);
      userRepository.create.mockRejectedValue({ code: '23505' });

      const result = await service.findOrCreate(12345, 'testuser');

      expect(result).toStrictEqual(mockUser);
    });

    it('should fetch user again after duplicate key error', async (): Promise<void> => {
      userRepository.findByTelegramUserId
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockUser);
      userRepository.create.mockRejectedValue({ code: '23505' });

      await service.findOrCreate(12345, 'testuser');

      expect(userRepository.findByTelegramUserId).toHaveBeenCalledTimes(2);
    });

    it('should throw error if not duplicate key error', async (): Promise<void> => {
      const genericError = new Error('Database error');
      userRepository.findByTelegramUserId.mockResolvedValue(null);
      userRepository.create.mockRejectedValue(genericError);

      await expect(service.findOrCreate(12345, 'testuser')).rejects.toThrow(
        'Database error',
      );
    });
  });

  describe('findByTelegramUserId', (): void => {
    let mockUser: UserEntity;

    beforeEach((): void => {
      mockUser = new UserEntity({
        id: 1,
        telegramUserId: 12345,
        username: 'testuser',
        language: UserLanguage.EN,
        isPaused: false,
        createdAt: mockDate,
        updatedAt: mockDate,
      });

      userRepository.findByTelegramUserId.mockResolvedValue(mockUser);
    });

    it('should call repository with correct telegram user id', async (): Promise<void> => {
      await service.findByTelegramUserId(12345);

      expect(userRepository.findByTelegramUserId).toHaveBeenCalledWith(12345);
    });

    it('should return user from repository', async (): Promise<void> => {
      const result = await service.findByTelegramUserId(12345);

      expect(result).toStrictEqual(mockUser);
    });

    it('should return null when user not found', async (): Promise<void> => {
      userRepository.findByTelegramUserId.mockResolvedValue(null);

      const result = await service.findByTelegramUserId(12345);

      expect(result).toBeNull();
    });
  });

  describe('findAllActive', (): void => {
    let mockUsers: UserEntity[];

    beforeEach((): void => {
      mockUsers = [
        new UserEntity({
          id: 1,
          telegramUserId: 12345,
          username: 'user1',
          language: UserLanguage.EN,
          isPaused: false,
          createdAt: mockDate,
          updatedAt: mockDate,
        }),
        new UserEntity({
          id: 2,
          telegramUserId: 67890,
          username: 'user2',
          language: UserLanguage.RU,
          isPaused: false,
          createdAt: mockDate,
          updatedAt: mockDate,
        }),
      ];

      userRepository.findAllActive.mockResolvedValue(mockUsers);
    });

    it('should call repository findAllActive', async (): Promise<void> => {
      await service.findAllActive();

      expect(userRepository.findAllActive).toHaveBeenCalled();
    });

    it('should return all active users from repository', async (): Promise<void> => {
      const result = await service.findAllActive();

      expect(result).toStrictEqual(mockUsers);
    });

    it('should return empty array when no active users', async (): Promise<void> => {
      userRepository.findAllActive.mockResolvedValue([]);

      const result = await service.findAllActive();

      expect(result).toStrictEqual([]);
    });
  });

  describe('pauseNotifications', (): void => {
    beforeEach((): void => {
      userRepository.updatePauseStatus.mockResolvedValue(undefined);
    });

    it('should call repository updatePauseStatus with true', async (): Promise<void> => {
      await service.pauseNotifications(1);

      expect(userRepository.updatePauseStatus).toHaveBeenCalledWith(1, true);
    });

    it('should pause notifications for correct user id', async (): Promise<void> => {
      await service.pauseNotifications(123);

      expect(userRepository.updatePauseStatus).toHaveBeenCalledWith(123, true);
    });
  });

  describe('resumeNotifications', (): void => {
    beforeEach((): void => {
      userRepository.updatePauseStatus.mockResolvedValue(undefined);
    });

    it('should call repository updatePauseStatus with false', async (): Promise<void> => {
      await service.resumeNotifications(1);

      expect(userRepository.updatePauseStatus).toHaveBeenCalledWith(1, false);
    });

    it('should resume notifications for correct user id', async (): Promise<void> => {
      await service.resumeNotifications(456);

      expect(userRepository.updatePauseStatus).toHaveBeenCalledWith(456, false);
    });
  });

  describe('updateLanguage', (): void => {
    beforeEach((): void => {
      userRepository.updateLanguage.mockResolvedValue(undefined);
    });

    it('should call repository updateLanguage with correct parameters', async (): Promise<void> => {
      await service.updateLanguage(1, 'ru');

      expect(userRepository.updateLanguage).toHaveBeenCalledWith(1, 'ru');
    });

    it('should update language for correct user id', async (): Promise<void> => {
      await service.updateLanguage(789, 'en');

      expect(userRepository.updateLanguage).toHaveBeenCalledWith(789, 'en');
    });
  });
});
