import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  Index,
  Unique,
} from 'typeorm';

import { SeenListingEntity } from '@list-am-bot/domain/seen-listing/seen-listing.entity';

import { SubscriptionEntityDto } from './subscription.entity.dto';

@Entity('seen_listing')
@Unique(['subscriptionId', 'listingId'])
@Index(['subscriptionId'])
export class SeenListingEntityDto implements SeenListingEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  subscriptionId: number;

  @Column({ type: 'varchar', length: 500 })
  listingId: string;

  @CreateDateColumn()
  firstSeenAt: Date;

  @ManyToOne(
    (): typeof SubscriptionEntityDto => SubscriptionEntityDto,
    (subscription): SeenListingEntityDto[] | undefined =>
      subscription.seenListings,
  )
  subscription?: SubscriptionEntityDto;
}
