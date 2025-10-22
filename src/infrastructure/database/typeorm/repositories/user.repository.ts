import { Injectable, Inject } from '@nestjs/common';
import { Repository } from 'typeorm';

import { IUserRepository } from '@list-am-bot/domain/user/ports/user.repository.port';
import { UserEntity, UserLanguage } from '@list-am-bot/domain/user/user.entity';
import { UserEntityDto } from '@list-am-bot/infrastructure/database/typeorm/entity-dtos/user.entity.dto';
import { UserMapper } from '@list-am-bot/infrastructure/database/typeorm/mappers/user.mapper';
import { UserProviderToken } from '@list-am-bot/infrastructure/database/typeorm/providers/user.provider';

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(
    @Inject(UserProviderToken)
    private readonly repo: Repository<UserEntityDto>,
  ) {}

  async create(telegramUserId: number, username?: string): Promise<UserEntity> {
    const user = this.repo.create({
      telegramUserId,
      username: username || null,
      language: UserLanguage.RU,
      isPaused: false,
    });

    const saved = await this.repo.save(user);
    return UserMapper.toDomain(saved);
  }

  async findByTelegramUserId(
    telegramUserId: number,
  ): Promise<UserEntity | null> {
    const user = await this.repo.findOne({ where: { telegramUserId } });
    return user ? UserMapper.toDomain(user) : null;
  }

  async findAllActive(): Promise<UserEntity[]> {
    const users = await this.repo.find({ where: { isPaused: false } });
    return users.map(
      (user: UserEntityDto): UserEntity => UserMapper.toDomain(user),
    );
  }

  async updatePauseStatus(userId: number, isPaused: boolean): Promise<void> {
    await this.repo.update(userId, { isPaused });
  }

  async updateLanguage(userId: number, language: string): Promise<void> {
    await this.repo.update(userId, { language: language as UserLanguage });
  }

  async exists(telegramUserId: number): Promise<boolean> {
    return this.repo.existsBy({ telegramUserId });
  }
}
