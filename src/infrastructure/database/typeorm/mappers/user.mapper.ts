import { UserEntity } from '@list-am-bot/domain/user/user.entity';

import { UserEntityDto } from '../entity-dtos/user.entity.dto';

export class UserMapper {
  static toDomain(dto: UserEntityDto): UserEntity {
    return new UserEntity({
      id: dto.id,
      telegramUserId: dto.telegramUserId,
      username: dto.username,
      language: dto.language,
      isPaused: dto.isPaused,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    });
  }

  static fromDomain(domain: UserEntity): UserEntityDto;
  static fromDomain(domain: Partial<UserEntity>): Partial<UserEntityDto>;
  static fromDomain(domain: UserEntity | Partial<UserEntity>): UserEntityDto {
    const dto = new UserEntityDto();

    if (domain.id !== undefined) dto.id = domain.id;
    if (domain.telegramUserId !== undefined)
      dto.telegramUserId = domain.telegramUserId;
    if (domain.username !== undefined) dto.username = domain.username;
    if (domain.language !== undefined) dto.language = domain.language;
    if (domain.isPaused !== undefined) dto.isPaused = domain.isPaused;
    if (domain.createdAt !== undefined) dto.createdAt = domain.createdAt;
    if (domain.updatedAt !== undefined) dto.updatedAt = domain.updatedAt;

    return dto;
  }
}
