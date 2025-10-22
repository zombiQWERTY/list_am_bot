import { SeenListingEntity } from '@list-am-bot/domain/seen-listing/seen-listing.entity';

import { SeenListingEntityDto } from '../entity-dtos/seen-listing.entity.dto';

export class SeenListingMapper {
  static toDomain(dto: SeenListingEntityDto): SeenListingEntity {
    return new SeenListingEntity({
      id: dto.id,
      subscriptionId: dto.subscriptionId,
      listingId: dto.listingId,
      firstSeenAt: dto.firstSeenAt,
    });
  }

  static fromDomain(domain: SeenListingEntity): SeenListingEntityDto;
  static fromDomain(
    domain: Partial<SeenListingEntity>,
  ): Partial<SeenListingEntityDto>;
  static fromDomain(
    domain: SeenListingEntity | Partial<SeenListingEntity>,
  ): SeenListingEntityDto {
    const dto = new SeenListingEntityDto();

    if (domain.id !== undefined) dto.id = domain.id;
    if (domain.subscriptionId !== undefined)
      dto.subscriptionId = domain.subscriptionId;
    if (domain.listingId !== undefined) dto.listingId = domain.listingId;
    if (domain.firstSeenAt !== undefined) dto.firstSeenAt = domain.firstSeenAt;

    return dto;
  }
}
