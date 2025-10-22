import { Injectable, Inject, Logger } from '@nestjs/common';

import {
  UserRepositoryPort,
  IUserRepository,
} from '@list-am-bot/domain/user/ports/user.repository.port';
import { UserEntity } from '@list-am-bot/domain/user/user.entity';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @Inject(UserRepositoryPort)
    private readonly userRepository: IUserRepository,
  ) {}

  async findOrCreate(
    telegramUserId: number,
    username?: string,
  ): Promise<UserEntity> {
    // Try to find existing user first
    const existing =
      await this.userRepository.findByTelegramUserId(telegramUserId);

    if (existing) {
      return existing;
    }

    // Try to create, but handle race condition
    try {
      return await this.userRepository.create(telegramUserId, username);
    } catch (error) {
      // If unique constraint violation (duplicate telegramUserId), fetch the user
      // This can happen if two requests come at the same time
      if (this.isDuplicateKeyError(error)) {
        this.logger.debug(
          `Race condition detected for telegramUserId ${telegramUserId}, fetching existing user`,
        );
        const user =
          await this.userRepository.findByTelegramUserId(telegramUserId);
        if (user) {
          return user;
        }
      }
      // Re-throw if it's a different error
      throw error;
    }
  }

  private isDuplicateKeyError(error: unknown): boolean {
    if (error && typeof error === 'object' && 'code' in error) {
      // PostgreSQL duplicate key error code
      return error.code === '23505';
    }
    return false;
  }

  async findByTelegramUserId(
    telegramUserId: number,
  ): Promise<UserEntity | null> {
    return this.userRepository.findByTelegramUserId(telegramUserId);
  }

  async findAllActive(): Promise<UserEntity[]> {
    return this.userRepository.findAllActive();
  }

  async pauseNotifications(userId: number): Promise<void> {
    await this.userRepository.updatePauseStatus(userId, true);
  }

  async resumeNotifications(userId: number): Promise<void> {
    await this.userRepository.updatePauseStatus(userId, false);
  }

  async updateLanguage(userId: number, language: string): Promise<void> {
    await this.userRepository.updateLanguage(userId, language);
  }
}
