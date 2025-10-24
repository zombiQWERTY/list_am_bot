import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  Index,
} from 'typeorm';

import { DeliveryEntity } from '@list-am-bot/domain/delivery/delivery.entity';
import { UserEntityDto } from '@list-am-bot/infrastructure/database/typeorm/entity-dtos/user.entity.dto';

@Entity('delivery')
@Index(['userId'])
@Index(['subscriptionId'])
export class DeliveryEntityDto implements DeliveryEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  userId: number;

  @Column({ type: 'int' })
  subscriptionId: number;

  @Column({ type: 'varchar', length: 500 })
  listingId: string;

  @CreateDateColumn()
  deliveredAt: Date;

  @Column({ type: 'varchar', length: 100, nullable: true })
  messageId: string | null;

  @ManyToOne(
    (): typeof UserEntityDto => UserEntityDto,
    (user): DeliveryEntityDto[] | undefined => user.deliveries,
    { onDelete: 'CASCADE' },
  )
  user?: UserEntityDto;
}
