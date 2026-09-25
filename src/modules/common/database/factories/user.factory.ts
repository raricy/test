import { faker } from '@faker-js/faker';
import { Repository } from 'typeorm';
import { UserEntity } from '../entities/user.entity';

export class UserFactory {
  constructor(private readonly repository: Repository<UserEntity>) {}

  async create(overrides: Partial<UserEntity> = {}) {
    const user = this.repository.create({
      balance: BigInt(faker.number.int({ min: 0, max: 10000 })),
      ...overrides,
    });

    return this.repository.save(user);
  }

  async createMany(count: number, overrides: Partial<UserEntity> = {}) {
    const users: UserEntity[] = [];
    for (let index = 0; index < count; index += 1) {
      users.push(await this.create(overrides));
    }
    return users;
  }
}
