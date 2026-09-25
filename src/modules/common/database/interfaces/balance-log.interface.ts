import { BalanceLogAction } from '../enums/balance-log-action.enum';
import { BaseModel } from './base-model.interface';

export interface BalanceLogInterface<D = Date> extends BaseModel<D> {
  userId: number;
  action: BalanceLogAction;
  amount: bigint;
  timestamp: D;
}
