export class SubscriptionEntity {
  id: number;
  userId: number;
  query: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;

  constructor(data: SubscriptionEntity) {
    Object.assign(this, data);
  }
}
