import { assignDefinedProps } from '@list-am-bot/common/utils/object.util';
import { SubscriptionEntity } from '@list-am-bot/domain/subscription/subscription.entity';
import { SubscriptionEntityDto } from '@list-am-bot/infrastructure/database/typeorm/entity-dtos/subscription.entity.dto';

export class SubscriptionMapper {
  static toDomain = (dto: SubscriptionEntityDto): SubscriptionEntity => {
    return new SubscriptionEntity({
      id: dto.id,
      userId: dto.userId,
      query: dto.query,
      isActive: dto.isActive,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    });
  };

  static fromDomain(domain: SubscriptionEntity): SubscriptionEntityDto;
  static fromDomain(
    domain: Partial<SubscriptionEntity>,
  ): Partial<SubscriptionEntityDto>;
  static fromDomain(
    domain: SubscriptionEntity | Partial<SubscriptionEntity>,
  ): SubscriptionEntityDto {
    const dto = new SubscriptionEntityDto();

    assignDefinedProps(dto, domain, [
      'id',
      'userId',
      'query',
      'isActive',
      'createdAt',
      'updatedAt',
    ]);

    return dto;
  }
}
