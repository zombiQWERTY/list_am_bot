export class DeliveryEntity {
  id: number;
  userId: number;
  subscriptionId: number;
  listingId: string;
  deliveredAt: Date;
  messageId: string | null;

  constructor(data: DeliveryEntity) {
    Object.assign(this, data);
  }
}
