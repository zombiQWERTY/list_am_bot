import { Injectable, Inject } from '@nestjs/common';

import {
  UserRepositoryPort,
  IUserRepository,
} from '@list-am-bot/domain/user/ports/user.repository.port';
import { UserEntity } from '@list-am-bot/domain/user/user.entity';

@Injectable()
export class UserService {
  constructor(
    @Inject(UserRepositoryPort)
    private readonly userRepository: IUserRepository,
  ) {}

  async findOrCreate(
    telegramUserId: number,
    username?: string,
  ): Promise<UserEntity> {
    const existing =
      await this.userRepository.findByTelegramUserId(telegramUserId);

    if (existing) {
      return existing;
    }

    return this.userRepository.create(telegramUserId, username);
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
