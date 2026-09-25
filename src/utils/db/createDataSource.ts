import { DataSource } from 'typeorm';
import * as path from 'node:path';
import { ServerConfigInterface } from '../../interfaces/server-config.interface';

const entities = [
  path.join(
    __dirname,
    '..',
    '..',
    'modules/common/database/entities/**/*.{ts,js}',
  ),
];

const migrations = [path.join(process.cwd(), 'migrations/**/*.{ts,js}')];

export function createDataSource(config: ServerConfigInterface['db']) {
  const dataSource = new DataSource({
    type: 'postgres',
    host: config.host,
    database: config.name,
    port: config.port,
    username: config.username,
    password: config.password,
    entities,
    logging: true,
    synchronize: false,
    migrations,
  });

  return dataSource;
}
