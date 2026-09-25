import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { BalanceLogEntity } from '../common/database/entities/balance-log.entity';
import { UserEntity } from '../common/database/entities/user.entity';
import { BalanceLogAction } from '../common/database/enums/balance-log-action.enum';
import { isUniqueViolation } from '../../utils/db/db-errors.util';

const MAX_IDEMPOTENCY_RETRY_ATTEMPTS = 3;

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(BalanceLogEntity)
    private readonly balanceLogRepository: Repository<BalanceLogEntity>,

    private readonly dataSource: DataSource,
  ) {}

  async getUser(userId: number): Promise<UserEntity> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException('User not found');
    }
    return user;
  }

  async debit(
    userId: number,
    amount: bigint,
    action: BalanceLogAction,
    idempotencyKey: string,
  ): Promise<{ balance: bigint }> {
    for (let attempt = 0; attempt < MAX_IDEMPOTENCY_RETRY_ATTEMPTS; attempt++) {
      try {
        return await this.attemptDebit(userId, amount, action, idempotencyKey);
      } catch (err) {
        if (
          isUniqueViolation(err, 'idempotencyKey') &&
          attempt < MAX_IDEMPOTENCY_RETRY_ATTEMPTS - 1
        ) {
          continue;
        }
        throw err;
      }
    }
    throw new ConflictException('Could not resolve idempotency conflict');
  }

  private async attemptDebit(
    userId: number,
    amount: bigint,
    action: BalanceLogAction,
    idempotencyKey: string,
  ): Promise<{ balance: bigint }> {
    return this.dataSource.transaction(async (manager) => {
      const balanceLogRepo = manager.getRepository(BalanceLogEntity);
      const userRepo = manager.getRepository(UserEntity);

      const existing = await balanceLogRepo.findOne({
        where: { idempotencyKey },
      });
      if (existing) {
        if (existing.userId !== userId || existing.amount !== -amount) {
          throw new ConflictException(
            `idempotencyKey ${idempotencyKey} already used with different parameters`,
          );
        }
        const user = await userRepo.findOne({ where: { id: userId } });
        return { balance: user.balance };
      }

      const user = await userRepo
        .createQueryBuilder('u')
        .setLock('pessimistic_write')
        .where('u.id = :userId', { userId })
        .getOne();

      if (!user) {
        throw new NotFoundException('User not found');
      }
      if (user.balance < amount) {
        throw new BadRequestException('Insufficient funds');
      }

      await balanceLogRepo.save(
        balanceLogRepo.create({
          userId,
          action,
          amount: -amount,
          idempotencyKey,
        }),
      );

      const newBalance = await this.recomputeBalance(manager, userId);
      await userRepo.update(userId, { balance: newBalance });

      return { balance: newBalance };
    });
  }

  private async recomputeBalance(
    manager: EntityManager,
    userId: number,
  ): Promise<bigint> {
    const { sum } = await manager
      .getRepository(BalanceLogEntity)
      .createQueryBuilder('bl')
      .select('COALESCE(SUM(bl.amount), 0)', 'sum')
      .where('bl.userId = :userId', { userId })
      .getRawOne<{ sum: string }>();

    return BigInt(sum);
  }
}
