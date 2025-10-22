import { UserEntity } from '@list-am-bot/domain/user/user.entity';

export const UserRepositoryPort = Symbol('UserRepositoryPort');

export interface IUserRepository {
  create(telegramUserId: number, username?: string): Promise<UserEntity>;

  findByTelegramUserId(telegramUserId: number): Promise<UserEntity | null>;

  findAllActive(): Promise<UserEntity[]>;

  updatePauseStatus(userId: number, isPaused: boolean): Promise<void>;

  updateLanguage(userId: number, language: string): Promise<void>;

  exists(telegramUserId: number): Promise<boolean>;
}
