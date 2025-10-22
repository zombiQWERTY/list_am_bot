import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';

import { UserEntity, UserLanguage } from '@list-am-bot/domain/user/user.entity';
import { DeliveryEntityDto } from '@list-am-bot/infrastructure/database/typeorm/entity-dtos/delivery.entity.dto';
import { SubscriptionEntityDto } from '@list-am-bot/infrastructure/database/typeorm/entity-dtos/subscription.entity.dto';

@Entity('user')
export class UserEntityDto implements UserEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, type: 'bigint' })
  telegramUserId: number;

  @Column({ type: 'varchar', nullable: true })
  username: string | null;

  @Column({ type: 'varchar', default: UserLanguage.RU })
  language: UserLanguage;

  @Column({ type: 'boolean', default: false })
  isPaused: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(
    (): typeof SubscriptionEntityDto => SubscriptionEntityDto,
    (subscription): UserEntityDto | undefined => subscription.user,
  )
  subscriptions?: SubscriptionEntityDto[];

  @OneToMany(
    (): typeof DeliveryEntityDto => DeliveryEntityDto,
    (delivery): UserEntityDto | undefined => delivery.user,
  )
  deliveries?: DeliveryEntityDto[];
}
