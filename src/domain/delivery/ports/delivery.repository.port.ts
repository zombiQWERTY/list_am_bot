import { DeliveryEntity } from '@list-am-bot/domain/delivery/delivery.entity';

export const DeliveryRepositoryPort = Symbol('DeliveryRepositoryPort');

export interface IDeliveryRepository {
  create(
    userId: number,
    subscriptionId: number,
    listingId: string,
    messageId?: string,
  ): Promise<DeliveryEntity>;

  findByUserId(userId: number): Promise<DeliveryEntity[]>;

  exists(userId: number, listingId: string): Promise<boolean>;
}
