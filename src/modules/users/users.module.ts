import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm/dist/typeorm.module';
import { UserEntity } from '../common/database/entities/user.entity';
import { BalanceLogEntity } from '../common/database/entities/balance-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, BalanceLogEntity])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
