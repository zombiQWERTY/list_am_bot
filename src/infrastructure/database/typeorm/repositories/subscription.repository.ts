import { Injectable, Inject } from '@nestjs/common';
import { Repository } from 'typeorm';

import { ISubscriptionRepository } from '@list-am-bot/domain/subscription/ports/subscription.repository.port';
import { SubscriptionEntity } from '@list-am-bot/domain/subscription/subscription.entity';
import { SubscriptionEntityDto } from '@list-am-bot/infrastructure/database/typeorm/entity-dtos/subscription.entity.dto';
import { SubscriptionMapper } from '@list-am-bot/infrastructure/database/typeorm/mappers/subscription.mapper';
import { SubscriptionProviderToken } from '@list-am-bot/infrastructure/database/typeorm/providers/subscription.provider';

@Injectable()
export class SubscriptionRepository implements ISubscriptionRepository {
  constructor(
    @Inject(SubscriptionProviderToken)
    private readonly repo: Repository<SubscriptionEntityDto>,
  ) {}

  async create(userId: number, query: string): Promise<SubscriptionEntity> {
    const subscription = this.repo.create({
      userId,
      query,
      isActive: true,
    });

    const saved = await this.repo.save(subscription);
    return SubscriptionMapper.toDomain(saved);
  }

  async findById(id: number): Promise<SubscriptionEntity | null> {
    const subscription = await this.repo.findOne({ where: { id } });
    return subscription ? SubscriptionMapper.toDomain(subscription) : null;
  }

  async findByUserId(
    userId: number,
    includeInactive = false,
  ): Promise<SubscriptionEntity[]> {
    const where = includeInactive ? { userId } : { userId, isActive: true };
    const subscriptions = await this.repo.find({
      where,
      order: { createdAt: 'DESC' },
    });
    return subscriptions.map(
      (subscription: SubscriptionEntityDto): SubscriptionEntity =>
        SubscriptionMapper.toDomain(subscription),
    );
  }

  async findActiveByUserId(userId: number): Promise<SubscriptionEntity[]> {
    const subscriptions = await this.repo.find({
      where: { userId, isActive: true },
      order: { createdAt: 'DESC' },
    });
    return subscriptions.map(
      (subscription: SubscriptionEntityDto): SubscriptionEntity =>
        SubscriptionMapper.toDomain(subscription),
    );
  }

  async exists(userId: number, query: string): Promise<boolean> {
    return this.repo.existsBy({ userId, query, isActive: true });
  }

  async deactivate(id: number): Promise<void> {
    await this.repo.update(id, { isActive: false });
  }

  async delete(id: number): Promise<void> {
    await this.repo.delete(id);
  }

  async deleteAllByUserId(userId: number): Promise<void> {
    await this.repo.delete({ userId });
  }

  async count(userId: number): Promise<number> {
    return this.repo.count({ where: { userId, isActive: true } });
  }
}
