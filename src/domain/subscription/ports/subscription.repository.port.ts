import {
  SubscriptionEntity,
  SubscriptionType,
} from '@list-am-bot/domain/subscription/subscription.entity';

export const SubscriptionRepositoryPort = Symbol('SubscriptionRepositoryPort');

export interface CreateSubscriptionDto {
  userId: number;
  query: string;
  name?: string;
  type?: SubscriptionType;
}

export interface ISubscriptionRepository {
  create(data: CreateSubscriptionDto): Promise<SubscriptionEntity>;

  findById(id: number): Promise<SubscriptionEntity | null>;

  findByUserId(
    userId: number,
    includeInactive?: boolean,
  ): Promise<SubscriptionEntity[]>;

  findActiveByUserId(userId: number): Promise<SubscriptionEntity[]>;

  exists(
    userId: number,
    query: string,
    type?: SubscriptionType,
  ): Promise<boolean>;

  deactivate(id: number): Promise<void>;

  delete(id: number): Promise<void>;

  deleteAllByUserId(userId: number): Promise<void>;

  count(userId: number): Promise<number>;
}
