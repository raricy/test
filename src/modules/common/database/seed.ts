import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import { UserEntity } from './entities/user.entity';
import { BalanceLogEntity } from './entities/balance-log.entity';
import { BalanceLogAction } from './enums/balance-log-action.enum';

dotenv.config({ path: '.env' });

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  username: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  entities: [UserEntity, BalanceLogEntity],
  synchronize: false,
});

export async function seed() {
  console.log('Seeding database...');

  await dataSource.initialize();

  try {
    const users = await dataSource.transaction(async (manager) => {
      const userRepository = manager.getRepository(UserEntity);
      const balanceLogRepository = manager.getRepository(BalanceLogEntity);

      const initialBalance = BigInt(10000);
      let user = await userRepository.findOne({ where: { id: 1 } });
      if (!user) {
        user = await userRepository.save(
          userRepository.create({ id: 1, balance: initialBalance }),
        );
      }

      const initialLogKey = 'seed-user-1-initial-balance';
      const initialLog = await balanceLogRepository.findOne({
        where: { idempotencyKey: initialLogKey },
      });
      if (!initialLog) {
        await balanceLogRepository.save(
          balanceLogRepository.create({
            userId: user.id,
            action: BalanceLogAction.CREDIT,
            amount: initialBalance,
            idempotencyKey: initialLogKey,
          }),
        );
      }

      return [user];
    });

    console.log(`Created ${users.length} users and balance logs`);
    return users;
  } finally {
    await dataSource.destroy();
  }
}

seed()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error seeding database:', error);
    process.exit(1);
  });
