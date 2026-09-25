import { BaseModel } from './base-model.interface';

export interface UserInterface<D = Date> extends BaseModel<D> {
  balance: bigint;
}
