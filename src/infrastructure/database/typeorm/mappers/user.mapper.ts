import { assignDefinedProps } from '@list-am-bot/common/utils/object.util';
import { UserEntity } from '@list-am-bot/domain/user/user.entity';
import { UserEntityDto } from '@list-am-bot/infrastructure/database/typeorm/entity-dtos/user.entity.dto';

export class UserMapper {
  static toDomain = (dto: UserEntityDto): UserEntity => {
    return new UserEntity({
      id: dto.id,
      telegramUserId: dto.telegramUserId,
      username: dto.username,
      language: dto.language,
      isPaused: dto.isPaused,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    });
  };

  static fromDomain(domain: UserEntity): UserEntityDto;
  static fromDomain(domain: Partial<UserEntity>): Partial<UserEntityDto>;
  static fromDomain(domain: UserEntity | Partial<UserEntity>): UserEntityDto {
    const dto = new UserEntityDto();

    assignDefinedProps(dto, domain, [
      'id',
      'telegramUserId',
      'username',
      'language',
      'isPaused',
      'createdAt',
      'updatedAt',
    ]);

    return dto;
  }
}
