import { SubscriptionEntity } from '@list-am-bot/domain/subscription/subscription.entity';

export const SubscriptionRepositoryPort = Symbol('SubscriptionRepositoryPort');

export interface ISubscriptionRepository {
  create(userId: number, query: string): Promise<SubscriptionEntity>;

  findById(id: number): Promise<SubscriptionEntity | null>;

  findByUserId(
    userId: number,
    includeInactive?: boolean,
  ): Promise<SubscriptionEntity[]>;

  findActiveByUserId(userId: number): Promise<SubscriptionEntity[]>;

  exists(userId: number, query: string): Promise<boolean>;

  deactivate(id: number): Promise<void>;

  delete(id: number): Promise<void>;

  deleteWithSeenListings(subscriptionId: number): Promise<void>;

  deleteAllByUserId(userId: number): Promise<void>;

  deleteAllWithSeenListings(userId: number): Promise<void>;

  count(userId: number): Promise<number>;
}
