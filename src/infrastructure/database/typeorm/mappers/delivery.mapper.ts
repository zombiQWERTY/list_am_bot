import { DeliveryEntity } from '@list-am-bot/domain/delivery/delivery.entity';

import { DeliveryEntityDto } from '../entity-dtos/delivery.entity.dto';

export class DeliveryMapper {
  static toDomain(dto: DeliveryEntityDto): DeliveryEntity {
    return new DeliveryEntity({
      id: dto.id,
      userId: dto.userId,
      subscriptionId: dto.subscriptionId,
      listingId: dto.listingId,
      deliveredAt: dto.deliveredAt,
      messageId: dto.messageId,
    });
  }

  static fromDomain(domain: DeliveryEntity): DeliveryEntityDto;
  static fromDomain(
    domain: Partial<DeliveryEntity>,
  ): Partial<DeliveryEntityDto>;
  static fromDomain(
    domain: DeliveryEntity | Partial<DeliveryEntity>,
  ): DeliveryEntityDto {
    const dto = new DeliveryEntityDto();

    if (domain.id !== undefined) dto.id = domain.id;
    if (domain.userId !== undefined) dto.userId = domain.userId;
    if (domain.subscriptionId !== undefined)
      dto.subscriptionId = domain.subscriptionId;
    if (domain.listingId !== undefined) dto.listingId = domain.listingId;
    if (domain.deliveredAt !== undefined) dto.deliveredAt = domain.deliveredAt;
    if (domain.messageId !== undefined) dto.messageId = domain.messageId;

    return dto;
  }
}
