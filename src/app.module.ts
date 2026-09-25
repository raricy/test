import { Module } from '@nestjs/common';
import { AllExceptionsFilter } from './filters/all-exceptions.filter';
import { APP_FILTER } from '@nestjs/core';
import { ConfigModule } from './modules/common/config/ConfigModule';
import { DatabaseModule } from './modules/common/database/database.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [ConfigModule, DatabaseModule, UsersModule],
  controllers: [],
  providers: [
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class AppModule {}
