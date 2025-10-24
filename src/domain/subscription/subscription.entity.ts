export enum SubscriptionType {
  QUERY = 'query',
  URL = 'url',
}

export class SubscriptionEntity {
  id: number;
  userId: number;
  query: string;
  name?: string;
  type: SubscriptionType;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;

  constructor(data: SubscriptionEntity) {
    Object.assign(this, data);
  }
}
