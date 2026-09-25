import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import {
  DataSource,
  EntityManager,
  QueryFailedError,
  Repository,
} from 'typeorm';
import { BalanceLogEntity } from '../common/database/entities/balance-log.entity';
import { UserEntity } from '../common/database/entities/user.entity';
import { BalanceLogAction } from '../common/database/enums/balance-log-action.enum';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: any;
  let balanceLogRepository: any;
  let userManagerRepository: any;
  let balanceLogManagerRepository: any;
  let manager: any;
  let dataSource: any;

  const toBigInt = (value: number): bigint => BigInt(value);
  const makeUser = (balance: bigint, id = 1): UserEntity =>
    ({ id, balance } as UserEntity);

  beforeEach(() => {
    userRepository = { findOne: jest.fn() };
    balanceLogRepository = {
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn((value: unknown) => value),
      save: jest.fn(),
    };
    userManagerRepository = {
      createQueryBuilder: jest.fn(),
      findOne: userRepository.findOne,
      update: jest.fn().mockResolvedValue(undefined),
    };
    balanceLogManagerRepository = {
      ...balanceLogRepository,
      createQueryBuilder: jest.fn(),
    };
    manager = {
      getRepository: jest.fn((entity) =>
        entity === UserEntity
          ? userManagerRepository
          : balanceLogManagerRepository,
      ),
    };
    dataSource = {
      transaction: jest.fn((callback: (value: EntityManager) => unknown) =>
        Promise.resolve(callback(manager as EntityManager)),
      ),
    };
    service = new UsersService(
      userRepository as Repository<UserEntity>,
      balanceLogRepository as Repository<BalanceLogEntity>,
      dataSource as DataSource,
    );
  });

  function configureUserQuery(result: UserEntity | null) {
    const queryBuilder = {
      setLock: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(result),
    };
    userManagerRepository.createQueryBuilder.mockReturnValue(queryBuilder);
    return queryBuilder;
  }

  function configureBalanceSum(sum: string) {
    balanceLogManagerRepository.createQueryBuilder.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue({ sum }),
    });
  }

  it('debits the user and stores the recalculated balance', async () => {
    configureUserQuery(makeUser(toBigInt(1000)));
    configureBalanceSum('750');

    await expect(
      service.debit(1, toBigInt(250), BalanceLogAction.DEBIT, 'debit-1'),
    ).resolves.toEqual({ balance: toBigInt(750) });

    expect(balanceLogManagerRepository.create).toHaveBeenCalledWith({
      userId: 1,
      action: BalanceLogAction.DEBIT,
      amount: -toBigInt(250),
      idempotencyKey: 'debit-1',
    });
    expect(balanceLogManagerRepository.save).toHaveBeenCalled();
    expect(userManagerRepository.update).toHaveBeenCalledWith(1, {
      balance: toBigInt(750),
    });
  });

  it('allows debiting the exact available balance', async () => {
    configureUserQuery(makeUser(toBigInt(250)));
    configureBalanceSum('0');

    await expect(
      service.debit(1, toBigInt(250), BalanceLogAction.DEBIT, 'debit-zero'),
    ).resolves.toEqual({ balance: toBigInt(0) });
  });

  it('requests a pessimistic write lock before debiting', async () => {
    const queryBuilder = configureUserQuery(makeUser(toBigInt(1000)));
    configureBalanceSum('750');

    await service.debit(1, toBigInt(250), BalanceLogAction.DEBIT, 'debit-lock');

    expect(queryBuilder.setLock).toHaveBeenCalledWith('pessimistic_write');
  });

  it('rejects a debit when the balance is insufficient', async () => {
    configureUserQuery(makeUser(toBigInt(100)));

    await expect(
      service.debit(1, toBigInt(250), BalanceLogAction.DEBIT, 'debit-2'),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(balanceLogManagerRepository.save).not.toHaveBeenCalled();
  });

  it('returns the current balance for an idempotent retry', async () => {
    balanceLogManagerRepository.findOne.mockResolvedValue({
      userId: 1,
      amount: -toBigInt(250),
    });
    userManagerRepository.findOne.mockResolvedValue(makeUser(toBigInt(750)));

    await expect(
      service.debit(1, toBigInt(250), BalanceLogAction.DEBIT, 'debit-3'),
    ).resolves.toEqual({ balance: toBigInt(750) });
    expect(balanceLogManagerRepository.save).not.toHaveBeenCalled();
  });

  it('rejects reuse of an idempotency key with different parameters', async () => {
    balanceLogManagerRepository.findOne.mockResolvedValue({
      userId: 1,
      amount: -toBigInt(250),
    });

    await expect(
      service.debit(1, toBigInt(300), BalanceLogAction.DEBIT, 'debit-4'),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('retries after a concurrent idempotency conflict', async () => {
    const uniqueViolation = new QueryFailedError('insert', [], {
      code: '23505',
      constraint: 'UQ_idempotencyKey',
    } as unknown as Error);
    dataSource.transaction
      .mockRejectedValueOnce(uniqueViolation)
      .mockImplementationOnce((callback: (value: EntityManager) => unknown) =>
        Promise.resolve(callback(manager as EntityManager)),
      );
    balanceLogManagerRepository.findOne.mockResolvedValue({
      userId: 1,
      amount: -toBigInt(250),
    });
    userManagerRepository.findOne.mockResolvedValue(makeUser(toBigInt(750)));

    await expect(
      service.debit(1, toBigInt(250), BalanceLogAction.DEBIT, 'debit-5'),
    ).resolves.toEqual({ balance: toBigInt(750) });
    expect(dataSource.transaction).toHaveBeenCalledTimes(2);
  });

  it('stops after the maximum number of idempotency retries', async () => {
    const uniqueViolation = new QueryFailedError('insert', [], {
      code: '23505',
      constraint: 'UQ_idempotencyKey',
    } as unknown as Error);
    dataSource.transaction.mockRejectedValue(uniqueViolation);

    await expect(
      service.debit(1, toBigInt(250), BalanceLogAction.DEBIT, 'debit-retries'),
    ).rejects.toBe(uniqueViolation);
    expect(dataSource.transaction).toHaveBeenCalledTimes(3);
  });

  it('does not retry a non-idempotency error', async () => {
    const databaseError = new Error('database unavailable');
    dataSource.transaction.mockRejectedValue(databaseError);

    await expect(
      service.debit(1, toBigInt(250), BalanceLogAction.DEBIT, 'debit-error'),
    ).rejects.toBe(databaseError);
    expect(dataSource.transaction).toHaveBeenCalledTimes(1);
  });

  it('returns an existing user from getUser', async () => {
    const existingUser = makeUser(toBigInt(750));
    userRepository.findOne.mockResolvedValue(existingUser);

    await expect(service.getUser(1)).resolves.toBe(existingUser);
    expect(userRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
  });

  it('throws when the user does not exist', async () => {
    configureUserQuery(null);

    await expect(
      service.debit(1, toBigInt(250), BalanceLogAction.DEBIT, 'debit-6'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws BadRequestException when getUser cannot find a user', async () => {
    userRepository.findOne.mockResolvedValue(null);

    await expect(service.getUser(1)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
