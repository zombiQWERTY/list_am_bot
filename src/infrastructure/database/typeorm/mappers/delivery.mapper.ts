import { assignDefinedProps } from '@list-am-bot/common/utils/object.util';
import { DeliveryEntity } from '@list-am-bot/domain/delivery/delivery.entity';
import { DeliveryEntityDto } from '@list-am-bot/infrastructure/database/typeorm/entity-dtos/delivery.entity.dto';

export class DeliveryMapper {
  static toDomain = (dto: DeliveryEntityDto): DeliveryEntity => {
    return new DeliveryEntity({
      id: dto.id,
      userId: dto.userId,
      subscriptionId: dto.subscriptionId,
      listingId: dto.listingId,
      deliveredAt: dto.deliveredAt,
      messageId: dto.messageId,
    });
  };

  static fromDomain(domain: DeliveryEntity): DeliveryEntityDto;
  static fromDomain(
    domain: Partial<DeliveryEntity>,
  ): Partial<DeliveryEntityDto>;
  static fromDomain(
    domain: DeliveryEntity | Partial<DeliveryEntity>,
  ): DeliveryEntityDto {
    const dto = new DeliveryEntityDto();

    assignDefinedProps(dto, domain, [
      'id',
      'userId',
      'subscriptionId',
      'listingId',
      'deliveredAt',
      'messageId',
    ]);

    return dto;
  }
}
