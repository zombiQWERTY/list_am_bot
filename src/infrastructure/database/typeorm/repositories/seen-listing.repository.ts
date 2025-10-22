import { Injectable, Inject } from '@nestjs/common';
import { Repository, In } from 'typeorm';

import { ISeenListingRepository } from '@list-am-bot/domain/seen-listing/ports/seen-listing.repository.port';
import { SeenListingEntity } from '@list-am-bot/domain/seen-listing/seen-listing.entity';
import { SeenListingEntityDto } from '@list-am-bot/infrastructure/database/typeorm/entity-dtos/seen-listing.entity.dto';
import { SeenListingMapper } from '@list-am-bot/infrastructure/database/typeorm/mappers/seen-listing.mapper';
import { SeenListingProviderToken } from '@list-am-bot/infrastructure/database/typeorm/providers/seen-listing.provider';

@Injectable()
export class SeenListingRepository implements ISeenListingRepository {
  constructor(
    @Inject(SeenListingProviderToken)
    private readonly repo: Repository<SeenListingEntityDto>,
  ) {}

  async markAsSeen(
    subscriptionId: number,
    listingIds: string[],
  ): Promise<void> {
    const entities = listingIds.map(
      (listingId: string): SeenListingEntityDto =>
        this.repo.create({ subscriptionId, listingId }),
    );

    await this.repo
      .createQueryBuilder()
      .insert()
      .into(SeenListingEntityDto)
      .values(entities)
      .orIgnore()
      .execute();
  }

  async findBySubscriptionId(
    subscriptionId: number,
  ): Promise<SeenListingEntity[]> {
    const seenListings = await this.repo.find({ where: { subscriptionId } });
    return seenListings.map(
      (seenListing: SeenListingEntityDto): SeenListingEntity =>
        SeenListingMapper.toDomain(seenListing),
    );
  }

  async existsForSubscription(
    subscriptionId: number,
    listingId: string,
  ): Promise<boolean> {
    return this.repo.existsBy({ subscriptionId, listingId });
  }

  async filterNewListings(
    subscriptionId: number,
    listingIds: string[],
  ): Promise<string[]> {
    if (listingIds.length === 0) return [];

    const seenListings = await this.repo.find({
      where: {
        subscriptionId,
        listingId: In(listingIds),
      },
    });

    const seenIds = new Set(
      seenListings.map((sl: SeenListingEntityDto): string => sl.listingId),
    );
    return listingIds.filter((id: string): boolean => !seenIds.has(id));
  }

  async deleteBySubscriptionId(subscriptionId: number): Promise<void> {
    await this.repo.delete({ subscriptionId });
  }
}
