import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServerConfigInterface } from '../../../interfaces/server-config.interface';

export const DatabaseModule = TypeOrmModule.forRootAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (configService: ConfigService<ServerConfigInterface>) => ({
    type: 'postgres' as const,
    host: configService.get('db.host', { infer: true }),
    port: configService.get('db.port', { infer: true }),
    username: configService.get('db.username', { infer: true }),
    password: configService.get('db.password', { infer: true }),
    database: configService.get<string>('db.name', { infer: true }),
    synchronize: false,
    autoLoadEntities: true,
    retryAttempts: configService.get('env') !== 'production' ? 0 : 10,
  }),
});
