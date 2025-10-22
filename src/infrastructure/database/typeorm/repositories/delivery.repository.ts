import { Injectable, Inject } from '@nestjs/common';
import { Repository } from 'typeorm';

import { DeliveryEntity } from '@list-am-bot/domain/delivery/delivery.entity';
import { IDeliveryRepository } from '@list-am-bot/domain/delivery/ports/delivery.repository.port';
import { DeliveryEntityDto } from '@list-am-bot/infrastructure/database/typeorm/entity-dtos/delivery.entity.dto';
import { DeliveryMapper } from '@list-am-bot/infrastructure/database/typeorm/mappers/delivery.mapper';
import { DeliveryProviderToken } from '@list-am-bot/infrastructure/database/typeorm/providers/delivery.provider';

@Injectable()
export class DeliveryRepository implements IDeliveryRepository {
  constructor(
    @Inject(DeliveryProviderToken)
    private readonly repo: Repository<DeliveryEntityDto>,
  ) {}

  async create(
    userId: number,
    subscriptionId: number,
    listingId: string,
    messageId?: string,
  ): Promise<DeliveryEntity> {
    const delivery = this.repo.create({
      userId,
      subscriptionId,
      listingId,
      messageId: messageId || null,
    });

    const saved = await this.repo.save(delivery);
    return DeliveryMapper.toDomain(saved);
  }

  async findByUserId(userId: number): Promise<DeliveryEntity[]> {
    const deliveries = await this.repo.find({
      where: { userId },
      order: { deliveredAt: 'DESC' },
    });
    return deliveries.map(
      (delivery: DeliveryEntityDto): DeliveryEntity =>
        DeliveryMapper.toDomain(delivery),
    );
  }

  async exists(userId: number, listingId: string): Promise<boolean> {
    return this.repo.existsBy({ userId, listingId });
  }
}
