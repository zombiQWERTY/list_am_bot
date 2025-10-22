import { SeenListingEntity } from '@list-am-bot/domain/seen-listing/seen-listing.entity';

export const SeenListingRepositoryPort = Symbol('SeenListingRepositoryPort');

export interface ISeenListingRepository {
  markAsSeen(subscriptionId: number, listingIds: string[]): Promise<void>;

  findBySubscriptionId(subscriptionId: number): Promise<SeenListingEntity[]>;

  existsForSubscription(
    subscriptionId: number,
    listingId: string,
  ): Promise<boolean>;

  filterNewListings(
    subscriptionId: number,
    listingIds: string[],
  ): Promise<string[]>;

  deleteBySubscriptionId(subscriptionId: number): Promise<void>;
}
