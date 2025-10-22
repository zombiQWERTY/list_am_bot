export class SeenListingEntity {
  id: number;
  subscriptionId: number;
  listingId: string;
  firstSeenAt: Date;

  constructor(data: SeenListingEntity) {
    Object.assign(this, data);
  }
}
