import { Injectable, Inject } from '@nestjs/common';

import {
  DuplicateSubscriptionException,
  InvalidQueryException,
} from '@list-am-bot/common/exceptions/bot.exceptions';
import {
  SubscriptionRepositoryPort,
  ISubscriptionRepository,
} from '@list-am-bot/domain/subscription/ports/subscription.repository.port';
import { SubscriptionEntity } from '@list-am-bot/domain/subscription/subscription.entity';

@Injectable()
export class SubscriptionService {
  private static readonly MAX_QUERY_LENGTH = 500;
  private static readonly MIN_QUERY_LENGTH = 1;

  constructor(
    @Inject(SubscriptionRepositoryPort)
    private readonly subscriptionRepository: ISubscriptionRepository,
  ) {}

  async create(userId: number, query: string): Promise<SubscriptionEntity> {
    const trimmedQuery = query.trim();

    this.validateQuery(trimmedQuery);

    const exists = await this.subscriptionRepository.exists(
      userId,
      trimmedQuery,
    );
    if (exists) {
      throw new DuplicateSubscriptionException(trimmedQuery);
    }

    return this.subscriptionRepository.create(userId, trimmedQuery);
  }

  async findByUserId(userId: number): Promise<SubscriptionEntity[]> {
    return this.subscriptionRepository.findByUserId(userId);
  }

  async findActiveByUserId(userId: number): Promise<SubscriptionEntity[]> {
    return this.subscriptionRepository.findActiveByUserId(userId);
  }

  async delete(subscriptionId: number): Promise<void> {
    await this.subscriptionRepository.deleteWithSeenListings(subscriptionId);
  }

  async deleteAll(userId: number): Promise<void> {
    await this.subscriptionRepository.deleteAllWithSeenListings(userId);
  }

  async count(userId: number): Promise<number> {
    return this.subscriptionRepository.count(userId);
  }

  private validateQuery(query: string): void {
    if (query.length < SubscriptionService.MIN_QUERY_LENGTH) {
      throw new InvalidQueryException('Query is too short');
    }

    if (query.length > SubscriptionService.MAX_QUERY_LENGTH) {
      throw new InvalidQueryException(
        `Query is too long (max ${SubscriptionService.MAX_QUERY_LENGTH} characters)`,
      );
    }
  }
}
