require('dotenv/config');

import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { loadConfig } from './loadConfig';

export const ConfigModule = NestConfigModule.forRoot({
  isGlobal: true,
  load: [loadConfig],
  ignoreEnvFile: true,
});
