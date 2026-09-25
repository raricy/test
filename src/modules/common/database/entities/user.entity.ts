import { Column, Entity, OneToMany } from 'typeorm';
import { BaseModelEntity } from './base-model.entity';
import { UserInterface } from '../interfaces/user.interface';
import { BalanceLogEntity } from './balance-log.entity';

const TABLE_NAME_USERS = 'users';

@Entity(TABLE_NAME_USERS)
export class UserEntity
  extends BaseModelEntity
  implements Required<UserInterface>
{
  @Column({
    type: 'bigint',
    transformer: {
      to: (value: bigint) => value.toString(),
      from: (value: string) => BigInt(value),
    },
  })
  balance: bigint;

  @OneToMany(() => BalanceLogEntity, (balanceLog) => balanceLog.user)
  balanceLogs: BalanceLogEntity[];
}
