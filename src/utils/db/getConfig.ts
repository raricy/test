import * as dotenv from 'dotenv';
import { merge } from 'lodash';
import { loadConfig } from '../../modules/common/config/loadConfig';
import { ServerConfigInterface } from '../../interfaces/server-config.interface';
import { validationSchema } from '../../modules/common/config/validationSchema';

let loaded: ServerConfigInterface;

export function getConfig(): ServerConfigInterface {
  if (loaded) {
    return loaded;
  }

  dotenv.config();

  const { error, value } = validationSchema.validate(process.env, {
    abortEarly: false,
    allowUnknown: true,
  });

  if (error) {
    throw new Error(`Config validation error: ${error.message}`);
  }

  process.env = merge(process.env, value);

  loaded = loadConfig();

  return loaded;
}
