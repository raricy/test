import { faker } from '@faker-js/faker';
import { Repository } from 'typeorm';
import { BalanceLogEntity } from '../entities/balance-log.entity';
import { BalanceLogAction } from '../enums/balance-log-action.enum';

export class BalanceLogFactory {
  constructor(private readonly repository: Repository<BalanceLogEntity>) {}

  async create(userId: number, overrides: Partial<BalanceLogEntity> = {}) {
    const balanceLog = this.repository.create({
      userId,
      action: faker.helpers.enumValue(BalanceLogAction),
      amount: BigInt(faker.number.int({ min: 0, max: 10000 })),
      idempotencyKey: `factory-${Date.now()}-${faker.string.uuid()}`,
      ...overrides,
    });

    return this.repository.save(balanceLog);
  }

  async createForUsers(
    userIds: number[],
    overrides: Partial<BalanceLogEntity> = {},
  ) {
    const balanceLogs: BalanceLogEntity[] = [];
    for (const userId of userIds) {
      balanceLogs.push(await this.create(userId, overrides));
    }
    return balanceLogs;
  }
}
