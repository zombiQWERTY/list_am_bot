import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  Index,
} from 'typeorm';

import {
  SubscriptionEntity,
  SubscriptionType,
} from '@list-am-bot/domain/subscription/subscription.entity';
import { SeenListingEntityDto } from '@list-am-bot/infrastructure/database/typeorm/entity-dtos/seen-listing.entity.dto';
import { UserEntityDto } from '@list-am-bot/infrastructure/database/typeorm/entity-dtos/user.entity.dto';

@Entity('subscription')
@Index(['userId'])
@Index(['isActive'])
export class SubscriptionEntityDto implements SubscriptionEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  userId: number;

  @Column({ type: 'varchar', length: 500 })
  query: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  name?: string;

  @Column({
    type: 'varchar',
    length: 10,
    default: SubscriptionType.QUERY,
  })
  type: SubscriptionType;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(
    (): typeof UserEntityDto => UserEntityDto,
    (user): SubscriptionEntityDto[] | undefined => user.subscriptions,
    { onDelete: 'CASCADE' },
  )
  user?: UserEntityDto;

  @OneToMany(
    (): typeof SeenListingEntityDto => SeenListingEntityDto,
    (seenListing): SubscriptionEntityDto | undefined =>
      seenListing.subscription,
    {
      cascade: true,
    },
  )
  seenListings?: SeenListingEntityDto[];
}
