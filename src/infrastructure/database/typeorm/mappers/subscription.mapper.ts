import { SubscriptionEntity } from '@list-am-bot/domain/subscription/subscription.entity';

import { SubscriptionEntityDto } from '../entity-dtos/subscription.entity.dto';

export class SubscriptionMapper {
  static toDomain(dto: SubscriptionEntityDto): SubscriptionEntity {
    return new SubscriptionEntity({
      id: dto.id,
      userId: dto.userId,
      query: dto.query,
      isActive: dto.isActive,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    });
  }

  static fromDomain(domain: SubscriptionEntity): SubscriptionEntityDto;
  static fromDomain(
    domain: Partial<SubscriptionEntity>,
  ): Partial<SubscriptionEntityDto>;
  static fromDomain(
    domain: SubscriptionEntity | Partial<SubscriptionEntity>,
  ): SubscriptionEntityDto {
    const dto = new SubscriptionEntityDto();

    if (domain.id !== undefined) dto.id = domain.id;
    if (domain.userId !== undefined) dto.userId = domain.userId;
    if (domain.query !== undefined) dto.query = domain.query;
    if (domain.isActive !== undefined) dto.isActive = domain.isActive;
    if (domain.createdAt !== undefined) dto.createdAt = domain.createdAt;
    if (domain.updatedAt !== undefined) dto.updatedAt = domain.updatedAt;

    return dto;
  }
}
