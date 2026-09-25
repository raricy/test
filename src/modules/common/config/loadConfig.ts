import { EnvInterface } from '../../../interfaces/env.interface';
import { ServerConfigInterface } from '../../../interfaces/server-config.interface';

export const loadConfig = (): ServerConfigInterface => {
  const env = process.env as unknown as EnvInterface;

  return {
    env: env.NODE_ENV,

    port: parseInt(env.PORT, 10) || 3000,

    swagger: {
      mount: env.SWAGGER_MOUNT,
    },

    db: {
      host: env.DATABASE_HOST,
      port: parseInt(env.DATABASE_PORT, 10) || 5432,
      username: env.DATABASE_USER,
      password: env.DATABASE_PASSWORD,
      name: env.DATABASE_NAME,
    },
  };
};
