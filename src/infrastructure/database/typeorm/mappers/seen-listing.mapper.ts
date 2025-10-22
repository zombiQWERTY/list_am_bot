import { assignDefinedProps } from '@list-am-bot/common/utils/object.util';
import { SeenListingEntity } from '@list-am-bot/domain/seen-listing/seen-listing.entity';
import { SeenListingEntityDto } from '@list-am-bot/infrastructure/database/typeorm/entity-dtos/seen-listing.entity.dto';

export class SeenListingMapper {
  static toDomain = (dto: SeenListingEntityDto): SeenListingEntity => {
    return new SeenListingEntity({
      id: dto.id,
      subscriptionId: dto.subscriptionId,
      listingId: dto.listingId,
      firstSeenAt: dto.firstSeenAt,
    });
  };

  static fromDomain(domain: SeenListingEntity): SeenListingEntityDto;
  static fromDomain(
    domain: Partial<SeenListingEntity>,
  ): Partial<SeenListingEntityDto>;
  static fromDomain(
    domain: SeenListingEntity | Partial<SeenListingEntity>,
  ): SeenListingEntityDto {
    const dto = new SeenListingEntityDto();

    assignDefinedProps(dto, domain, [
      'id',
      'subscriptionId',
      'listingId',
      'firstSeenAt',
    ]);

    return dto;
  }
}
