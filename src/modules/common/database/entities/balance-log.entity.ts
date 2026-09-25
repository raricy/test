import { Column, Entity, ManyToOne } from 'typeorm';
import { BaseModelEntity } from './base-model.entity';
import { BalanceLogInterface } from '../interfaces/balance-log.interface';
import { BalanceLogAction } from '../enums/balance-log-action.enum';
import { UserEntity } from './user.entity';

const TABLE_NAME_BALANCE_LOGS = 'balance_logs';

@Entity(TABLE_NAME_BALANCE_LOGS)
export class BalanceLogEntity
  extends BaseModelEntity
  implements Required<BalanceLogInterface>
{
  @Column()
  userId: number;

  @Column()
  action: BalanceLogAction;

  @Column({
    type: 'bigint',
    transformer: {
      to: (value: bigint) => value.toString(),
      from: (value: string) => BigInt(value),
    },
  })
  amount: bigint;

  @Column({ unique: true })
  idempotencyKey: string;

  @Column({ default: () => 'now()', type: 'timestamptz' })
  timestamp: Date;

  @ManyToOne(() => UserEntity, (user) => user.balanceLogs)
  user: UserEntity;
}
